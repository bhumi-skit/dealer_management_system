const express = require("express");
const router = express.Router();
const {GoogleGenerativeAI} = require("@google/generative-ai");
const {protect} = require("../middleware/authMiddleware");
const EntryLog = require("../models/EntryLog");

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

function todayStart(){
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
}

function buildStats(logs){
    return{
        todayTotal:logs.length,
        inside:logs.filter((l)=>l.status==="INSIDE").length,
        exited:logs.filter((l)=>l.status==="EXITED").length,
        overdue:logs.filter((l)=>l.status==="OVERDUE").length,
        isFlagged:logs.filter((l)=>l.isFlagged).length,
    };
}
function maskVehicle(vehicleNumber=""){
    if(!vehicleNumber) return "";
    if(vehicleNumber.length <= 4)return "****";

    return `${vehicleNumber.slice(0,2)}****${vehicleNumber.slice(-2)}`;  //it returns RJ****90 //-2 return last two char and (0,2) returns 0-1 char
}
//sanitize logs like only 20 entries and make it role speific 
function sanitizeLogsForRole(logs,role){

    return logs.slice(0,20).map((log)=>{

        //viewer can only see the summary 
        if(role==="viewer"){
            return{
                vehicleNumber : maskVehicle(log.vehicleNumber),
                vehicleType:log.vehicleType,
                purpose : log.purpose,
                status:log.status,
                enteredAt:log.enteredAt,
                isFlagged:log.isFlagged,
                flagSeverity:log.flagSeverity,
            };
        }
        //guard and admin can see the full operational details
        return {
            vehicleNumber:log.vehicleNumber,
            vehicleType:log.vehicleType,
            visitorName:log.visitorName,
            purpose :log.purpose,
            status:log.status,
            enteredAt:log.enteredAt,
            exitedAt : log.exitedAt,
            isFlagged: log.isFlagged,
            flagReason:log.isFlagged?log.flagReason:"",
            flagSeverity:log.flagSeverity,
        }
    })
}

function buildLocalReply(message, stats, logs) {
    const text = message.toLowerCase();
    const flagged = logs.filter((log) => log.isFlagged);
    const overdue = logs.filter((log) => log.status === "OVERDUE");
    const inside = logs.filter((log) => log.status === "INSIDE");

    if (text.includes("flag") || text.includes("risk") || text.includes("suspicious")) {
        if (flagged.length === 0) {
            return `No flagged vehicles found today. Current status: ${stats.inside} inside, ${stats.overdue} overdue, ${stats.todayTotal} total logs.`;
        }

        return `Today ${flagged.length} vehicle(s) are flagged: ` +
            flagged.slice(0, 5).map((log) =>
                `${log.vehicleNumber} (${log.flagSeverity || "low"}) - ${log.flagReason || "No reason provided"}`
            ).join("; ");
    }

    if (text.includes("overdue")) {
        if (overdue.length === 0) {
            return "No overdue vehicles found right now.";
        }

        return `Overdue vehicles: ` +
            overdue.slice(0, 5).map((log) => `${log.vehicleNumber} - ${log.purpose || "No purpose"}`).join("; ");
    }

    if (text.includes("inside")) {
        return `${inside.length} vehicle(s) are currently inside. ` +
            inside.slice(0, 5).map((log) => log.vehicleNumber).join(", ");
    }

    return `Today's security summary: ${stats.todayTotal} total logs, ${stats.inside} inside, ${stats.exited} exited, ${stats.overdue} overdue, and ${stats.isFlagged} flagged.`;
}

router.post("/chat",protect,async(req,res)=>{
    try{
        const{message,history=[]} = req.body;

        if(!message?.trim()){
            return res.status(400).json({message:"Message is required"});
        }
        if(!genAI){
            return res.status(500).json({message:"Gemini API key is missing "});
        }

        const logs = await EntryLog.find({
            enteredAt:{$gte:todayStart()},
        }).sort({enteredAt:-1}).limit(80).lean();
        //here we are saying that provide only 80 log records and mongoose documnent is not a plain js so for converting it we need lean which is a inbuilt method of mongoose 

        const role = req.user.role;
        const stats = buildStats(logs);
        const safeLogs = sanitizeLogsForRole(logs,role);

        const systemInstruction = 
        ` You are a Guardian Assistant for a vehicle dealership security system.
    
        User role:${role}
        
        Rules :
        -Be concise and practical 
        - Do not expose phone numbers or ID card numbers.
        -If the user is viewer, only provide the general summaries.
        - If the user is guard give operational advice.
        - If the user is admin provide full risk summaries and management insights.
        - Never invent records. Use only the provided context.
        - If asked to change data, tell the user to use the dashboard actions.

        Today's stats logs :
        ${JSON.stringify(stats)} 
        // converts the object into string 

        Recent safe logs :
        ${JSON.stringify(safeLogs)} `;

        try {
            const model = genAI.getGenerativeModel({
                model:"gemini-2.5-flash",
                systemInstruction,
            });

            const chat = model.startChat({history});
            const result = await chat.sendMessage(message);

            res.status(200).json({
                reply:result.response.text(),
                stats,
                source:"gemini",
            });
        } catch (aiErr) {
            console.error("Gemini call failed:", aiErr.message);
            res.status(200).json({
                reply: buildLocalReply(message, stats, safeLogs),
                stats,
                source:"local-fallback",
                warning:"Gemini is unavailable, so this answer used local log rules.",
            });
        }
    }
    catch(err){
        console.error("Agent chat error:",err);
        res.status(500).json({message:"Failed to communicate with AI agent."});
    }
});

module.exports = router;
