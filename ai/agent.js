import OpenAI from 'openai';
import env from 'dotenv';
env.config();

const openai = new OpenAI();


// an agent is a class that behaves as an independent system with a specific goal. 
// agents start be being assigned a task
// agents have their own history, and their scope is limited to the interactions they have been involved in
// agents may have access to other agents to assign tasks
// agents may have access to specific tools that can help with their tasks
// once an agent is done with its task, it sends a report back to the agent that assigned the task

async function sleep(ms) {  
    return new Promise(resolve => setTimeout(resolve, ms));
}

class Agent {
    constructor(name, model, systemPrompt, tools = []) {
        this.name = name;
        this.model = model;
        this.history = [
            { role: "system", content: systemPrompt }
        ];
        this.tools = tools;
        this.assigner = null;
    }

    // function to assign an agent a task. returns a report on the status after completion or failure
    // useful for complex actions that this agent may need to take
    async doTask(taskDescription, assigner) {
        this.assigner = assigner
        const expandedTools = this.expand_tools()
        let isTaskEnded = false // has the task been completed or failed
        let response = await openai.chat.completions.create({
            model: this.model,
            messages: this.history.concat({ role: "user", content: `${assigner.name} needs you to do a task:\n ${taskDescription}\n Once you have completed this task, call the task_complete() or task_failed() function.` }),
            tools: expandedTools
        });

        let tool_calls = response.choices[0].message.tool_calls

        this.history.push({ role: "assistant", content: response.choices[0].message.content, tool_calls: tool_calls })
        while (!isTaskEnded) {
            if (!tool_calls) {
                console.warn("No tool calls")
                this.history.push({ role: "system", content: "Error: You should only be making tool calls to complete your task, not replying directly.  If you need to ask a question, use the message_assigner() function, but this should be a last resort." })
                let response = await openai.chat.completions.create({
                    model: this.model,
                    messages: this.history,
                    tools: expandedTools
                });
                
                this.history.push({ role: "assistant", content: response.choices[0].message.content })
            } else {
                // perform the tool calls
                for (let tool_call of tool_calls) {
                    var function_name = tool_call.function.name
                    console.log('function name: ', tool_call)
                    if (function_name == "message_assigner") {
                        var function_arguments = JSON.parse(tool_call.function.arguments)
                        var assignerResponse = await this.message_assigner(function_arguments.message)
                        this.history.push({
                            role: "tool", content: JSON.stringify({
                                message: function_arguments.message,
                                response: assignerResponse,
                            }),
                            tool_call_id: tool_call.id
                        })
                    } else if (function_name == "task_complete") {
                        var function_arguments = JSON.parse(tool_call.function.arguments)
                        isTaskEnded = true
                        break
                    } else if (function_name == "task_failed") {
                        var function_arguments = JSON.parse(tool_call.function.arguments)
                        isTaskEnded = true
                        break
                    }
                }
                if (isTaskEnded) {
                    break
                }
                let response = await openai.chat.completions.create({
                    model: this.model,
                    messages: this.history,
                    tools: expandedTools
                });
                tool_calls = response.choices[0].message.tool_calls
                this.history.push({ role: "assistant", content: response.choices[0].message.content, tool_calls: tool_calls })
            }
            sleep(3000) // here for now, to prevent me from accidentally spamming the API
        }
        console.log("DONE")
    }

    async message_assigner(message) {
        return await this.assigner.message(message)    
    }
    // function to message the agent without giving it access to tools. Returns the agent's response
    // useful for a quick question or brief interaction with the agent. 
    async message(content) {
        const response = await openai.chat.completions.create({
            model: this.model,
            messages: this.history.concat({ role: "user", content: content }),
        });
        this.history.push({ role: "user", content: content });
        this.history.push({ role: "assistant", content: response.choices[0].message.content });
        console.log("system says: ", response.choices[0].message.content)
        return response.choices[0].message.content;
    }

    expand_tools() {
        return this.tools.concat([
            {
                "type": "function",
                "function": {
                    "name": "message_assigner",
                    "description": "Messages the agent that assigned your most recent task.  Returns that agent's response to your message. Call this whenever you need to ask a clarifying question or get additional information from that agent.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "message": {
                                "type": "string",
                                "description": "The message you wish to send.",
                            },
                        },
                        "required": ["message"],
                        "additionalProperties": false,
                    },
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "task_complete",
                    "description": "Marks your current task as complete, and must include a report including any information your assigner requested as well as how the task was completed. Call this when you have successfully completed your task.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "report": {
                                "type": "string",
                                "description": "A report including any information the assigner might need about your task.",
                            },
                        },
                        "required": ["report"],
                        "additionalProperties": false,
                    },
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "task_failed",
                    "description": "Marks your current task as failed.  Must include a report detailing why you were unable to complete your task, and if you were able to partially complete it, how far you got and what useful info you learned.  Try messaging your assigner before calling this function",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "report": {
                                "type": "string",
                                "description": "A report including any information the assigner might need about your task.",
                            },
                        },
                        "required": ["report"],
                        "additionalProperties": false,
                    },
                }
            }
        ])
    }
}
const masterAgent = new Agent('Lead Agent', 'gpt-4o-mini', 'You are an AI agent designed to complete tasks.')

const testAgent = new Agent('test agent', 'gpt-4o-mini', 'You are an AI agent designed to complete tasks. Use tool calls to complete the task.')

await testAgent.doTask("The system we are apart of is in development. I'd like you to confirm your messaging function works.", masterAgent)


export default Agent;