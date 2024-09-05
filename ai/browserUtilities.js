import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
const isStealthNeeded = false;

if (isStealthNeeded) {
  puppeteer.use(StealthPlugin());
}

import { JSDOM } from 'jsdom';

function simplifyHTML(htmlString) {
    const dom = new JSDOM(htmlString);
    const doc = dom.window.document;
    const Node = dom.window.Node; // Access the Node object from jsdom's window
    // log the number of characters in the html
    console.log(htmlString.length);
    // Recursive function to process each element
    function processElement(element) {
        // Ignore elements that are not useful for our scraper
        const ignoredTags = ['script', 'meta', 'img', 'style', 'link'];
        // also ignore elements that are not tags
        if ( element.tagName == undefined || ignoredTags.includes(element.tagName.toLowerCase()) ) {
            return '';
        }

        // Get the tag name
        const tagName = element.tagName.toLowerCase();
        let simplifiedElement = `<${tagName}`;

        // Add class if it exists
        if (element.className) {
            simplifiedElement += ` class="${element.className}"`;
        }

        // Add id if it exists
        if (element.id) {
            simplifiedElement += ` id="${element.id}"`;
        }

        // Close the opening tag
        simplifiedElement += '>';

        // Add the text content if present
        element.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                const textContent = child.textContent.trim();
                if (textContent) {
                    simplifiedElement += textContent;
                }
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                simplifiedElement += processElement(child);
            }
        });

        // Close the tag
        simplifiedElement += `</${tagName}>`;

        return simplifiedElement;
    }

    // Start processing from the body element
    const body = doc.body || doc.documentElement;
    let simplifiedHTML = '';

    // Process all child elements of body
    body.childNodes.forEach(child => {
        simplifiedHTML += processElement(child);
    });
    // log the number of characters in the simplified html
    console.log(simplifiedHTML.length);
    return simplifiedHTML;
}




class BrowserUtilities {
    constructor(){
        this.browser = null;
        this.page = null;
        this.running = false;
    }
    async init(){
        this.browser = await puppeteer.launch({ headless: false });
        this.page = await this.browser.newPage();
        this.running = true;
    }
    async goTo(url){
        if (!this.running){
            await this.init();
        }
        await this.page.goto(url);
    }
    async getFullHTML(){
        if (!this.running){
            await this.init();
        }
        return simplifyHTML(await this.page.content());
    }
    async evaluate(func){
        if (!this.running){
            await this.init();
        }
        try {
            return await this.page.evaluate(func);
        } catch (error){
            return error;
        }
    }
    async close(){
        await this.browser.close();
        this.running = false;
    }
}
// test using evaluate to get the title of example.com
async function testEvaluate(){
    const browserUtilities = new BrowserUtilities();
    await browserUtilities.init();
    await browserUtilities.goTo('https://example.com');
    const funcString = `() => {
        return document.querySelector('title').innerText;
    }`;
    const func = new Function('return ' + funcString)();
    const title = await browserUtilities.evaluate(func);
    console.log(title);
    await browserUtilities.close();
}

testEvaluate();

export default BrowserUtilities;