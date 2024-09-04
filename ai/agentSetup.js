import Agent from "./agent.js";

const ProjectLead = new Agent('Project Lead', 'gpt-4o-mini', 'You are a capable AI system that leads a team of agents based on the given requirements.  Your job is to create a comprehensive plan for the project, assign tasks to the other agents, and then once the project is complete, review the results and send them to the user.');

const BrowserAgent = new Agent('Browser Agent', 'gpt-4o-mini', 'You are an AI agent that can navigate the web and interact with web pages.  Use the provided tools to gather the requested information and report back to your assigner.');

const ScraperAgent = new Agent('Scraper Agent', 'gpt-4o-mini', 'You are a web scraping AI agent that can configure a web scraper to collect data from a website.  You should be given clear instructions on the URL to scrape and the css selectors to target.  You focus on creating a scraper that is able to generalize to new pages on the same website.');

const QualityControlAgent = new Agent('Quality Control Agent', 'gpt-4o-mini', 'You are a quality control AI agent that can test the web scraper to ensure that it is collecting the correct data.  You should create a set of test cases to run against the scraper and ensure that the data you receive makes sense and is in the correct format.');

const ProjectLeadTools = [
    {
        tool: {
            "type": "function",
            "function": {
                "name": "assign_browser_agent",
                "description": "Assigns the browser agent to navigate the web and gather information on the structure of a website.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "task": {
                            "type": "string",
                            "description": "The task you want the browser agent to complete. Should include the URL of the website to explore and any other relevant information.",
                        },
                    },
                    "required": ["task"],
                    "additionalProperties": false,
                },
            }
        },
        callback: async (args, agent) => {
            agent.overseeing_agent = true
            const result = await BrowserAgent.doTask(args.task, agent)
            agent.overseeing_agent = false
            return result
        }
    },
    // {
    //     tool: {
    //         "type": "function",
    //         "function": {
    //             "name": "assign_scraper_agent",
    //             "description": "Assigns the scraper agent to create a web scraper based on the given instructions.",
    //             "parameters": {
    //                 "type": "object",
    //                 "properties": {
    //                     "task": {
    //                         "type": "string",
    //                         "description": "The task you want the scraper agent to complete. Should include a step-by-step explanation of the steps and selectors to use in the web scraper.",
    //                     },
    //                 },
    //                 "required": ["task"],
    //                 "additionalProperties": false,
    //             },
    //         }
    //     },
    //     callback: async (args, agent) => {
    //         agent.overseeing_agent = true
    //         const result = await ScraperAgent.doTask(args.task, agent)
    //         agent.overseeing_agent = false
    //         return result
    //     }
    // },
    // {
    //     tool: {
    //         "type": "function",
    //         "function": {
    //             "name": "assign_quality_control_agent",
    //             "description": "Assigns the quality control agent to test the web scraper and ensure that it is collecting the correct data.",
    //             "parameters": {
    //                 "type": "object",
    //                 "properties": {
    //                     "task": {
    //                         "type": "string",
    //                         "description": "The task you want the quality control agent to complete. Should include the expected output format.",
    //                     },
    //                 },
    //                 "required": ["task"],
    //                 "additionalProperties": false,
    //             },
    //         }
    //     },
    //     callback: async (args, agent) => {
    //         agent.overseeing_agent = true
    //         const result = await QualityControlAgent.doTask(args.task, agent)
    //         agent.overseeing_agent = false
    //         return result
    //     }
    // }
];

ProjectLead.addTools(ProjectLeadTools);

import BrowserUtilities from './browserUtilities.js'; // an object with utility functions for the browser agent

const browserUtilities = new BrowserUtilities();
await browserUtilities.init();

async function evaluate(args){
    console.log('evaluating function:', args.function);
    const func = new Function('return ' + args.function)();
    return await browserUtilities.evaluate(func);
}

async function goTo(args){
    console.log('going to:', args.url);
    return await browserUtilities.goTo(args.url);
}

