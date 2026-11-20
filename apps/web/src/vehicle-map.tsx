import {useState} from 'react';
import {Circle,Marker,MapContainer,TileLayer,useMap} from 'react-leaflet';
import {divIcon} from 'leaflet';
import type {LocationState} from '@saferide/shared';
import {usePublicLocale} from './public-locale';

const vehicleIcon=divIcon({className:'track-vehicle',iconSize:[44,32],iconAnchor:[22,16],
  html:'<svg width="44" height="32" viewBox="0 0 44 32" aria-hidden="true"><rect x="2" y="5" width="39" height="23" rx="7" fill="white" stroke="#174371" stroke-width="2"/><path d="M6 9h9v8H6zm12 0h8v8h-8zm11 0h5l4 8h-9z" fill="#32678e"/><path d="M4 21h35" stroke="#eeaa32" stroke-width="3"/><circle cx="11" cy="27" r="4" fill="#193955"/><circle cx="33" cy="27" r="4" fill="#193955"/></svg>'});
function Recenter({center,label}:{center:[number,number];label:string}){
  const map=useMap();
  return <button className="button secondary vehicle-recenter" type="button" onClick={()=>map.panTo(center)}>{label}</button>;
}

export default function VehicleMap({point}:{point:LocationState}){
  const hi=usePublicLocale().language==='hi';
  const [failed,setFailed]=useState(false);
  if(point.latitude==null||point.longitude==null)return null;
  const center:[number,number]=[point.latitude,point.longitude];
  return <div className="track-map-wrap" aria-label={hi?'गाड़ी की आखिरी जगह':'Last observed vehicle location'}>
    <MapContainer className="track-map" center={center} zoom={15} scrollWheelZoom={false}>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' maxZoom={19} eventHandlers={{tileerror:()=>setFailed(true)}}/>
      {!!point.accuracy&&<Circle center={center} radius={point.accuracy} pathOptions={{color:'#125fd4',weight:1,fillOpacity:.08}}/>}
      <Marker position={center} icon={vehicleIcon} title={hi?'गाड़ी की आखिरी जगह':'Last vehicle position'}/>
      <Recenter center={center} label={hi?'गाड़ी पर वापस जाएँ':'Recenter vehicle'}/>
    </MapContainer>
    {failed&&<div className="track-map-fallback" role="status">{hi?'लोकेशन मिली, लेकिन नक्शा नहीं खुल सका।':'Location received. Map tiles unavailable.'}</div>}
  </div>;
}
