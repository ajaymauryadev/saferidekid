import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const file=pathToFileURL(resolve('SafeRide_Complete_Interactive_UI_Simulation.html')).href;
const out=resolve('docs/phase21/reference');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const cases=[['public','/','public'],['login','/login','public'],['urgent','/urgent','public'],['home-active','/app/home','customer'],['home-no-school','/app/home','new'],['subscription','/app/school','customer'],['children','/app/school/children','customer'],['booking','/app/book','customer'],['payments','/app/payments','customer'],['tracking','/app/school/track','customer'],['owner-dashboard','/owner/dashboard','owner'],['owner-requests','/owner/bookings/requests','owner'],['owner-payments','/owner/finance/verify','owner'],['owner-fees','/owner/finance/fees','owner'],['owner-advances','/owner/finance/advances','owner'],['owner-expenses','/owner/finance/expenses','owner'],['owner-reports','/owner/reports','owner'],['driver-today','/driver/today','driver'],['driver-run','/driver/run/run1','driver']];
const rows=[];
for(const width of [320,360,390,768,1024,1366,1440]){const page=await browser.newPage({viewport:{width,height:900}});await page.goto(file);let current='public';for(const [name,path,role] of cases){if(role!==current){await page.locator('[data-action="togglePreview"]').click();await page.locator(`[data-preview-role="${role}"]`).click();current=role;}await page.evaluate(path=>location.hash='#'+path,path);await page.waitForTimeout(40);await page.screenshot({path:resolve(out,`${name}-${width}.png`),fullPage:true,style:'.preview-tool{display:none!important}'});rows.push({name,width,scrollWidth:await page.evaluate(()=>document.documentElement.scrollWidth)});}await page.close();}
await browser.close();await writeFile(resolve(out,'results.json'),JSON.stringify(rows,null,2));console.log(`${rows.length} reference screenshots`);
