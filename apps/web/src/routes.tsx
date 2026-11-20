import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { EmptyState, OfflineState } from './components';
import {PublicLayout} from './public-layout';
const Contact=lazy(()=>import('./public-pages').then(module=>({default:module.Contact})));
const FaqPolicies=lazy(()=>import('./public-pages').then(module=>({default:module.FaqPolicies})));
const HowItWorks=lazy(()=>import('./public-pages').then(module=>({default:module.HowItWorks})));
const PrivacyPage=lazy(()=>import('./public-pages').then(module=>({default:module.PrivacyPage})));
const TermsPage=lazy(()=>import('./public-pages').then(module=>({default:module.TermsPage})));
const Vehicles=lazy(()=>import('./public-pages').then(module=>({default:module.Vehicles})));
const Home=lazy(()=>import('./public-premium').then(module=>({default:module.PremiumHome})));
const Services=lazy(()=>import('./public-premium').then(module=>({default:module.PremiumServices})));
const Urgent=lazy(()=>import('./urgent-pages').then(module=>({default:module.Urgent})));
const LoginPage=lazy(()=>import('./auth-pages').then(module=>({default:module.LoginPage})));
const SignupPage=lazy(()=>import('./auth-pages').then(module=>({default:module.SignupPage})));
const ForgotPage=lazy(()=>import('./auth-pages').then(module=>({default:module.ForgotPage})));
const AcceptInvitePage=lazy(()=>import('./auth-pages').then(module=>({default:module.AcceptInvitePage})));
const ResetPasswordPage=lazy(()=>import('./auth-pages').then(module=>({default:module.ResetPasswordPage})));
const ProtectedWorkspace = lazy(() => import('./workspace').then(module => ({ default: module.ProtectedWorkspace })));


function NotFound() { return <PublicLayout><div className="container inner-page"><EmptyState title="Page not found" body="Choose a different destination."/><Link className="button primary" to="/">Return home</Link></div></PublicLayout>; }
export function App() { return <><ScrollToTop/><OfflineWatcher/><Suspense fallback={<div className="container inner-page">Loading workspace…</div>}><Routes><Route path="/" element={<Home/>}/><Route path="/services" element={<Services/>}/><Route path="/vehicles" element={<Vehicles/>}/><Route path="/contact" element={<Contact/>}/><Route path="/urgent" element={<Urgent/>}/><Route path="/how-it-works" element={<HowItWorks/>}/><Route path="/faq" element={<FaqPolicies/>}/><Route path="/terms" element={<TermsPage/>}/><Route path="/privacy" element={<PrivacyPage/>}/><Route path="/login" element={<LoginPage/>}/><Route path="/signup" element={<SignupPage/>}/><Route path="/forgot-password" element={<ForgotPage/>}/><Route path="/accept-invite" element={<AcceptInvitePage/>}/><Route path="/reset-password" element={<ResetPasswordPage/>}/><Route path="/app/*" element={<ProtectedWorkspace role="customer"/>}/><Route path="/owner/*" element={<ProtectedWorkspace role="owner"/>}/><Route path="/driver/*" element={<ProtectedWorkspace role="driver"/>}/><Route path="/student/*" element={<ProtectedWorkspace role="student"/>}/><Route path="*" element={<NotFound/>}/></Routes></Suspense></>; }
function OfflineWatcher() { const [offline,setOffline]=useState(!navigator.onLine); useEffect(()=>{const update=()=>setOffline(!navigator.onLine);window.addEventListener('online',update);window.addEventListener('offline',update);return ()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update);};},[]); return offline?<div className="offline-banner"><OfflineState/></div>:null; }
function ScrollToTop() { const { pathname } = useLocation(); useEffect(() => { window.scrollTo(0, 0); }, [pathname]); return null; }

