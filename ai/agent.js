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
        this.report = null;
        this.overseeing_agent = false;
    }

    addTools(tools) {
        this.tools = this.tools.concat(tools)
    }

    // function to assign an agent a task. returns a report on the status after completion or failure
    // useful for complex actions that this agent may need to take
    async doTask(taskDescription, assigner) {
        this.report = null
        this.assigner = assigner
        const expandedTools = this.expand_tools()
        const justTools = expandedTools.map(tool => tool.tool)

        let response = await openai.chat.completions.create({
            model: this.model,
            messages: this.history.concat({ role: "user", content: `${assigner?.name || "The user"} needs you to do a task:\n ${taskDescription}\n Once you have completed this task, call the task_complete() or task_failed() function.` }),
            tools: justTools
        });

        let tool_calls = response.choices[0].message.tool_calls

        this.history.push({ role: "assistant", content: response.choices[0].message.content || "", tool_calls: tool_calls })
        while (!this.report) {
            tool_calls = response.choices[0].message.tool_calls
            if (!tool_calls) {
                console.warn("No tool calls")
                this.history.push({ role: "user", content: "You should only be making tool calls to complete your task, not replying directly.  Keep trying, your task has not failed!" })
                response = await openai.chat.completions.create({
                    model: this.model,
                    messages: this.history,
                    tools: justTools
                });

                this.history.push({ role: "assistant", content: response.choices[0].message.content || ""})
            } else {
                // perform the tool calls
                for (let tool_call of tool_calls) {
                    var function_name = tool_call.function.name
                    // get the callback function for the tool
                    var callback = expandedTools.find(tool => tool.tool.function.name == function_name).callback
                    // get the arguments for the tool
                    var function_arguments = JSON.parse(tool_call.function.arguments)
                    // call the callback function with the arguments
                    var tool_response = await callback(function_arguments, this)
                    // add the response to the history
                    this.history.push({
                        role: "tool", content: JSON.stringify({ function_name: function_name, arguments: function_arguments, response: tool_response }),
                        tool_call_id: tool_call.id
                    })
                }
                if (this.report) {
                    break
                }
                console.log(this.history)
                response = await openai.chat.completions.create({
                    model: this.model,
                    messages: this.history,
                    tools: justTools
                });
                tool_calls = response.choices[0].message.tool_calls
                this.history.push({ role: "assistant", content: response.choices[0].message.content || "", tool_calls: tool_calls })
            }
            sleep(3000) // here for now, to prevent me from accidentally spamming the API
        }
        return this.report
    }

    // function to mark a task as complete.  Provides a report on the status of the task
    // useful for when the agent has successfully completed a task
    async task_complete(args, agent) {
        console.log("Task complete: ", args.report)
        agent.report = args.report
        agent.assigner = null
        return null
    }
    // function to mark a task as failed.  Provides a report on the status of the task
    // useful for when the agent has failed to complete a task
    async task_failed(args, agent) {
        console.log("Task failed: ", args.report)
        agent.report = args.report
        agent.assigner = null
        return null
    }
    // function to message the agent that assigned the task.  Returns that agent's response to the message
    // useful for a quick question or brief interaction with the agent.
    async message_assigner(args, agent) {
        let mail = agent.name + " says: " + args.message
        return await agent.assigner.message(mail)
    }
    // function to message the agent without giving it access to tools. Returns the agent's response
    // useful for a quick question or brief interaction with the agent. 
    async message(content) {
        if (this.overseeing_agent) {
            let lastHistoryEntry = this.history[this.history.length - 1];
            lastHistoryEntry.tool_calls.forEach(toolCall => {
                this.history.push({
                    role: "tool",
                    content: 'Agent needs further clarification. Please respond without a tool call.',
                    tool_call_id: toolCall.id
                });
            });
        }
        const response = await openai.chat.completions.create({
            model: this.model,
            messages: this.history.concat({ role: "user", content: content }),
        });
        // remove the last history entry, as it was just a placeholder
        this.history.pop()
        return response.choices[0].message.content;
    }

    expand_tools() {
        var newTools =  this.tools.concat([
            {
                tool: {
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
                callback: this.task_complete
            },
            {
                tool: {
                    "type": "function",
                    "function": {
                        "name": "task_failed",
                        "description": "Marks your current task as failed.  Do not use this unless you have exhausted all other options including messaging the assigner. This is not intended to be used when you make a correctable mistake, but when you are completely unable to complete the task.",
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
                callback: this.task_failed
            }
        ])

        if (this.assigner) {
            newTools.push(
            {
                tool: {
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
                callback: this.message_assigner
            })
        }
        return newTools
    }
}

export default Agent;