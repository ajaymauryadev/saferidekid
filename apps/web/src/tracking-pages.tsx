import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {type LocationState} from '@saferide/shared';

import {MapPin} from 'lucide-react';
import {Link,useLocation} from 'react-router-dom';
import {customerApi,trackingApi} from './store';
import {LoadingSkeleton,NoticeCard} from './components';
import 'leaflet/dist/leaflet.css';
import './tracking.css';
import {formatWhen,usePublicLocale} from './public-locale';
const gpsHindi:Record<string,string>={'GPS is off. Share only while this assigned trip is active.':'GPS बंद है। सिर्फ सौंपी गई चालू यात्रा में जगह साझा करें।','Offline. GPS uploads paused until connection returns.':'इंटरनेट बंद है। GPS भेजना रुका है।','Connected. Waiting for the next GPS reading.':'इंटरनेट जुड़ा। अगली GPS जानकारी का इंतज़ार है।','GPS needs HTTPS.':'GPS के लिए सुरक्षित HTTPS ज़रूरी है।','GPS is unavailable in this browser.':'इस ब्राउज़र में GPS उपलब्ध नहीं है।','Location sent. Keep this page open in the foreground.':'लोकेशन भेजी गई। यह पेज खुला रखें।','Upload failed. Waiting for the next GPS reading.':'लोकेशन नहीं भेजी गई। अगली जानकारी का इंतज़ार है।','Offline. Location will retry when connected.':'इंटरनेट बंद है। जुड़ने पर फिर कोशिश होगी।','GPS permission denied. Enable it in browser settings to share.':'GPS की अनुमति नहीं मिली। ब्राउज़र सेटिंग में अनुमति दें।','GPS timed out. Check device location settings.':'GPS का समय खत्म हुआ। फोन की लोकेशन सेटिंग जाँचें।','GPS unavailable. Check signal and try again.':'GPS नहीं मिला। सिग्नल जाँचकर फिर कोशिश करें।','Location sent after reconnecting.':'इंटरनेट जुड़ने पर लोकेशन भेजी गई।','Location upload failed. Waiting for the next reading.':'लोकेशन नहीं भेजी गई। अगली जानकारी का इंतज़ार है।','GPS sharing stopped.':'GPS साझा करना बंद हुआ।','Could not confirm stop with server. Reconnect and retry.':'सर्वर से बंद होने की पुष्टि नहीं मिली। फिर कोशिश करें।','GPS unavailable in this browser.':'इस ब्राउज़र में GPS उपलब्ध नहीं है।','Requesting browser GPS permission…':'ब्राउज़र से GPS अनुमति माँग रहे हैं…','Could not start GPS sharing. Refresh your assignment and retry.':'GPS शुरू नहीं हुआ। ड्यूटी फिर जाँचें और कोशिश करें।'};

