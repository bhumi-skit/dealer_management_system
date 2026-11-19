const { GoogleGenerativeAI } = require("@google/generative-ai");
const EntryLog = require("./models/EntryLog");
const { executeTool } = require("./toolExecutor");

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const tools = [
    {
        functionDeclarations: [
            {
                name: "flag_vehicle",
                description: "Flag a vehicle entry as suspicious.",
                parameters: {
                    type: "object",
                    properties: {
                        entryId: {
                            type: "string",
                            description: "The Mongo _id of the vehicle entry to flag"
                        },
                        reason: {
                            type: "string",
                            description: "Why this vehicle entry is suspicious"
                        },
                        severity: {
                            type: "string",
                            enum: ["low", "medium", "high"],
                            description: "How serious the problem is"
                        },
                    },
                    required: ["entryId", "reason", "severity"]
                }
            },
            {
                name:"send_alert",
                description:"Send a critical security alert notification to administrator,",
                parameters:{
                    type:"object",
                    properties:{
                        message:{type:"string",description:"The alert message details"},
                        severity:{type:"string",enum:["medium","high"],
                        description:"The severity level of the alert"
                        },
                    },
                    required:["message","severity"]
                },
                
            },
            {
                name:"mark_overdue",
                description:"Mark a vehicle log as overdue when its exceeds its expected return",
                parameters:{
                    type:"object",
                    properties:{
                        entryId:{type:"string",description:"The Mongo_id of the entry to mark overdue."},
                        reason:{type:"string",description:"Why it is overdue.."
                        },
                    },
                    required:["entryId","reason"]
                },
            },
            //this will run when a user want to see past records of a vehicle 
            
            {
                name:"query_vehicle_history",
                description:"Fetch entry history logs for a specific vehicle to identify repeated suspicious behaviour",
                parameters:{
                    type:"object",
                    properties:{
                        vehicleNumber:{
                            type:"string",
                            description:"The licence plate vehicle number.."
                            // reason:{type:"string",description:"Why it is overdue.."
                        }   
                        },
                        required:["vehicleNumber"]
                    } 
                },
                {
                    name:"generate_shift_report",
                    description:"Generate a summary report of all entries and exits during the current shifts.",
                    parameters : {
                        type:"object",
                        properties:{
                            shiftName:{
                                type:"string",
                                enum:["Morning","Afternoon","Night"],
                                description:"The name of the shift,"
                            },
                        },
                        required:["shiftName"]
                    }
                }
              ]
            }
        ];
    
function getTodayStart() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
}

function groupEntriesByVehicle(entries) {
    return entries.reduce((groups, entry) => {
        const vehicleNumber = entry.vehicleNumber;
        if (!vehicleNumber) return groups;
        groups[vehicleNumber] = groups[vehicleNumber] || [];
        groups[vehicleNumber].push(entry);
        return groups;
    }, {});
}

function buildSummary(vehicleGroups) {
    return Object.entries(vehicleGroups).map(([vehicleNo, visits]) => {
        const sortedVisits = [...visits].sort((a, b) => new Date(a.enteredAt) - new Date(b.enteredAt));
        const times = sortedVisits.map(v => new Date(v.enteredAt).toLocaleTimeString()).join(", ");
        const alreadyFlagged = sortedVisits.some(v => v.isFlagged);
        const latestVisit = sortedVisits[sortedVisits.length - 1];
        const latestHour = new Date(latestVisit.enteredAt).getHours();

        return `Vehicle:${vehicleNo} | Type:${latestVisit.vehicleType} | TodayCount:${sortedVisits.length} | ` +
            `EntryTimes:${times} | LatestEntryId:${latestVisit._id} | ` +
            `LatestHour:${latestHour} | AnyFlagged:${alreadyFlagged}`;
    }).join("\n");
}

