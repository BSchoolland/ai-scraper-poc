import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

export default class WebScraper {
  constructor(isStealthNeeded = false) {
    this.isStealthNeeded = isStealthNeeded;
    this.browser = null;
    this.page = null;
    this.currentUrl = null;
  }

  async init() {
    if (this.isStealthNeeded) {
      puppeteer.use(StealthPlugin());
    }
    this.browser = await puppeteer.launch({ headless: false });
    this.page = await this.browser.newPage();
  }

  async goTo(url) {
    this.currentUrl = url;
    await this.page.goto(url);
  }

  
}