const age=(at:string|null,now:number,hi=false)=>{if(!at)return hi?'अपडेट नहीं':'No update';const seconds=Math.max(0,Math.floor((now-new Date(at).getTime())/1000));return seconds<60?`${seconds}${hi?' सेकंड पहले':'s ago'}`:seconds<3600?`${Math.floor(seconds/60)}${hi?' मिनट पहले':'m ago'}`:`${Math.floor(seconds/3600)}${hi?' घंटे पहले':'h ago'}`;};
function useVisible(){const [visible,setVisible]=useState(!document.hidden);useEffect(()=>{const update=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);return visible;}
const VehicleMap=lazy(()=>import('./vehicle-map'));
export function LocationMap({point}:{point:LocationState}){
 const hi=usePublicLocale().language==='hi';
 if(point.latitude==null||point.longitude==null)return <div className="track-map-placeholder"><MapPin/><strong>{hi?'अभी लोकेशन नहीं':'No location yet'}</strong><span>{hi?'सौंपे गए ड्राइवर के साझा करने पर लोकेशन दिखेगी।':'Location appears after the assigned driver starts sharing.'}</span></div>;
 return <Suspense fallback={<LoadingSkeleton/>}><VehicleMap key={point.tripId} point={point}/></Suspense>;
}
export function LocationStatus({point}:{point:LocationState}){const {language}=usePublicLocale(),hi=language==='hi';const [now,setNow]=useState(Date.now()),[online,setOnline]=useState(navigator.onLine);useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),10_000);const on=()=>setOnline(true),off=()=>setOnline(false);window.addEventListener('online',on);window.addEventListener('offline',off);return()=>{clearInterval(timer);window.removeEventListener('online',on);window.removeEventListener('offline',off);};},[]);const observed=point.observedAt?new Date(point.observedAt).getTime():0;const fresh=online&&point.state==='FRESH'&&now-observed<=(point.freshnessMs??120_000)&&now-observed>=-30_000;return <div className={`track-status ${fresh?'fresh':'delayed'}`} role="status"><strong>{!online?(hi?'ऑफ़लाइन · आखिरी सर्वर जानकारी':'OFFLINE · last server response'):fresh?(hi?'हाल की GPS जगह':'LIVE · recent GPS'):point.state==='DISABLED'?(hi?'GPS साझा करना बंद':'GPS sharing stopped'):point.observedAt?(hi?'पुरानी लोकेशन':'STALE · last known location'):(hi?'लोकेशन उपलब्ध नहीं':'Location unavailable')}</strong><span>{point.observedAt?`${hi?'पिछला अपडेट':'Last updated'} ${age(point.observedAt,now,hi)} · ${formatWhen(point.observedAt,language)}`:(hi?'ड्राइवर की असली लोकेशन का इंतज़ार है।':'Waiting for a genuine driver location.')}{point.accuracy!=null?` · ${hi?'सटीकता':'Accuracy'} ~${Math.round(point.accuracy)} m`:''}</span></div>;}
export function DriverGps({tripId,kind='run',active}:{tripId:string;kind?:'run'|'booking';active:boolean}){
  const {language}=usePublicLocale(),hi=language==='hi';
  const visible=useVisible();
  const [sharing,{isLoading:changing}]=trackingApi.useSharingMutation();
  const [send]=trackingApi.usePointMutation();
  const [enabled,setEnabled]=useState(false);
  const [state,setState]=useState('GPS is off. Share only while this assigned trip is active.');
  const [lastSent,setLastSent]=useState<{at:string;accuracy:number;freshnessMs:number}|null>(null);
  const [now,setNow]=useState(Date.now());
  const request=useRef(0);
  const consenting=useRef(false);
  useEffect(()=>{
    const timer=window.setInterval(()=>setNow(Date.now()),10000);
    return ()=>clearInterval(timer);
  },[]);
  useEffect(()=>{
    setEnabled(false);
    setLastSent(null);
    return ()=>{
      request.current++;
      if(consenting.current)void sharing({kind,tripId,enabled:false});
      consenting.current=false;
    };
  },[active,kind,tripId,sharing]);
  useEffect(()=>{
    if(!active||!enabled||!visible)return;
    let stopped=false, busy=false, lastUpload=0;
    type Observation=Parameters<typeof send>[0];
    let pending:Observation|null=null;
    async function upload(point:Observation){
      if(stopped||busy||!consenting.current)return;
      if(!navigator.onLine){pending=point;return;}
      if(Date.now()-lastUpload<15000)return;
      lastUpload=Date.now();
      busy=true;
      try{
        const accepted=await send(point).unwrap();
        if(stopped)return;
        pending=null;
        setLastSent({at:point.observedAt,accuracy:point.accuracy,freshnessMs:accepted.freshnessMs??120000});
        setState('Location sent. Keep this page open in the foreground.');
      }catch(error){
        if(stopped)return;
        const status=(error as {status?:unknown}).status;
        if(status===401||status===403||status===404){
          consenting.current=false;
          setEnabled(false);
          setState('Could not start GPS sharing. Refresh your assignment and retry.');
        }else{
          if(!navigator.onLine||status==='FETCH_ERROR'){pending=point;lastUpload=0;}
          setState(navigator.onLine?'Upload failed. Waiting for the next GPS reading.':'Offline. Location will retry when connected.');
        }
      }finally{busy=false;}
    }
    const watch=navigator.geolocation.watchPosition(position=>{
      const {latitude,longitude,accuracy,heading,speed}=position.coords;
      const age=Date.now()-position.timestamp;
      if(![latitude,longitude,accuracy,age].every(Number.isFinite)||Math.abs(latitude)>90||Math.abs(longitude)>180||accuracy<0||age>60000||age< -1000)return;
      if(accuracy>5000){setState(hi?'GPS बहुत अनुमानित है। अगले अपडेट का इंतज़ार है।':'GPS accuracy exceeds 5 km. Waiting for a better reading.');return;}
      void upload({kind,tripId,latitude,longitude,accuracy,heading:Number.isFinite(heading)?heading:null,speed:Number.isFinite(speed)?speed:null,observedAt:new Date(position.timestamp).toISOString()});
    },error=>{
      if(stopped)return;
      setState(error.code===1?'GPS permission denied. Enable it in browser settings to share.':error.code===3?'GPS timed out. Check device location settings.':'GPS unavailable. Check signal and try again.');
      if(error.code===1){
        consenting.current=false;setEnabled(false);
        void sharing({kind,tripId,enabled:false});
      }
    },{enableHighAccuracy:true,maximumAge:0,timeout:20000});
    const offline=()=>setState('Offline. GPS uploads paused until connection returns.');
    const online=()=>{
      setState('Connected. Waiting for the next GPS reading.');
      if(pending&&Date.now()-Date.parse(pending.observedAt)<=60000)void upload(pending);
    };
    window.addEventListener('offline',offline);
    window.addEventListener('online',online);
    return ()=>{
      stopped=true;
      navigator.geolocation.clearWatch(watch);
      window.removeEventListener('offline',offline);
      window.removeEventListener('online',online);
    };
  },[active,enabled,visible,tripId,kind,hi,send,sharing]);
  async function toggle(){
    if(!active)return;
    if(!window.isSecureContext){setState('GPS needs HTTPS.');return;}
    if(!navigator.geolocation){setState('GPS unavailable in this browser.');return;}
    const version=++request.current;
    const start=!enabled;
    if(!start){consenting.current=false;setEnabled(false);}
    try{
      await sharing({kind,tripId,enabled:start}).unwrap();
      if(request.current!==version){
        if(start)void sharing({kind,tripId,enabled:false});
        return;
      }
      consenting.current=start;
      setEnabled(start);
      setState(start?'Requesting browser GPS permission…':'GPS sharing stopped.');
    }catch{
      setState(start?'Could not start GPS sharing. Refresh your assignment and retry.':'Could not confirm stop with server. Reconnect and retry.');
    }
  }
  return <section className="card driver-gps"><div className="eyebrow">{hi?'ड्यूटी की लोकेशन':'Active duty location'}</div><h2>{hi?'गाड़ी की जगह साझा करें':'Share vehicle location'}</h2><p>{hi?'इस चालू ड्यूटी में ही मालिक और जुड़े परिवारों से फोन की GPS जगह साझा करें। सुरक्षित जगह रुककर ही फोन इस्तेमाल करें। फोन लॉक होने पर अपडेट रुक सकते हैं।':'Share your phone GPS with the owner and families assigned to this trip. Only while this duty is active. Use the controls at a safe stop. Keep this page open; locked phones and background tabs may stop updates.'}</p><button className={enabled?'button white':'button primary'} disabled={!active||changing} onClick={toggle}>{enabled?(hi?'बंद करें':'Stop sharing'):(hi?'साझा करें':'Start sharing')}</button><p role="status">{visible?(hi?(gpsHindi[state]??state):state):(hi?'पेज बंद है। GPS अपडेट रुके हैं।':'Page hidden. GPS updates paused.')}</p>{lastSent&&<p>{hi?'आखिरी बार भेजी':'Last uploaded'} {formatWhen(lastSent.at,language)} · Accuracy ~{Math.round(lastSent.accuracy)} m · {enabled&&now-new Date(lastSent.at).getTime()<=lastSent.freshnessMs?(hi?'हाल की':'Fresh'):(hi?'पुरानी या बंद':'Stale or stopped')}</p>}</section>;}
