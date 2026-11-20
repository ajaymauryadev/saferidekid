import { useEffect, useRef, useState } from 'react';
import type { UrgentRequestInput } from '@saferide/shared';
import 'leaflet/dist/leaflet.css';

import {usePublicLocale} from './public-locale';
type Point = NonNullable<UrgentRequestInput['location']>;

export function UrgentPickupMap({ center, selected, onSelect, label = 'pickup' }: { center: Point; selected: Point; onSelect: (point: Point) => void; label?: string }) {
  const hi=usePublicLocale().language==='hi';
  const root = useRef<HTMLDivElement>(null);
  const update = useRef(onSelect);
  const [tilesFailed, setTilesFailed] = useState(false);
  update.current = onSelect;

  useEffect(() => {
    if (!root.current) return;
    let map: import('leaflet').Map | undefined;
    let cancelled = false;
    void import('leaflet').then(L => {
      if (cancelled || !root.current) return;
      map = L.map(root.current, { scrollWheelZoom: false }).setView([center.latitude, center.longitude], 17);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>', maxZoom: 19 })
        .on('tileerror', () => setTilesFailed(true)).addTo(map);
      const pin = L.circleMarker([center.latitude, center.longitude], { radius: 10, color: '#fff', weight: 3, fillColor: '#125fd4', fillOpacity: 1 }).addTo(map);
      if (center.accuracy) L.circle([center.latitude, center.longitude], { radius: center.accuracy, color: '#125fd4', weight: 1, fillOpacity: .08 }).addTo(map);
      map.on('click', event => {
        pin.setLatLng(event.latlng);
        update.current({ latitude: event.latlng.lat, longitude: event.latlng.lng, accuracy: center.accuracy });
      });
    }).catch(() => setTilesFailed(true));
    return () => { cancelled = true; map?.remove(); };
  }, [center.latitude, center.longitude, center.accuracy]);

  return <div className="urgent-pin-picker">
    <strong>{hi?(label==='pickup'?'पिकअप पिन चुनें':'गंतव्य पिन चुनें'):`Choose the ${label} pin`}</strong>
    <p>{hi?'पिन बदलने के लिए नक्शे पर टैप करें। आप ऊपर पता भी लिख सकते हैं।':'Tap the map to move the pin or enter the address above.'}</p>
    <div ref={root} className="urgent-pin-map" aria-label={`Map for choosing a ${label} point`} />
    {tilesFailed && <p role="status">{hi?'नक्शा नहीं खुल सका। सही जगह का पता ऊपर लिखें।':'Map unavailable. Enter the correct address above.'}</p>}
    <p role="status">{hi?'चुनी हुई जगह':'Selected point'} · {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}. {hi?'शुरुआती लोकेशन की सटीकता':'Initial location accuracy'} ±{Math.round(center.accuracy)} m.</p>
  </div>;
}
