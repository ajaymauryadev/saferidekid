import { useEffect, useRef, useState } from 'react';

export type PickupFix = { latitude: number; longitude: number; accuracy: number; timestamp: number };
export const pickupOptions = { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 };

export function classifyPickup(position: GeolocationPosition) {
  const { latitude, longitude, accuracy } = position.coords;
  const age = Date.now() - position.timestamp;
  if (![latitude, longitude, accuracy, age].every(Number.isFinite) || Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180 || accuracy < 0 || age < -1000 || age > 30000) return 'invalid';
  if (accuracy > 5000) return 'very-coarse';
  return accuracy > 100 ? 'coarse' : 'usable';
}

export function usePickupLookup(hi: boolean, select: (point: PickupFix | null) => void, allowApproximate=false) {
  const version = useRef(0);
  const [message, setMessage] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [locating, setLocating] = useState(false);
  function cancel() {
    version.current++;
    setLocating(false);
    setMessage('');
    setSuggestion('');
  }
  useEffect(() => { cancel(); return () => { version.current++; }; }, [hi]);
  function locate() {
    cancel();
    select(null);
    const request = version.current;
    function unavailable() {
      if (request !== version.current) return;
      setLocating(false);
      setMessage(hi ? 'GPS नहीं मिला या अनुमति नहीं मिली। अपना गाँव और पहचान की जगह लिखें।' : 'Location unavailable or permission denied. Enter your village and landmark.');
    }
    if (!navigator.geolocation) return unavailable();
    setLocating(true);
    setMessage(hi ? 'GPS की अनुमति माँगी जा रही है…' : 'Requesting location permission…');
    navigator.geolocation.getCurrentPosition(async position => {
      if (request !== version.current) return;
      setLocating(false);
      const classification = classifyPickup(position);
      if (classification === 'invalid') return unavailable();
      const { latitude, longitude, accuracy } = position.coords;
      const radius = '±' + Math.round(accuracy) + (hi ? ' मीटर' : ' m');
      if (classification === 'coarse' || classification === 'very-coarse') {
        setMessage(hi ? 'नेटवर्क की अनुमानित जगह हो सकती है (' + radius + ')। अपना गाँव या पहचान की जगह लिखें।' : 'Location is approximate (' + radius + '). Enter your village or landmark.');
        setMessage(previous=>previous+' · '+new Date(position.timestamp).toLocaleString());
        if(allowApproximate && classification==='coarse')select({latitude,longitude,accuracy,timestamp:position.timestamp});
        return;
      }
      select({ latitude, longitude, accuracy, timestamp: position.timestamp });
      setMessage(hi ? 'जगह मिली (' + radius + ')। अपना गाँव या पहचान की जगह पक्की करें।' : 'Location found (' + radius + '). Confirm your village or landmark.');
      try {
        const response = await fetch('/api/public/reverse-location', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ latitude, longitude }) });
        if (!response.ok) return;
        const data = await response.json();
        if (request === version.current && typeof data.address === 'string') setSuggestion(data.address);
      } catch { /* The customer can confirm the point with a typed landmark. */ }
    }, unavailable, pickupOptions);
  }
  return { locate, locating, message, setMessage, suggestion, cancel };
}