function OwnerTripLocation({snapshot}:{snapshot:LocationState}){
 const result=customerApi.useLocationQuery({kind:snapshot.kind,tripId:snapshot.tripId},{pollingInterval:20000});
 if(result.isError)return <div className="track-map-placeholder">यात्रा की लोकेशन उपलब्ध नहीं है · Location unavailable</div>;
 const point=result.currentData??snapshot;
 return <><LocationStatus point={point}/><LocationMap point={point}/></>;
}
export function OwnerLive(){const hi=usePublicLocale().language==='hi';const visible=useVisible();const {data,isLoading,isError,refetch}=trackingApi.useActiveQuery(undefined,{pollingInterval:visible?20_000:0,skipPollingIfUnfocused:true,refetchOnFocus:true,refetchOnReconnect:true});const items=data?.filter(x=>x.kind==='run')??[];return <div className="owner-live"><div className="track-head"><div><div className="eyebrow">{hi?'चालू यात्राएँ':'Live operations'}</div><h1>{hi?'स्कूल गाड़ी की लोकेशन':'School vehicle tracking'}</h1><p>{hi?'ड्यूटी पर मौजूद ड्राइवर की साझा जगह। आखिरी अपडेट का समय देखें।':'Only authorized driver GPS. Check freshness before relying on a position.'}</p></div><button className="button secondary" onClick={()=>refetch()}>{hi?'फिर जाँचें':'Refresh'}</button></div>{isLoading?<LoadingSkeleton/>:isError?<NoticeCard title="Service status unavailable" body="Cannot confirm current vehicle locations. Reconnect and retry."/>:items.length?items.map(point=><section className="card owner-track" key={`${point.kind}:${point.tripId}`}><div className="owner-live-card-head"><div><strong>{point.label}</strong><p>{point.driverName??'Assigned driver'} · Vehicle {point.vehicleId.slice(-6)}</p></div><div className="owner-live-actions">{point.driverPhone&&<a className="button white" href={`tel:${point.driverPhone}`}>{hi?'ड्राइवर को कॉल करें':'Call driver'}</a>}<Link className="button secondary" to={point.kind==='run'?`/owner/school/run/${point.tripId}`:`/owner/bookings/${point.tripId}`}>{hi?'ड्यूटी देखें':'Open duty'}</Link></div></div><OwnerTripLocation snapshot={point}/></section>):<NoticeCard title={'No active school runs'} body="Tracking appears only for active assigned school runs."/>}<p className="tracking-fallback">Phone locks, background tabs and network loss may stop GPS updates. A stale position is the last observation, not live movement.</p></div>;}
export function BookingTrack({driver=false}:{driver?:boolean}){const hi=usePublicLocale().language==='hi';const parts=useLocation().pathname.split('/');const id=parts.at(driver?-1:-2)??'';const visible=useVisible();const result=customerApi.useLocationQuery({kind:'booking',tripId:id},{skip:!id,pollingInterval:visible?20_000:0,skipPollingIfUnfocused:true,refetchOnFocus:true,refetchOnReconnect:true});const dashboard=customerApi.useDashboardQuery(undefined,{skip:driver});if(result.isLoading)return <LoadingSkeleton/>;if(result.isError||!result.currentData)return <div className="card customer-panel"><NoticeCard title={hi?'यात्रा की लोकेशन उपलब्ध नहीं है':'Trip tracking unavailable'} body={hi?'अपने खाते की चालू यात्रा चुनें।':'Choose an active trip assigned to your account.'}/><Link className="button secondary" to={driver?'/driver/today':'/app/bookings'}>{hi?'बुकिंग पर वापस जाएँ':'Back to bookings'}</Link></div>;const point=result.currentData;const ownerPhone=dashboard.data?.ownerPhone;return <div className="tracking-layout"><section className="card"><div className="eyebrow">{hi?'निजी यात्रा':'Private trip'}</div><h2>{hi?'गाड़ी की जगह':'Vehicle location'}</h2><p>{hi?'इस यात्रा पर ड्राइवर की साझा की गई आखिरी जगह देखें।':'Best effort driver GPS for this active booking.'}</p><LocationMap point={point}/><LocationStatus point={point}/>{driver&&<DriverGps kind="booking" tripId={id} active/>}{!driver&&ownerPhone&&<a className="button secondary" href={`tel:${ownerPhone}`}>{hi?'मालिक को कॉल करें':'Call Owner'}</a>}<p className="tracking-fallback">{hi?'फ़ोन लॉक होने, पेज पीछे जाने या इंटरनेट कटने पर GPS रुक सकता है। आखिरी अपडेट देखें और ज़रूरत पर मालिक को कॉल करें।':'Phone locks, background tabs and network loss may stop GPS updates. Check the timestamp and call the operator when needed. No guaranteed ETA or emergency availability.'}</p></section></div>;}



