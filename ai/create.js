// uses AI to create web scraping instructions based on the user's requirements


// ai "agents" that could be used for automatic web scraper creation:
//   planner: comes up with a plan for a project and instructs other agents on how to complete this plan
//   worker: follows instructions from the planner to create the web scraper, and may ask for clarification from the planner
//   data collector: provides the worker a more abstract view of the data that can be collected.  This might use an LLM or it could be just a tool that the worker uses to view large html documents more efficiently
//   tester: runs the web scraper after it has been created to ensure that the data is being collected correctly
import ProjectLead from "./agentSetup.js";

console.log(await ProjectLead.doTask("Find an interesting piece of recent tech news and sum it up."));

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