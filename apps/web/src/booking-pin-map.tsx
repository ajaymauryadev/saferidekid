import {useState} from 'react';
import {usePublicLocale} from './public-locale';
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
type Point = {latitude:number; longitude:number};
function PinEvents({select}:{select:(point:Point)=>void}) {
  useMapEvents({click:({latlng})=>select({latitude:latlng.lat,longitude:latlng.wrap().lng})});
  return null;
}
export default function BookingPinMap({point,select}:{point:Point|null; select:(point:Point)=>void}) {
  const [tileError,setTileError]=useState(false);
  const hi=usePublicLocale().language==='hi';
  return <>{tileError&&<p role="status">{hi?'नक्शे का कुछ हिस्सा नहीं खुला। जगह पहचान में न आए तो पता लिखें।':'Some map tiles are unavailable. Use your address if you cannot identify the landmark.'}</p>}<MapContainer className="urgent-pin-map" style={{height:260,width:'100%',zIndex:0}} center={point?[point.latitude,point.longitude]:[0,0]} zoom={point?15:2} scrollWheelZoom={false}>
    <TileLayer eventHandlers={{tileerror:()=>setTileError(true)}} url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'/>
    {point&&<CircleMarker center={[point.latitude,point.longitude]} radius={8}/>}
    <PinEvents select={select}/>
  </MapContainer></>;
}
