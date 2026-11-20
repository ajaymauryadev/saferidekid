import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

const label=process.argv[2]||'baseline';
const root=process.cwd();
const out=resolve(root,'docs/phase07',label);
await mkdir(out,{recursive:true});
const web=spawn(process.execPath,[resolve(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5197','--strictPort'],{cwd:resolve(root,'apps/web'),stdio:'ignore'});
let browser;
try{
 for(let attempt=0;attempt<80;attempt++){try{if((await fetch('http://127.0.0.1:5197/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage();
 for(const width of [320,360,390,768,1024,1366,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto('http://127.0.0.1:5197/',{waitUntil:'networkidle'});
  await page.screenshot({path:resolve(out,`home-${width}.png`),fullPage:true});
  const scroll=await page.evaluate(()=>document.documentElement.scrollWidth);
  console.log(label,width,scroll);
  if(scroll>width)throw Error(`Horizontal overflow at ${width}: ${scroll}`);
 }
}finally{await browser?.close();web.kill();}
