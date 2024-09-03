// uses AI to create web scraping instructions based on the user's requirements

import OpenAI from 'openai';
import env from 'dotenv';
env.config();

const openai = new OpenAI();

// ai "agents" that could be used for automatic web scraper creation:
//   planner: comes up with a plan for a project and instructs other agents on how to complete this plan
//   worker: follows instructions from the planner to create the web scraper, and may ask for clarification from the planner
//   data collector: provides the worker a more abstract view of the data that can be collected.  This might use an LLM or it could be just a tool that the worker uses to view large html documents more efficiently
//   tester: runs the web scraper after it has been created to ensure that the data is being collected correctly
class agent {
    constructor(name, model, systemPrompt){
        this.name = name;
        this.model = model;
        this.history = [
            {role: "system", content: systemPrompt}
        ];
    }
    
    // function to message the agent. Returns the agent's response
    async message(content){
        const completion = await openai.chat.completions.create({
            model: this.model,
            messages: this.history.concat({role: "user", content: content}),
        });
        this.history.push({role: "user", content: content});
        this.history.push({role: "system", content: completion.choices[0].message.content});
        return completion.choices[0].message.content;
    }

}

// create a web scraper based on the user's requirements
async function createScraper({model, url, output_format, instructions, output}){
    const completion = await openai.chat.completions.create({
        model: model,
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            {
                role: "user",
                content: "Create a web scraper for me.",
            },
        ],
    });
    return completion;
}
// const completion = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [
//         { role: "system", content: "You are a helpful assistant." },
//         {
//             role: "user",
//             content: "Explain quantum physics.",
//         },
//     ],
// });


export default 1;