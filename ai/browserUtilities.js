import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
const isStealthNeeded = false;

if (isStealthNeeded) {
  puppeteer.use(StealthPlugin());
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
        return await this.page.content();
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