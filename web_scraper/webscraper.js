import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
const isStealthNeeded = false;

if (isStealthNeeded) {
  puppeteer.use(StealthPlugin());
}
// create a new browser instance
const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();
// scrape data from example.com
await page.goto('https://example.com');
const data = await page.evaluate(() => {
  const title = document.querySelector('div').innerText;
  return title;
});
console.log(data);