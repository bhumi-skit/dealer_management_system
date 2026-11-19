//import the schema 
const EntryLog = require("./models/EntryLog");
const Alert = require("./models/Alert");

async function executeTool(toolName , args){
    console.log(`[Agent] Executing : ${toolName}`,args);

    if(toolName === "flag_vehicle"){
        const entry = await EntryLog.findByIdAndUpdate(
            args.entryId ,{
                isFlagged:true,
                flagReason: args.reason,
                flagSeverity: args.severity,
                flaggedAt: new Date(),
            },
            {new : true }
        );
        return `Flagged vehicle ${entry?.vehicleNumber} - ${args.reason}`;
    }

    //to send the alert of the vehicle 
    if(toolName === "send_alert"){
        const alert = new Alert({
            message:args.message,
            severity:args.severity
        });
        await alert.save();
        return `Saved high priority alert: ${args.message}`;
    }

    //to get the overdue vehicle 
    if(toolName === "mark_overdue"){
        const entry = await EntryLog.findByIdAndUpdate(
            args.entryId,{
                status:"OVERDUE",
                exitReason:args.reason
            },
            {new:true }
        );
        return `Marked entry ${args.entryId} for vehicle ${entry?.vehicleNumber} as OVERDUE`;
    }

    //to get the history of same vehicle 
    if(toolName==="query_vehicle_history"){
        const history = await EntryLog.find({
            vehicleNumber:args.vehicleNumber.toLowerCase()
        }).sort({enteredAt:-1}).limit(5);

        //stringify --> converts a js object or array into a json string 
        return JSON.stringify(history.map(h=>({
            enteredAt:h.enteredAt,
            exitedAt:h.exitedAt,
            status:h.status,
            purpose:h.purpose,
            isFlagged :h.isFlagged,
        })));
    }

    //this is for generating the report of summary of a vehicle
    if(toolName==="generate_shift_report"){
        const todayShift = new Date();
        todayShift.setHours(0,0,0,0);

        const logs = await EntryLog.find({enteredAt:{$gte:todayShift}});

        const summary = `Shift: ${args.shiftName} | Total logs:${logs.length} |
        Inside:${logs.filter(l=>l.status === "INSIDE").length}`;
        return summary;
    }

    return "Unknown tool";
}


module.exports= {executeTool};