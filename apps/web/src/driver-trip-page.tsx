import {useRef,useState} from 'react';
import {useLocation} from 'react-router-dom';
import {driverApi} from './store';
import {DriverGps} from './tracking-pages';
import {LoadingSkeleton,NoticeCard,StatusPill} from './components';
import {formatStatus,usePublicLocale} from './public-locale';

const stages=['STARTED','REACHED_PICKUP','PICKED_UP','IN_TRANSIT','AT_DESTINATION','COMPLETED'];
const issueKinds=['DELAY','BREAKDOWN','HELP','INCIDENT'] as const;
const phoneLink=(phone:string|null)=>phone&&/^\+[1-9]\d{7,14}$/.test(phone)?`tel:${phone}`:null;

export function DriverTripPage(){
  const id=useLocation().pathname.split('/').at(-1)??'';
  const {language}=usePublicLocale(),hi=language==='hi';
  const label=(value:string|null)=>formatStatus(value,language);
  const {data,isLoading,isError,refetch}=driverApi.useTripQuery(id,{skip:!id,refetchOnFocus:true,refetchOnReconnect:true});
  const [progress,{isLoading:saving}]=driverApi.useProgressMutation();
  const [report,{isLoading:reporting}]=driverApi.useReportMutation();
  const [message,setMessage]=useState(''),[issue,setIssue]=useState(''),[odometer,setOdometer]=useState('');
  const key=useRef<string|null>(null);
  if(isLoading)return <LoadingSkeleton/>;
  if(isError||!data)return <div className="card driver-page"><NoticeCard title={hi?'यात्रा नहीं मिली':'Trip unavailable'} body={hi?'ड्यूटी बदली हो सकती है। इंटरनेट जोड़कर आज की ड्यूटी फिर देखें।':'Your assignment may have changed. Reconnect and check My Day.'}/><button className="button secondary driver-action" onClick={()=>refetch()}>{hi?'फिर जाँचें':'Retry'}</button></div>;
  const next=stages[stages.indexOf(data.stage??'')+1]??null;
  async function advance(){
    if(!next||saving)return;
    key.current??=crypto.randomUUID();setMessage('');
    try{await progress({id,stage:next,idempotencyKey:key.current,...(odometer?{odometerKm:Number(odometer)}:{})}).unwrap();key.current=null;setOdometer('');setMessage(hi?`${label(next)} — सर्वर ने दर्ज किया।`:`${label(next)} saved by server.`);}
    catch{setMessage(hi?'पुष्टि नहीं मिली। स्थिति फिर देखें, उसके बाद इसी कदम को दोबारा भेजें।':'No confirmation received. Refresh status, then retry this step.');}
  }
  const call=(phone:string|null,title:string)=>phoneLink(phone)?<a className="button secondary driver-action" href={phoneLink(phone)!}>{title}</a>:<p className="driver-muted">{title}: {hi?'नंबर उपलब्ध नहीं':'number unavailable'}</p>;
  return <div className="driver-page"><header className="driver-hero"><div className="eyebrow">{hi?'यात्रा मोड':'Trip Mode'} · {label(data.service)}</div><h1>{data.pickup} → {data.destination}</h1><p>{data.vehicleName}{data.registration?` · ${data.registration}`:''}</p><StatusPill tone={data.status==='IN_PROGRESS'?'green':'blue'}>{label(data.stage??data.status)}</StatusPill></header><div className="notice run-warning">{hi?'बटन दबाने से पहले सुरक्षित जगह गाड़ी रोकें। चलती गाड़ी में यह पेज न चलाएँ।':'Stop safely before updating the trip. Never use this page while driving.'}</div>{message&&<p role="status" className="notice">{message}</p>}<section className="card"><h2>{hi?'सवारी':'Journey'}</h2><p>{hi?'पिकअप':'Pickup'}: {data.pickup}</p><p>{hi?'पहुँचना है':'Destination'}: {data.destination}</p>{data.stops.length>0&&<p>{hi?'बीच के ठहराव':'Stops'}: {data.stops.join(' · ')}</p>}<p>{hi?'ग्राहक':'Customer'}: {data.customerName}</p>{call(data.customerPhone,hi?'ग्राहक को कॉल':'Call customer')}{call(data.ownerPhone,hi?'मालिक को कॉल':'Call owner')}<ol className="driver-steps">{stages.map(stage=><li key={stage} aria-current={data.stage===stage?'step':undefined}>{label(stage)}</li>)}</ol>{next&&<><label>{hi?'ओडोमीटर किलोमीटर (वैकल्पिक)':'Odometer km (optional)'}<input type="number" inputMode="decimal" min="0" value={odometer} onChange={event=>setOdometer(event.target.value)}/></label><button className="button primary driver-action" disabled={saving||!navigator.onLine} onClick={advance}>{saving?hi?'दर्ज हो रहा है…':'Saving…':next==='PICKED_UP'&&data.service==='goods'?hi?'सामान लिया':'Goods picked up':next==='PICKED_UP'?hi?'यात्री बैठा':'Passenger picked up':next==='COMPLETED'?hi?'यात्रा पूरी करें':'Complete trip':label(next)}</button></>}<button className="button white driver-action" onClick={()=>refetch()}>{hi?'स्थिति फिर देखें':'Refresh status'}</button></section>{data.status==='IN_PROGRESS'&&<DriverGps kind="booking" tripId={id} active/>}<section className="card"><h2>{hi?'समस्या बताएँ':'Report a problem'}</h2><label>{hi?'क्या हुआ?':'What happened?'}<textarea value={issue} onChange={event=>setIssue(event.target.value)} minLength={5} maxLength={500}/></label><div className="driver-actions">{issueKinds.map(kind=><button className="button secondary driver-action" key={kind} disabled={reporting||issue.trim().length<5} onClick={async()=>{try{await report({id,kind,message:issue,idempotencyKey:crypto.randomUUID()}).unwrap();setIssue('');setMessage(hi?`${label(kind)} — सर्वर ने दर्ज किया।`:`${label(kind)} report saved.`);}catch{setMessage(hi?'समस्या दर्ज नहीं हुई। इंटरनेट जाँचकर फिर कोशिश करें।':'Report was not saved. Check your connection and retry.');}}}>{label(kind)}</button>)}</div></section></div>;
}