function getLocalRuleCalls(vehicleGroups) {
    const calls = [];

    for (const [vehicleNo, visits] of Object.entries(vehicleGroups)) {
        const sortedVisits = [...visits].sort((a, b) => new Date(a.enteredAt) - new Date(b.enteredAt));
        if (sortedVisits.some(v => v.isFlagged)) continue;

        const latestVisit = sortedVisits[sortedVisits.length - 1];
        const latestHour = new Date(latestVisit.enteredAt).getHours();

        if (sortedVisits.length > 2) {
            calls.push({
                name: "flag_vehicle",
                args: {
                    entryId: latestVisit._id.toString(),
                    reason: `Vehicle ${vehicleNo} entered ${sortedVisits.length} times today`,
                    severity: "high",
                },
            });
            continue;
        }

        if (latestVisit.vehicleType === "HEAVY_VEHICLE" && (latestHour >= 22 || latestHour <= 6)) {
            calls.push({
                name: "flag_vehicle",
                args: {
                    entryId: latestVisit._id.toString(),
                    reason: `Heavy vehicle ${vehicleNo} entered during restricted hours`,
                    severity: "high",
                },
            });
            continue;
        }

        if (sortedVisits.length === 2) {
            const [firstVisit, secondVisit] = sortedVisits;
            const minutesApart = Math.abs(new Date(secondVisit.enteredAt) - new Date(firstVisit.enteredAt)) / 60000;
            if (minutesApart < 60) {
                calls.push({
                    name: "flag_vehicle",
                    args: {
                        entryId: latestVisit._id.toString(),
                        reason: `Vehicle ${vehicleNo} entered twice within ${Math.round(minutesApart)} minutes`,
                        severity: "medium",
                    },
                });
            }
        }
    }

    return calls;
}

async function getGeminiCalls(summary) {
    if (!genAI) {
        console.warn("[Agent] GEMINI_API_KEY is missing. Using local rules only.");
        return [];
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", tools });

    const prompt = `You are GuardianAgent, an autonomous security AI for a gated facility in India.

Rules:
- Flag if TodayCount is MORE THAN 2 for any vehicle - severity: high
- Flag HEAVY_VEHICLE if LatestHour is >= 22 or <= 6 - severity: high
- Flag if TodayCount is exactly 2 and entries are less than 1 hour apart - severity: medium
- Skip vehicles where AnyFlagged is already true
- If nothing suspicious, do nothing at all

Today's grouped vehicle data:
${summary}`;

    const result = await model.generateContent(prompt);
    return result.response.functionCalls?.() || [];
}

async function runAgentCycle() {
    console.log("[Agent] Running Cycle...");

    const entries = await EntryLog.find({
        enteredAt: { $gte: getTodayStart() }
    }).lean();

    if (entries.length === 0) {
        console.log("[Agent] no entries found today");
        return;
    }

    const vehicleGroups = groupEntriesByVehicle(entries);
    const localRuleCalls = getLocalRuleCalls(vehicleGroups);
    let functionCalls = localRuleCalls;

    try {
        const geminiCalls = await getGeminiCalls(buildSummary(vehicleGroups));
        if (geminiCalls.length > 0) {
            functionCalls = geminiCalls;
        }
    } catch (err) {
        console.error("[Agent] Gemini failed. Continuing with local rules:", err.message);
    }

    if (functionCalls.length > 0) {
        for (const call of functionCalls) {
            const res = await executeTool(call.name, call.args);
            console.log(`[Agent] ${res}`);
        }
    }
    else {
        console.log("[Agent] All clear this cycle..");
    }
}

function startAgent() {
    console.log("[GuardianAgent] starting....");
    
    async function nextCycle() {
        try {
            await runAgentCycle();
        } catch (err) {
            console.error("[Agent] Cycle failed:", err.message);
        } finally {
            setTimeout(nextCycle, 2 * 60 * 1000);
        }
    }

    nextCycle();
}

module.exports = { startAgent };