async function getFullHTML(){
    return await browserUtilities.getFullHTML();
}

const BrowserAgentTools = [
    // {
    //     tool: {
    //         "type": "function",
    //         "function": {
    //             "name": "create_log_of_actions",
    //             "description": "Creates a full log of all actions you have taken while navigating the web and sends it to the project lead for review.",
    //             "parameters": {
    //                 "type": "object",
    //                 "properties": {},
    //                 "required": [],
    //                 "additionalProperties": false,
    //             },
    //         }
    //     },
    //     callback: BrowserUtilities.createLogOfActions
    // },
    {
        tool: {
            "type": "function",
            "function": {
                "name": "goTo",
                "description": "Navigates to the given URL in the browser. Does not return the full HTML until you call the get_html() function.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "url": {
                            "type": "string",
                            "description": "The URL you want to navigate to.",
                        },
                    },
                    "required": ["url"],
                    "additionalProperties": false,
                },
            }
        },
        callback: goTo
    },
    {
        tool: {
            "type": "function",
            "function": {
                "name": "getFullHTML",
                "description": "Returns the full HTML of the current page you are on, allowing for in depth use of css selectors.",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": [],
                    "additionalProperties": false,
                },
            }
        },
        callback: getFullHTML
    },
    {
        tool: {
            "type": "function",
            "function": {
                "name": "evaluate",
                "description": "Evaluates the given JavaScript function in the context of the current page and returns the result.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "function": {
                            "type": "string",
                            "description": `The JavaScript function you want to evaluate, for example: 
() => {
    return document.querySelector('title').innerText;
} `,
                        },
                    },
                    "required": ["function"],
                    "additionalProperties": false,
                },
            }
        },
        callback: evaluate
    },
    // {
    //     tool: {
    //         "type": "function",
    //         "function": {
    //             "name": "click_element",
    //             "description": "Clicks on the element with the given CSS selector on the current page, allowing you to navigate to a new page or interact with a dynamic element.",
    //             "parameters": {
    //                 "type": "object",
    //                 "properties": {
    //                     "selector": {
    //                         "type": "string",
    //                         "description": "The CSS selector of the element you want to click on.",
    //                     },
    //                 },
    //                 "required": ["selector"],
    //                 "additionalProperties": false,
    //             },
    //         }
    //     },
    //     callback: BrowserUtilities.clickElement
    // }
];

BrowserAgent.addTools(BrowserAgentTools);

const ScraperAgentTools = [
    {
        tool: {
            "type": "function",
            "function": {
                "name": "scraper_go_to_url",
                "description": "Appends a command to go to the given URL to the scraper's instructions.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "url": {
                            "type": "string",
                            "description": "The URL you want the scraper to navigate to.",
                        },
                    },
                    "required": ["url"],
                    "additionalProperties": false,
                },
            }
        },
        callback: (args, agent) => {
            return 'not implemented'
        }
    },
    {
        tool: {
            "type": "function",
            "function": {
                "name": "scraper_extract_text",
                "description": "Appends a command to extract text from the element with the given CSS selector to the scraper's instructions.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "selector": {
                            "type": "string",
                            "description": "The CSS selector of the element you want to extract text from.",
                        },
                    },
                    "required": ["selector"],
                    "additionalProperties": false,
                },
            }
        },
        callback: (args, agent) => {
            return 'not implemented'
        }
    },
    {
        tool: {
            "type": "function",
            "function": {
                "name": "scraper_save_output",
                "description": "Appends a command to save the output of the scraper to the given file path.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "file_path": {
                            "type": "string",
                            "description": "The file path you want to save the output to.",
                        },
                    },
                    "required": ["file_path"],
                    "additionalProperties": false,
                },
            }
        },
        callback: (args, agent) => {
            return 'not implemented'
        }
    }
];

ScraperAgent.addTools(ScraperAgentTools);

const QualityControlAgentTools = [];

QualityControlAgent.addTools(QualityControlAgentTools);

export default ProjectLead;