import { lazy, Suspense } from 'react';
const RunDetail = lazy(() => import('./run-pages').then(module => ({ default: module.RunDetail })));
const DriverDay = lazy(() => import('./driver-pages').then(module => ({ default: module.DriverDay })));
const DriverMore = lazy(() => import('./driver-pages').then(module => ({ default: module.DriverMore })));
const DriverTrips = lazy(() => import('./driver-pages').then(module => ({ default: module.DriverTrips })));
const DriverTripPage = lazy(() => import('./driver-trip-page').then(module => ({ default: module.DriverTripPage })));
const BookingList = lazy(() => import('./booking-pages').then(module => ({ default: module.BookingList })));
const BookingDetail = lazy(() => import('./booking-pages').then(module => ({ default: module.BookingDetail })));
const OwnerBookings = lazy(() => import('./booking-pages').then(module => ({ default: module.OwnerBookings })));
const OwnerBookingDetail = lazy(() => import('./booking-pages').then(module => ({ default: module.OwnerBookingDetail })));
const OwnerPhoneBooking = lazy(() => import('./booking-pages').then(module => ({ default: module.OwnerPhoneBooking })));
const BookingWizard = lazy(() => import('./booking-wizard').then(module => ({ default: module.BookingWizard })));
const OwnerUrgent = lazy(() => import('./urgent-pages').then(module => ({ default: module.OwnerUrgent })));
const BookingTrack = lazy(() => import('./tracking-pages').then(module => ({ default: module.BookingTrack })));
const OwnerLive = lazy(() => import('./tracking-pages').then(module => ({ default: module.OwnerLive })));
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { Principal, Role } from '@saferide/shared';
import { AppSidebar, CustomerMobileNav, DriverMobileNav, OwnerMobileNav, StudentMobileNav, EmptyState, NoticeCard, Topbar } from './components';
const StudentHomePage = lazy(() => import('./student-home-page').then(module => ({ default: module.StudentHomePage })));
const CustomerHome = lazy(() => import('./customer-pages').then(module => ({ default: module.CustomerHome })));
const CustomerTrack = lazy(() => import('./customer-pages').then(module => ({ default: module.CustomerTrack })));
const CustomerLeavePage = lazy(() => import('./leave-pages').then(module => ({ default: module.CustomerLeavePage })));
const OwnerLeavesPage = lazy(() => import('./leave-pages').then(module => ({ default: module.OwnerLeavesPage })));
const StudentLeavePage = lazy(() => import('./leave-pages').then(module => ({ default: module.StudentLeavePage })));
const CustomerSchoolPage = lazy(() => import('./school-pages').then(module => ({ default: module.CustomerSchoolPage })));
const OwnerSchoolPage = lazy(() => import('./school-pages').then(module => ({ default: module.OwnerSchoolPage })));
const SchoolApplyPage = lazy(() => import('./school-pages').then(module => ({ default: module.SchoolApplyPage })));
const CustomerChildrenPage = lazy(() => import('./student-pages').then(module => ({ default: module.CustomerChildrenPage })));
const OwnerStudentsPage = lazy(() => import('./student-pages').then(module => ({ default: module.OwnerStudentsPage })));
const DriverSchedulePage = lazy(() => import('./fleet-pages').then(module => ({ default: module.DriverSchedulePage })));
const OwnerFleetPage = lazy(() => import('./fleet-pages').then(module => ({ default: module.OwnerFleetPage })));
const OwnerRoutesPage = lazy(() => import('./fleet-pages').then(module => ({ default: module.OwnerRoutesPage })));
import { roleHome } from './auth-pages';
const OwnerSettingsPage = lazy(() => import('./owner-control-pages').then(module => ({ default: module.OwnerSettingsPage })));
const OwnerUsersAuditPage = lazy(() => import('./owner-control-pages').then(module => ({ default: module.OwnerUsersAuditPage })));
import './owner-control.css';
import { authApi } from './store';
const CustomerPayments = lazy(() => import('./payment-pages').then(module => ({ default: module.CustomerPayments })));
const OwnerPaymentVerify = lazy(() => import('./payment-pages').then(module => ({ default: module.OwnerPaymentVerify })));
const OwnerFeesPage = lazy(() => import('./fee-pages').then(module => ({ default: module.OwnerFeesPage })));
const NotificationBadge = lazy(() => import('./notification-pages').then(module => ({ default: module.NotificationBadge })));
const NotificationsPage = lazy(() => import('./notification-pages').then(module => ({ default: module.NotificationsPage })));
const OwnerNotificationsPage = lazy(() => import('./notification-pages').then(module => ({ default: module.OwnerNotificationsPage })));
const OwnerDashboardPage = lazy(() => import('./owner-overview-pages').then(module => ({ default: module.OwnerDashboardPage })));
const OwnerTransportCalendar = lazy(() => import('./owner-calendar-page').then(module => ({ default: module.OwnerTransportCalendar })));
const OwnerReportsPage = lazy(() => import('./finance-pages').then(module => ({ default: module.OwnerReportsPage })));
import './design-system.css';
import {usePublicLocale} from './public-locale';
const OwnerMorePage = lazy(() => import('./owner-more-page').then(module => ({ default: module.OwnerMorePage })));

