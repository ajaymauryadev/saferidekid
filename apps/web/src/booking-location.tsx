import {lazy,Suspense,useEffect,useState} from 'react';
import type {BookingInput} from '@saferide/shared';
import {usePickupLookup} from './pickup-location';
import {usePublicLocale} from './public-locale';
const PinMap=lazy(()=>import('./booking-pin-map'));
type Point=NonNullable<BookingInput['pickupPoint']>;
type Props={field:'pickup'|'destination';onPending:(pending:boolean)=>void;address:string;point:Point|null;setAddress:(text:string)=>void;setPoint:(point:Point|null)=>void};
export function BookingLocation({field,address,point,setAddress,setPoint,onPending}:Props){
  const hi=usePublicLocale().language==='hi', pickup=field==='pickup';
  const name=hi?(pickup?'पिकअप':'गंतव्य'):field;
  const [proposal,setProposal]=useState<Omit<Point,'confirmed'>|null>(null);
  useEffect(()=>onPending(!!proposal),[proposal,onPending]);
  const [open,setOpen]=useState(false);
  const selected=proposal??point;
  const gps=usePickupLookup(hi,fix=>{
    setPoint(null);
    setProposal(fix?{...fix,source:'GPS'}:null);
    setOpen(!!fix&&fix.accuracy<=100);
  },true);
  function clear(){
    gps.cancel();setProposal(null);setPoint(null);setOpen(false);
  }
  return <div className="booking-location">
    <label>{hi?name+' गाँव या पहचान की जगह':(pickup?'Pickup':'Destination')+' village or landmark'}
      <input autoComplete={pickup?'street-address':'off'} value={address} maxLength={250} placeholder={hi?'गाँव, सड़क, पिन कोड या पहचान की जगह':'Village, road, PIN code or landmark'} onChange={e=>{
        gps.cancel();setAddress(e.target.value);setPoint(null);
        if(point)setOpen(false);
      }}/>
    </label>
    <button type="button" className="button secondary" disabled={gps.locating} onClick={gps.locate}>{hi?(pickup?'मेरी लोकेशन लें':'गंतव्य के लिए मेरी लोकेशन लें'):(pickup?'Use my location':'Use my location for destination')}</button>
    <button type="button" className="button secondary" onClick={()=>{gps.cancel();setOpen(true)}}>{hi?name+' नक्शे पर चुनें':'Choose '+field+' on map'}</button>
    {gps.message&&<p role="status">{gps.message}</p>}
    {gps.suggestion&&<p>{hi?'पते का सुझाव':'Suggested address'} · {gps.suggestion}</p>}
    {open&&<><p>{hi?'नक्शा ज़ूम करें और सही जगह पर टैप करें, या सिर्फ़ पता लिखें।':'Zoom to your landmark and tap to place a pin, or use the typed address.'}</p>
      <Suspense fallback={<p>…</p>}><PinMap point={selected??null} select={p=>{gps.cancel();setPoint(null);setProposal({...p,source:'MAP'})}}/></Suspense></>}
    {selected&&<div className="quick-confirm"><strong>{hi?name+' जगह की पुष्टि करें':'Confirm '+field+' location'}</strong>
      <p>{selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)} · {selected.source==='GPS'?'GPS':hi?'मानचित्र पिन':'Map pin'} {selected.accuracy!=null&&'±'+Math.round(selected.accuracy)+' m'} {selected.timestamp&&new Date(selected.timestamp).toLocaleString()}</p>
      {proposal?<button type="button" className="button secondary" disabled={address.trim().length<5} onClick={()=>{gps.cancel();setPoint({...proposal,confirmed:true});setProposal(null)}}>{hi?'यह '+name+' पक्का करें':'Confirm '+field}</button>:<span>{hi?'पुष्टि हो गई':'Confirmed'}</span>}
      <button type="button" className="button secondary" onClick={clear}>{hi?'सिर्फ़ लिखे पते का उपयोग करें':'Use typed address only'}</button>
    </div>}
  </div>;
}
