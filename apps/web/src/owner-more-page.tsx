import {Link} from 'react-router-dom';
import {usePublicLocale} from './public-locale';

const destinations = [
  ['/owner/live','गाड़ी की जगह','Live operations'],
  ['/owner/calendar','कैलेंडर','Calendar'],
  ['/owner/fleet','गाड़ी और ड्राइवर','Vehicles and drivers'],
  ['/owner/notifications','सूचनाएँ','Notices'],
  ['/owner/reports','रिपोर्ट','Reports'],
  ['/owner/users','लोग और रिकॉर्ड','Users and audit'],
  ['/owner/settings','सेटिंग्स','Settings'],
] as const;

export function OwnerMorePage(){
  const {language}=usePublicLocale(),hi=language==='hi';
  return <div className="owner-more"><div className="page-head"><div><div className="eyebrow">{hi?'व्यवसाय':'Business'}</div><h1>{hi?'और काम':'More'}</h1><p>{hi?'नियमित काम ऊपर के मेन्यू में हैं। बाकी काम यहाँ सीधे खोलें।':'Open other business tools directly from here.'}</p></div></div><nav className="owner-more-links" aria-label={hi?'और काम':'More tools'}>{destinations.map(([path,hindi,english])=><Link className="card owner-more-link" to={path} key={path}>{hi?hindi:english}<span aria-hidden="true">→</span></Link>)}</nav></div>;
}
