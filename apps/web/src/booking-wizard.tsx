import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, CarFront, Package, Plane, PartyPopper, Route } from 'lucide-react';
import { BookingInputSchema, type BookingEstimate, type BookingInput } from '@saferide/shared';
import { authApi,bookingsApi } from './store';
import { NoticeCard } from './components';
import {BookingLocation} from './booking-location';
import './booking.css';
import {formatInr,formatWhen,usePublicLocale} from './public-locale';

import {readBookingDraft,bookingDraftKey} from './booking-draft';

const services = [
  ['local', 'Local trip', CarFront], ['party', 'Private / family trip', PartyPopper],
  ['wedding', 'Wedding / event', CalendarDays], ['airport', 'Station / airport', Plane],
  ['outstation', 'Outstation / tourism', Route], ['goods', 'Eligible goods pickup', Package]
] as const;

const serviceLabels=({local:'स्थानीय सवारी',party:'परिवार की सवारी',wedding:'शादी या कार्यक्रम',airport:'स्टेशन या एयरपोर्ट',outstation:'बाहर की यात्रा',goods:'सामान पिकअप'} as Record<string,string>);

export function BookingWizard() {
  const {language}=usePublicLocale(),hi=language==='hi';
  const {data:account}=authApi.useMeQuery();
  const [pickupPending,setPickupPending]=useState(false),[destinationPending,setDestinationPending]=useState(false);
  const [rememberPickup,setRememberPickup]=useState(false);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  const [saved]=useState(readBookingDraft);
  const [pickupPoint,setPickupPoint]=useState<NonNullable<BookingInput['pickupPoint']>|null>(saved.pickupPoint);
  const [destinationPoint, setDestinationPoint] = useState<NonNullable<BookingInput['destinationPoint']> | null>(saved.destinationPoint);
  const [estimateResult, setEstimateResult] = useState<BookingEstimate | null>(null);
  const [estimateError, setEstimateError] = useState('');
  const [estimateLoading, setEstimateLoading] = useState(false);
  const sequence = useRef(0);
  const [requestKey] = useState(() => saved.requestKey??crypto.randomUUID());
  const [create, { isLoading }] = bookingsApi.useCreateBookingMutation();
  const [estimate] = bookingsApi.useBookingEstimateMutation();
  const [draft,setDraft]=useState(()=>({...saved,service:String(saved.service)}));
  useEffect(()=>{try{sessionStorage.setItem(bookingDraftKey,JSON.stringify({...draft,pickupPoint,destinationPoint,requestKey}));}catch{/* Storage can be disabled. */}},[draft,pickupPoint,destinationPoint,requestKey]);
  useEffect(()=>{if(!account?.user.id)return;try{const saved=localStorage.getItem(`saferide-pickup:${account.user.id}`);if(saved)setDraft(previous=>previous.pickup?previous:{...previous,pickup:saved.slice(0,250)});}catch{/* Storage is optional. */}},[account?.user.id]);
  const set = (field: keyof typeof draft, value: string | number | boolean) => setDraft(previous => ({ ...previous, [field]: value }));
  const payload = (): BookingInput => ({
    pickup: draft.pickup.trim(), destination: draft.destination.trim(), pickupPoint, destinationPoint, service: draft.service as BookingInput['service'],
    startAt: new Date(draft.startAt).toISOString(), endAt: draft.endAt ? new Date(draft.endAt).toISOString() : new Date(new Date(draft.startAt).getTime() + 2 * 3600000).toISOString(),
    passengers: draft.service === 'goods' ? 0 : Number(draft.passengers), cargoKg: draft.service === 'goods' ? Number(draft.cargoKg) : 0,
    roundTrip: draft.roundTrip, plannedWaitingMinutes: Number(draft.plannedWaitingMinutes), stops: draft.stops.split('\n').map(s => s.trim()).filter(Boolean), notes: draft.notes.trim(), requestKey
  });
  async function calculate() {
    let input: BookingInput;
    try { input = payload(); if (!BookingInputSchema.safeParse(input).success) return; } catch { return; }
    const current = ++sequence.current;
    setEstimateLoading(true); setEstimateError(''); setEstimateResult(null);
    try { const result = await estimate(input).unwrap(); if (current === sequence.current) setEstimateResult(result); }
    catch { if (current === sequence.current) setEstimateError(hi?'रास्ते का किराया नहीं मिल पाया। फिर जाँचें या मालिक से किराया माँगें।':'Route estimate could not be loaded. Retry or ask the owner for a quote.'); }
    finally { if (current === sequence.current) setEstimateLoading(false); }
  }
  useEffect(() => {
    let valid = false;
    try { valid = BookingInputSchema.safeParse(payload()).success; } catch { /* Dates are incomplete. */ }
    if (!valid) { sequence.current++; setEstimateResult(null); setEstimateLoading(false); return; }
    const timer = window.setTimeout(() => void calculate(), 650);
    return () => window.clearTimeout(timer);
  // Recalculate after any fare or route input changes. The request sequence discards stale replies.
  }, [draft,  pickupPoint, destinationPoint]);
  function next() {
    setError('');
    if (step === 0 && (draft.pickup.trim().length < 5 || draft.destination.trim().length < 5)) return setError(hi?'पिकअप और पहुँचने की जगह कम से कम पाँच अक्षरों में लिखें।':'Enter pickup and destination with at least five characters each.');
    if(step===0&&(pickupPending||destinationPending))return setError(hi?'पिन की पुष्टि करें या सिर्फ़ लिखा पता चुनें।':'Confirm the pin or choose the typed address only.');
    if (step === 1) {
      try {
        const parsed = BookingInputSchema.safeParse(payload());
        if (!parsed.success) return setError(hi?'समय, यात्री या सामान की संख्या जाँचें।':'Check trip times, passenger or cargo quantity, and stops.');
        if (new Date(parsed.data.startAt).getTime() < Date.now() + 3600000) return setError(hi?'कम से कम एक घंटे बाद का समय चुनें।':'Choose a start time at least one hour from now.');
      } catch { return setError(hi?'सही तारीख और समय चुनें।':'Choose valid start and end times.'); }
    }
    setStep(step + 1);
  }
  async function submit() {
    setError('');
    try { const booking = await create(payload()).unwrap();try{sessionStorage.removeItem(bookingDraftKey);if(account?.user.id&&rememberPickup)localStorage.setItem(`saferide-pickup:${account.user.id}`,draft.pickup.trim());}catch{/* Storage is optional. */}navigate(`/app/bookings/${booking.id}`); }
    catch (failure) { setError(hi?'पुष्टि नहीं मिल सकी। पहले मेरी बुकिंग देखें, फिर इसी पेज से दोबारा कोशिश करें।':(failure as { data?: { error?: { message?: string } } })?.data?.error?.message || 'No confirmation received. Check My bookings before retrying.'); }
  }
  return <div className="booking-shell">
    <div className="page-head"><div><div className="eyebrow">{hi?'नई बुकिंग':'New booking'}</div><h1>{hi?'कहाँ जाना है?':'Where are you going?'}</h1><p>{hi?'जगह बताएं। दूरी न मिली तो मालिक किराया बताएंगे।':'Tell us your route. The owner confirms availability and fare.'}</p></div><Link className="button secondary" to="/app/bookings">{hi?'मेरी बुकिंग':'My bookings'}</Link></div>
    <div className="booking-progress" aria-label={`${hi?'कदम':'Step'} ${step + 1} ${hi?'कुल 3 में से':'of 3'}`}>{(hi?['रास्ता','समय और सवारी','पुष्टि']:['Route','Time and service','Review']).map((title, index) => <span className={index === step ? 'active' : ''} key={title}>{index + 1}. {title}</span>)}</div>
    <section className="card booking-step">
      {step === 0 ? <><h2>{hi?'कहाँ जाना है?':'Where are you going?'}</h2><BookingLocation field="pickup" onPending={setPickupPending} address={draft.pickup} point={pickupPoint} setAddress={v=>set('pickup',v)} setPoint={setPickupPoint}/><label className="booking-check"><input type="checkbox" checked={rememberPickup} onChange={e=>setRememberPickup(e.target.checked)}/>{hi?'इस पिकअप जगह को मेरे खाते में याद रखें':'Remember this pickup for my account'}</label><BookingLocation field="destination" onPending={setDestinationPending} address={draft.destination} point={destinationPoint} setAddress={v=>set('destination',v)} setPoint={setDestinationPoint}/></> : null}
      {step === 1 ? <><h2>{hi?'सवारी और समय':'Service and time'}</h2><div className="booking-services">{services.map(([key, title, Icon]) => <button key={key} type="button" aria-pressed={draft.service === key} className={draft.service === key ? 'selected' : ''} onClick={() => set('service', key)}><Icon/><strong>{hi?serviceLabels[key]:title}</strong></button>)}</div><div className="booking-fields"><label>{hi?'चलने की तारीख और समय':'Start date and time'}<input type="datetime-local" required value={draft.startAt} onChange={event => set('startAt', event.target.value)} /></label><label>{hi?'वापसी का समय (वैकल्पिक)':'Reserve until (optional)'}<input type="datetime-local" value={draft.endAt} onChange={event => set('endAt', event.target.value)} /></label>{draft.service === 'goods' ? <label>{hi?'सामान का वज़न (किलो)':'Cargo weight kg'}<input type="number" inputMode="numeric" min="1" value={draft.cargoKg} onChange={event => set('cargoKg', Number(event.target.value))} /></label> : <label>{hi?'यात्री':'Passengers'}<input type="number" inputMode="numeric" min="1" value={draft.passengers} onChange={event => set('passengers', Number(event.target.value))} /></label>}</div><p>{hi?'वापसी का समय न देने पर उपलब्धता के लिए दो घंटे माने जाएंगे। मालिक यात्रा की पुष्टि करेंगे।':'If no end time is given, a two hour window is used for availability. The owner confirms the itinerary.'}</p>{['wedding','party','outstation'].includes(draft.service) && <label>{hi?'इंतज़ार के मिनट':'Planned waiting minutes'}<input type="number" inputMode="numeric" min="0" max="1440" value={draft.plannedWaitingMinutes} onChange={event => set('plannedWaitingMinutes', Number(event.target.value))} /></label>}<label>{hi?'बीच के ठहराव, हर पंक्ति में एक':'Additional stops, one per line'}<textarea value={draft.stops} onChange={event => set('stops', event.target.value)} /></label><label className="booking-check"><input type="checkbox" checked={draft.roundTrip} onChange={event => set('roundTrip', event.target.checked)} /> {hi?'आना-जाना':'Return trip'}</label><label>{hi?'और जानकारी':'Notes'}<textarea value={draft.notes} onChange={event => set('notes', event.target.value)} /></label></> : null}
      {step === 2 ? <><h2>{hi?'अनुरोध जाँचें':'Review request'}</h2><p><strong>{hi?serviceLabels[draft.service]:services.find(item => item[0] === draft.service)?.[1]}</strong> · {draft.pickup} → {draft.destination}</p><p>{formatWhen(new Date(draft.startAt).toISOString(),language)} – {formatWhen(payload().endAt,language)}</p>{estimateLoading ? <p role="status">{hi?'सड़क का रास्ता और दर जाँच रहे हैं…':'Checking road route and rates…'}</p> : estimateResult?.status === 'ESTIMATED' && estimateResult.breakdown ? <div className="booking-estimate"><h3>{hi?'अनुमानित किराया':'Estimated fare'} · {formatInr(estimateResult.estimatePaise!,language)}</h3><p>{hi?'सड़क की दूरी':'Road distance'} {estimateResult.distanceKm?.toFixed(2)} km · {estimateResult.vehicleName}</p><small>{hi?'यह अनुमान है। अंतिम किराया मालिक बताएंगे।':'This is an estimate. The owner will send a final quote.'}</small></div> : <NoticeCard title={hi?'दूरी उपलब्ध नहीं है — किराया मालिक बताएंगे।':'Distance unavailable — owner will confirm the fare.'} body={hi?'बिना दूरी के भी अनुरोध भेज सकते हैं। मालिक उपलब्धता और किराया जाँचेंगे।':'You can send the request without an automatic fare. The owner will review it.'} />}{estimateError && <p role="alert">{estimateError}</p>}<button type="button" className="button secondary" onClick={() => void calculate()} disabled={estimateLoading}>{hi?'फिर जाँचें':'Retry road route'}</button></> : null}
      {error && <p role="alert" className="booking-error">{error}</p>}
      <div className="booking-actions">{step > 0 && <button type="button" className="button secondary" onClick={() => setStep(step - 1)}>{hi?'पीछे':'Back'}</button>}{step < 2 ? <button type="button" className="button primary" onClick={next}>{hi?'आगे':'Continue'}</button> : <button type="button" className="button primary" disabled={isLoading} onClick={submit}>{isLoading ? hi?'भेज रहे हैं…':'Sending…' : hi?'अनुरोध भेजें':'Send request'}</button>}</div>
    </section>
  </div>;
}