type WorkspaceRole = 'customer'|'owner'|'driver'|'student';
const roleName: Record<WorkspaceRole, Role> = { customer:'CUSTOMER', owner:'OWNER', driver:'DRIVER', student:'STUDENT' };
const ownerGroups = [
  { heading: 'Today', links: [['Dashboard','/owner/dashboard'],['Student Tracking','/owner/live']] as [string,string][] },
  { heading: 'School transport', links: [['Enrollments','/owner/school/subscriptions'],['Students','/owner/school/students'],['Routes & Runs','/owner/school/routes'],['Leave Requests','/owner/school/leaves'],['Calendar','/owner/calendar']] as [string,string][] },
  { heading: 'Bookings', links: [['Requests','/owner/bookings/requests'],['All bookings','/owner/bookings'],['Urgent callbacks','/owner/urgent']] as [string,string][] },
  { heading: 'Fees & reports', links: [['Verify Payments','/owner/finance/verify'],['School Fees','/owner/finance/fees'],['Reports','/owner/reports']] as [string,string][] },
  { heading: 'Administration', links: [['Vehicles & Drivers','/owner/fleet'],['Notices','/owner/notifications'],['Settings','/owner/settings'],['Users & Audit','/owner/users']] as [string,string][] }
];
const customerGroups = [{ heading: 'Journeys', links: [['Home','/app/home'],['Book a trip','/app/book'],['My bookings','/app/bookings'],['Payments','/app/payments'],['Urgent help','/urgent']] as [string,string][] }, { heading: 'School transport', links: [['Home','/app/home'],['Track My Child','/app/school/track'],['School Service','/app/school'],['My Children','/app/school/children'],['Leave','/app/school/leave'],['School Fees','/app/payments'],['Notices','/app/notices'],['Account','/app/account']] as [string,string][] }];
const driverGroups = [{ heading: 'Assigned trips', links: [['My trips','/driver/trips']] as [string,string][] }, { heading: 'School duty', links: [['My Day','/driver/today'],['Notices & Help','/driver/more']] as [string,string][] }];
const studentGroups = [{ heading: 'My ride', links: [['Home','/student/home'],['Leave','/student/leave'],['Notices','/student/notices']] as [string,string][] }];
const namedRoutes: Record<string,string> = { '/app/home':'Home', '/app/school':'School transport', '/app/school/apply':'School application', '/app/school/children':'Children', '/app/school/track':'Track vehicle', '/app/school/leave':'Mark leave', '/app/bookings':'Bookings', '/app/book':'Book a vehicle', '/app/payments':'Payments', '/app/notices':'Notices', '/app/account':'Account', '/owner/dashboard':'Dashboard', '/owner/live':'Live operations', '/owner/calendar':'Calendar', '/owner/driver/today':'My driving duty', '/owner/school/subscriptions':'School subscriptions', '/owner/school/students':'Students', '/owner/school/routes':'Routes & runs', '/owner/school/leaves':'Leave requests', '/owner/bookings/requests':'Booking requests', '/owner/bookings':'All bookings', '/owner/urgent':'Urgent requests', '/owner/customers':'Customers', '/owner/finance/verify':'Verify payments', '/owner/finance/fees':'School fees', '/owner/finance/advances':'Advances', '/owner/finance/expenses':'Expenses', '/owner/reports':'Reports', '/owner/fleet':'Vehicles & drivers', '/owner/notifications':'Notices', '/owner/more':'More', '/owner/settings':'Settings', '/owner/users':'Users & audit', '/driver/today':'My day', '/driver/more':'More', '/student/home':'My ride', '/student/leave':'Leave', '/student/notices':'Notices' };
const hindiRoutes:Record<string,string>={'/app/home':'होम','/app/school':'स्कूल सेवा','/app/school/apply':'स्कूल आवेदन','/app/school/children':'बच्चे','/app/school/track':'गाड़ी देखें','/app/school/leave':'छुट्टी','/app/bookings':'बुकिंग','/app/book':'सवारी बुक करें','/app/payments':'भुगतान','/app/notices':'सूचनाएँ','/app/account':'खाता','/owner/dashboard':'होम','/owner/live':'गाड़ी की जगह','/owner/calendar':'कैलेंडर','/owner/driver/today':'आज की ड्यूटी','/owner/school/subscriptions':'स्कूल आवेदन','/owner/school/students':'छात्र','/owner/school/routes':'रास्ते और यात्राएँ','/owner/school/leaves':'छुट्टी अनुरोध','/owner/bookings/requests':'बुकिंग अनुरोध','/owner/bookings':'सभी बुकिंग','/owner/bookings/phone':'फोन से बुकिंग','/owner/urgent':'तुरंत अनुरोध','/owner/finance/verify':'भुगतान जाँचें','/owner/finance/fees':'स्कूल शुल्क','/owner/reports':'रिपोर्ट','/owner/fleet':'गाड़ी और ड्राइवर','/owner/notifications':'सूचनाएँ','/owner/more':'और', '/owner/settings':'सेटिंग्स','/owner/users':'लोग और रिकॉर्ड','/driver/today':'आज की ड्यूटी','/driver/more':'और','/student/home':'मेरी सवारी','/student/leave':'छुट्टी','/student/notices':'सूचनाएँ'};

