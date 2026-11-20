import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const css=readFileSync(new URL('../apps/web/src/finance.css',import.meta.url),'utf8');
const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
try{
 const page=await browser.newPage();
 await page.setContent(`<style>${css}</style><div class="workspace"><nav class="app-sidebar">Menu</nav><div class="page-body"><div class="finance-page"><div class="page-head">Reports</div><div class="finance-filters">Filters</div><div class="card finance-table"><table><thead><tr><th>Service</th><th>Amount</th></tr></thead><tbody><tr><td>Wedding</td><td>₹100</td></tr></tbody></table></div></div></div></div>`);
 await page.emulateMedia({media:'print'});
 if(!(await page.locator('.finance-table').isVisible())||await page.locator('.finance-filters').isVisible()||await page.locator('.app-sidebar').isVisible())throw Error('Report print visibility failed');
 await page.locator('.finance-page').evaluate(el=>el.insertAdjacentHTML('beforeend','<div class="finance-dialog"><section class="finance-print"><div class="finance-actions">Print</div><h1>Transport invoice</h1><p>INV-000001</p></section></div>'));
 if(!(await page.locator('.finance-print h1').isVisible()))throw Error('Document print visibility failed');
 const visibility=await page.locator('.finance-print h1').evaluate(el=>getComputedStyle(el).visibility);
 if(visibility!=='visible')throw Error('Document hidden in print');
 const pdf=await page.pdf({format:'A4',printBackground:true});
 if(pdf.length<1000)throw Error('Printed PDF unexpectedly empty');
 console.log('Finance report and document print layout visible; PDF bytes:',pdf.length);
}finally{await browser.close();}
