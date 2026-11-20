type TripKind='run'|'booking';
type Listener=(kind:TripKind,tripId:string)=>void;
const listeners=new Set<Listener>();
export function onTrackingChange(listener:Listener){listeners.add(listener);return()=>listeners.delete(listener);}
export function trackingChanged(kind:TripKind,tripId:string){for(const listener of listeners)listener(kind,tripId);}