export function ProtectedWorkspace({ role }: { role: WorkspaceRole }) {
  const { data, isLoading, isError, error, refetch } = authApi.useMeQuery();
  const location = useLocation();
  if (isLoading) return <div className="auth-loading" role="status">Checking account access…</div>;
  if (isError && error && 'status' in error && error.status !== 401) return <div className="auth-loading" role="alert"><div><p>Account access is temporarily unavailable.</p><button className="button secondary" onClick={refetch}>Try again</button></div></div>;
  if (isError || !data) return <Navigate to={['/app/book','/app/school/apply'].includes(location.pathname)?`/login?next=${encodeURIComponent(location.pathname)}`:'/login'} state={{ from: location.pathname }} replace/>;
  if (data.user.role !== roleName[role]) return <Navigate to={roleHome(data.user.role)} replace/>;
  return <Workspace role={role} user={data.user}/>;
}
function schoolPathAllowed(role: WorkspaceRole, path: string) {
  if (role === 'customer') return ['/app/home','/app/account','/app/book','/app/bookings','/app/school','/app/school/apply','/app/school/children','/app/school/track','/app/school/leave','/app/payments','/app/notices'].includes(path) || /^\/app\/bookings\/[a-f0-9]{24}(\/track)?$/i.test(path);
  if (role === 'driver') return ['/driver/today','/driver/more','/driver/trips'].includes(path) || path.startsWith('/driver/run/') || /^\/driver\/trip\/[a-f0-9]{24}$/i.test(path);
  if (role === 'owner') return ['/owner/dashboard','/owner/live','/owner/calendar','/owner/bookings','/owner/bookings/requests','/owner/bookings/phone','/owner/urgent','/owner/school/subscriptions','/owner/school/students','/owner/school/routes','/owner/school/leaves','/owner/finance/verify','/owner/finance/fees','/owner/reports','/owner/fleet','/owner/notifications','/owner/more','/owner/settings','/owner/users'].includes(path) || path.startsWith('/owner/school/run/') || path.startsWith('/owner/driver/run/') || path === '/owner/driver/today' || /^\/owner\/bookings\/[a-f0-9]{24}$/i.test(path);
  return ['/student/home','/student/leave','/student/notices'].includes(path);
}
function Workspace({ role, user }: { role: WorkspaceRole; user: Principal }) {
  const {language}=usePublicLocale(),hi=language==='hi';
  const {pathname}=useLocation(),navigate=useNavigate();
  const [open,setOpen]=useState(false),[logoutError,setLogoutError]=useState('');
  const [logout,{isLoading:loggingOut}]=authApi.useLogoutMutation();
  async function signOut(){setLogoutError('');try{await logout().unwrap();navigate('/login',{replace:true});}catch{setLogoutError('Could not log out. Please try again.');}}
  if (!schoolPathAllowed(role, pathname)) return <Navigate to={role==='customer'?'/app/home':role==='owner'?'/owner/dashboard':role==='driver'?'/driver/today':'/student/home'} replace/>;
  const title=namedRoutes[pathname] || (pathname.startsWith('/app/bookings/')?'Booking detail':pathname.startsWith('/driver/run/')||pathname.startsWith('/owner/school/run/')||pathname.startsWith('/owner/driver/run/')?'School run':pathname.startsWith('/driver/trip/')?'Private trip':'Workspace');
  const tripMode=role==='owner'&&(pathname.startsWith('/owner/driver/run/')||pathname.startsWith('/owner/school/run/')||pathname==='/owner/driver/today');
  const displayedTitle=hi?(hindiRoutes[pathname]??title):title;
  const groups=tripMode?[{heading:hi?'यात्रा मोड':'Trip Mode',links:[[hi?'आज की ड्यूटी':'Today', '/owner/driver/today'] as [string,string]]}]:role==='owner'?ownerGroups:role==='customer'?customerGroups:role==='driver'?driverGroups:studentGroups;
  return <div className={'workspace '+(role==='customer'?'customer-workspace':'')}><AppSidebar title={tripMode?(hi?'यात्रा मोड':'Trip Mode'):role==='owner'?'Business Control Center':role==='driver'?'Daily Driving Duty':role==='student'?'My School Journey':'Your transport companion'} groups={groups} open={open} close={()=>setOpen(false)}/><div className="app-content"><Topbar title={displayedTitle} userName={user.name} onMenu={()=>setOpen(true)} onLogout={signOut} loggingOut={loggingOut}/><div className="workspace-notification"><NotificationBadge to={role==='owner'?'/owner/notifications':role==='customer'?'/app/notices':role==='student'?'/student/notices':'/driver/more'}/></div><main className="page-body"><Suspense fallback={<div role="status">Loading page…</div>}>{logoutError&&<div className="notice failure" role="alert">{logoutError}</div>}{role!=='customer'&&role!=='driver'&&!['/owner/notifications','/owner/more','/owner/settings','/owner/users','/owner/dashboard','/owner/live','/owner/customers','/owner/finance/verify','/owner/finance/fees','/owner/finance/expenses','/owner/finance/advances','/owner/reports','/student/notices','/student/home','/student/leave','/owner/school/subscriptions','/owner/school/students','/owner/school/routes','/owner/fleet','/owner/calendar','/owner/bookings','/owner/bookings/requests','/owner/urgent','/driver/today'].includes(pathname)&&!pathname.startsWith('/owner/school/run/')&&!pathname.startsWith('/owner/driver/run/')&&!/^\/owner\/bookings\/[a-f0-9]{24}$/i.test(pathname)&&<div className="page-head"><div><div className="eyebrow">{role==='owner'?'Business workspace':'School journey'}</div><h1>{displayedTitle}</h1><p>{role==='owner'?'School runs, student tracking and fees in one place.':'Your authorized information will appear here.'}</p></div></div>}{pathname==='/owner/notifications'?<OwnerNotificationsPage/>:pathname==='/app/notices'||pathname==='/student/notices'?<NotificationsPage/>:role==='owner'&&pathname==='/owner/bookings/requests'?<OwnerBookings requests/>:role==='owner'&&pathname==='/owner/bookings'?<OwnerBookings/>:role==='owner'&&pathname==='/owner/bookings/phone'?<OwnerPhoneBooking/>:role==='owner'&&/^\/owner\/bookings\/[a-f0-9]{24}$/i.test(pathname)?<OwnerBookingDetail/>:role==='owner'&&pathname==='/owner/urgent'?<OwnerUrgent/>:role==='owner'&&pathname==='/owner/reports'?<OwnerReportsPage/>:role==='owner'&&pathname==='/owner/finance/fees'?<OwnerFeesPage/>:role==='owner'&&pathname==='/owner/finance/verify'?<OwnerPaymentVerify/>:role==='owner'&&pathname==='/owner/dashboard'?<OwnerDashboardPage/>:role==='owner'&&pathname==='/owner/live'?<OwnerLive/>:role==='owner'&&pathname==='/owner/users'?<OwnerUsersAuditPage/>:role==='owner'&&pathname==='/owner/more'?<OwnerMorePage/>:pathname==='/owner/settings'?<OwnerSettingsPage/>:role==='owner'&&pathname==='/owner/calendar'?<OwnerTransportCalendar/>:role==='owner'&&pathname==='/owner/fleet'?<OwnerFleetPage user={user}/>:role==='owner'&&pathname==='/owner/driver/today'&&user.abilities.includes('DRIVER_DUTY')?<DriverSchedulePage ownerDuty/>:role==='owner'&&pathname.startsWith('/owner/driver/run/')&&user.abilities.includes('DRIVER_DUTY')?<RunDetail/>:role==='owner'&&pathname==='/owner/school/routes'?<OwnerRoutesPage/>:role==='owner'&&pathname.startsWith('/owner/school/run/')?<RunDetail owner/>:role==='owner'&&pathname==='/owner/school/subscriptions'?<OwnerSchoolPage/>:role==='owner'&&pathname==='/owner/school/students'?<OwnerStudentsPage/>:role==='owner'&&pathname==='/owner/school/leaves'?<OwnerLeavesPage/>:role==='customer'&&pathname==='/app/book'?<BookingWizard/>:role==='customer'&&pathname==='/app/bookings'?<BookingList/>:role==='customer'&&/^\/app\/bookings\/[a-f0-9]{24}\/track$/i.test(pathname)?<BookingTrack/>:role==='customer'&&/^\/app\/bookings\/[a-f0-9]{24}$/i.test(pathname)?<BookingDetail/>:role==='customer'&&pathname==='/app/home'?<CustomerHome name={user.name}/>:role==='customer'&&pathname==='/app/account'?<AccountPanel user={user} onLogout={signOut}/>:role==='customer'&&pathname==='/app/school/track'?<CustomerTrack/>:role==='customer'&&pathname==='/app/school/leave'?<CustomerLeavePage/>:role==='customer'&&pathname==='/app/school'?<CustomerSchoolPage/>:role==='customer'&&pathname==='/app/school/apply'?<SchoolApplyPage/>:role==='customer'&&pathname==='/app/school/children'?<CustomerChildrenPage/>:role==='customer'&&pathname==='/app/payments'?<CustomerPayments/>:role==='driver'&&pathname==='/driver/trips'?<DriverTrips/>:role==='driver'&&/^\/driver\/trip\/[a-f0-9]{24}$/i.test(pathname)?<DriverTripPage/>:role==='driver'&&pathname==='/driver/today'?<DriverDay/>:role==='driver'&&pathname.startsWith('/driver/run/')?<RunDetail/>:role==='driver'&&pathname==='/driver/more'?<><DriverMore/><NotificationsPage/></>:role==='student'&&pathname==='/student/home'?<StudentHomePage/>:role==='student'&&pathname==='/student/leave'?<StudentLeavePage/>:<div className="card"><EmptyState title="This service is coming soon" body="Your account is signed in. This screen will show only your authorized records when its workflow is ready."/></div>}</Suspense></main>{role==='customer'&&<CustomerMobileNav/>}{role==='driver'&&<DriverMobileNav/>}{role==='owner'&&!tripMode&&<OwnerMobileNav/>}{role==='student'&&<StudentMobileNav/>}</div></div>;
}
function AccountPanel({user,onLogout}: {user:Principal;onLogout:()=>void}) { return <div className="card account-panel"><h2>Your account</h2><div className="account-row"><strong>Name</strong><span>{user.name}</span></div><div className="account-row"><strong>Mobile</strong><span>{user.mobile}</span></div><div className="account-row"><strong>Email</strong><span>{user.email || 'Not provided'}</span></div><NoticeCard title={user.contactVerified?'Contact verified':'Contact not verified'} body={user.contactVerified?'Your contact has been verified.':'You can use this account for eligible booking requests. Linking a child later requires approved enrollment and contact checks.'}/><button className="button secondary" onClick={onLogout}>Log out</button></div>; }


























