const { chromium } = require('../../node_modules/playwright');
const path = require('path');
const { pathToFileURL } = require('url');
(async () => {
  const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.resolve(__dirname,'upsc_syllabus_hi.html')).href);
  await page.pdf({path:path.resolve(__dirname,'../../output/pdf/UPSC_CSE_Syllabus_Hindi_A4.pdf'),format:'A4',printBackground:true,displayHeaderFooter:false,preferCSSPageSize:true});
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
