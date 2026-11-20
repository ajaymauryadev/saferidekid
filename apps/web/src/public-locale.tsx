import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';

type Language='en'|'hi';
const Locale=createContext<{language:Language;setLanguage:(value:Language)=>void}>({language:'hi',setLanguage:()=>{}});
export function PublicLocale({children}:{children:ReactNode}){
 const [language,setLanguageState]=useState<Language>(()=>{try{return localStorage.getItem('saferide-public-language')==='en'?'en':'hi';}catch{return 'hi';}});
 const setLanguage=(value:Language)=>{setLanguageState(value);try{localStorage.setItem('saferide-public-language',value);}catch{/* Local storage may be disabled. */}};
 useEffect(()=>{document.documentElement.lang=language;document.documentElement.dir='ltr';document.title=language==='hi'?'सेफ़राइड — स्कूल परिवहन और यात्रा':'SafeRide — School Transport & Journeys';document.querySelector('meta[name="description"]')?.setAttribute('content',language==='hi'?'स्कूल परिवहन, छात्र यात्रा और अभिभावक अपडेट':'School transport, student journeys and parent updates');},[language]);
 return <Locale.Provider value={{language,setLanguage}}>{children}</Locale.Provider>;
}
export const usePublicLocale=()=>useContext(Locale);
export function LanguageSwitch(){const {language,setLanguage}=usePublicLocale();return <div className="language-switch" role="group" aria-label="Language / भाषा"><button type="button" aria-pressed={language==='hi'} onClick={()=>setLanguage('hi')}>हिन्दी</button><button type="button" aria-pressed={language==='en'} onClick={()=>setLanguage('en')}>English</button></div>}
export const formatInr=(paise:number,language:Language)=>new Intl.NumberFormat(language==='hi'?'hi-IN':'en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(paise/100);
export const formatWhen=(value:string|null|undefined,language:Language)=>value?new Intl.DateTimeFormat(language==='hi'?'hi-IN':'en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):(language==='hi'?'अभी कोई पुष्टि नहीं':'No confirmed update');
export const kolkataDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const hindiStatus:Record<string,string>={BOARDED:'गाड़ी में बैठा',SCHOOL_ARRIVED:'स्कूल पहुँचा',SCHOOL_REACHED:'स्कूल पहुँचा',RETURN_BOARDED:'वापसी में बैठा',HOME_DROPPED:'घर पहुँचा',MISSED_PICKUP:'पिकअप नहीं हुआ',LEAVE_CONFIRMED:'छुट्टी की पुष्टि',MORNING:'सुबह',AFTERNOON:'वापसी',PENDING:'लंबित',PENDING_VERIFICATION:'जाँच बाकी',VERIFIED:'सत्यापित',ACTIVE:'चालू',COMPLETED:'पूरा',REQUESTED:'अनुरोध भेजा',QUOTED:'किराया भेजा',CONFIRMED:'पुष्टि हुई',IN_PROGRESS:'यात्रा चालू',CANCELLED:'रद्द',REJECTED:'नामंज़ूर',APPROVED:'मंज़ूर',ACCEPTED:'स्वीकार किया',REVISION_REQUESTED:'बदलाव माँगा',AWAITING_ADVANCE:'अग्रिम की जाँच बाकी',DRAFT:'तैयारी में',PAUSED:'रुकी हुई',DECLINED:'अस्वीकार किया',WAITING:'प्रतीक्षा',NOT_STARTED:'शुरू नहीं हुई',FRESH:'हाल की जगह',STALE:'पुरानी जगह',DENIED:'अनुमति नहीं',UNAVAILABLE:'उपलब्ध नहीं',CORRECTION:'सुधार दर्ज'};
export const formatStatus=(value:string|null|undefined,language:Language)=>!value?(language==='hi'?'अभी पुष्टि नहीं':'Awaiting confirmation'):language==='hi'?(hindiStatus[value.toUpperCase()]??value.replaceAll('_',' ')):value.replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
