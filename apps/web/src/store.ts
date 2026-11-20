import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery, setupListeners, type FetchArgs } from '@reduxjs/toolkit/query/react';
import { AuthResponseSchema, CalendarEntrySchema, CustomerDashboardSchema, FleetDriverSchema, FleetVehicleSchema, LeaveSchema, OwnerSubscriptionRequestInputSchema, PublicBusinessSchema, PublicServicesSchema, PublicVehicleSchema, SchoolCapacitySchema, SchoolRouteSchema, SchoolSubscriptionSchema, StudentSchema, SchoolRunSchema, type LeaveView, type SchoolRunView, type FleetVehicleInput, type FleetVehicle, type FleetDriver, type SchoolRoute, type SchoolRouteInput, type Student, type CustomerDashboard, type EnquiryInput, type LoginInput, type PublicBusiness, type PublicVehicle, type SchoolChildInput, type SchoolSubscription, type SchoolVehicleInput, type SignupInput, type SubscriptionRequestInput } from '@saferide/shared';
import type { z } from 'zod';
import {LocationStateSchema,type LocationState} from '@saferide/shared';
import {BookingViewSchema,BookingEstimateSchema,type BookingView,type BookingInput,type BookingEstimate} from '@saferide/shared';
import {UrgentRequestViewSchema,type UrgentRequestView,type UrgentRequestInput} from '@saferide/shared';
import {PaymentViewSchema,type PaymentView,PaymentInputSchema} from '@saferide/shared';
import {OwnerOverviewSchema,OwnerCustomerPageSchema,type OwnerOverview,type OwnerCustomer} from '@saferide/shared';
import {StudentHomeSchema,StudentAccessViewSchema,type StudentHome,type StudentAccessView} from '@saferide/shared';

const authSlice = createSlice({ name: 'auth', initialState: { csrfToken: '' }, reducers: { setCsrfToken: (state, action: PayloadAction<string>) => { state.csrfToken = action.payload; }, clearAuth: (state) => { state.csrfToken = ''; } } });
export const { setCsrfToken, clearAuth } = authSlice.actions;
const rawBaseQuery = fetchBaseQuery({ baseUrl: '/api', credentials: 'same-origin', prepareHeaders: (headers, { getState }) => { const token = (getState() as RootState).auth.csrfToken; if (token) headers.set('x-csrf-token', token); return headers; } });
const wait = (ms:number) => new Promise<void>(resolve => setTimeout(resolve, ms));
export const api = createApi({ reducerPath: 'api', baseQuery: async (args:string|FetchArgs, context, extra) => {
  const method = typeof args === 'string' ? 'GET' : (args.method ?? 'GET').toUpperCase();
  const csrfAtStart = (context.getState() as RootState).auth.csrfToken;
  let result = await rawBaseQuery(args, context, extra);
  // Only reads are retried. A lost mutation response may already represent a committed safety or money event.
  for (let attempt=0; method==='GET' && attempt<2 && result.error && (result.error.status==='FETCH_ERROR' || result.error.status===502 || result.error.status===503 || result.error.status===504); attempt++) {
    await wait(300 * 2 ** attempt);
    result = await rawBaseQuery(args, context, extra);
  }
  if (result.error?.status === 401 && csrfAtStart && (context.getState() as RootState).auth.csrfToken === csrfAtStart) {
    context.dispatch(clearAuth());
    queueMicrotask(() => context.dispatch(api.util.resetApiState()));
  }
  return result;
}, refetchOnFocus:true, refetchOnReconnect:true, keepUnusedDataFor:30, tagTypes: ['PublicServices', 'Session', 'Customer', 'Owner', 'Driver', 'Student','Subscription','Vehicle','Fleet','Route','Calendar','Run','Leave','Location','Booking','Urgent','Payment','PaymentSettings','Notification','Enquiry','Finance','Report'], endpoints: () => ({}) });
export type FinanceFilters={from:string;to:string;page:number;q:string;vehicleId?:string;driverId?:string;status?:string;month?:string};
export type ExpenseView={id:string;category:string;date:string;amountPaise:number;method:string;vehicleId:string|null;bookingId:string|null;tripId:string|null;note:string;proofReference:string;voidedAt:string|null;createdAt:string};
export type FinancePage<T>={items:T[];page:number;limit:number;total:number;totalPaise?:number;summary?:Record<string,number>};
const financeParams=(x:FinanceFilters)=>new URLSearchParams(Object.entries(x).filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>[k,String(v)]));
export const financeApi=api.injectEndpoints({endpoints:b=>({
 expenses:b.query<FinancePage<ExpenseView>,FinanceFilters>({query:x=>`/owner/finance/expenses?${financeParams(x)}`,providesTags:['Finance']}),
 createExpense:b.mutation<ExpenseView,Record<string,unknown>>({query:body=>({url:'/owner/finance/expenses',method:'POST',body}),invalidatesTags:['Finance']}),
 updateExpense:b.mutation<ExpenseView,{id:string;body:Record<string,unknown>}>({query:({id,body})=>({url:`/owner/finance/expenses/${id}`,method:'PUT',body}),invalidatesTags:['Finance']}),
 voidExpense:b.mutation<ExpenseView,{id:string;reason:string}>({query:({id,reason})=>({url:`/owner/finance/expenses/${id}`,method:'DELETE',body:{reason}}),invalidatesTags:['Finance']}),
 advances:b.query<FinancePage<{id:string;customerId:string;service:string;status:string;quotedFarePaise:number;advanceRequiredPaise:number;advancePaise:number;finalPaise:number;collectedPaise:number;pendingPaise:number;refundedPaise:number;outstandingPaise:number;vehicleId:string|null;startAt:string|null}>,FinanceFilters>({query:x=>`/owner/finance/advances?${financeParams(x)}`,providesTags:['Finance','Payment','Booking']}),
 report:b.query<FinancePage<Record<string,string|number>>,{kind:string;filters:FinanceFilters}>({query:({kind,filters})=>`/owner/finance/reports/${kind}?${financeParams(filters)}`,providesTags:(_result,_error,{kind})=>[{type:'Report',id:kind},'Finance','Payment','Booking','Run']}),
 summary:b.query<{revenuePaise:number;collectionPaise:number;refundsPaise:number;expensePaise:number;estimatedProfitPaise:number;schoolOutstandingPaise:number;bookingOutstandingPaise:number;pendingClaimsPaise:number;schoolVerifiedCollectionsPaise:number;bookingAdvancePaise:number;bookingFinalPaise:number},FinanceFilters>({query:x=>`/owner/finance/summary?${financeParams(x)}`,providesTags:['Finance','Payment','Booking']}),
 document:b.mutation<{number:string;kind:string;issuedAt:string;snapshot:Record<string,unknown>},{kind:string;id:string;month?:string;customer?:boolean}>({query:({kind,id,month,customer})=>({url:`/${customer?'customer':'owner'}/finance/documents/${kind}/${id}${month?`?month=${month}`:''}`,method:'POST'})})
})});
export type NotificationView={id:string;kind:string;title:string;body:string;deliveredAt:string;seenAt:string|null;readAt:string|null};
export const communicationsApi=api.injectEndpoints({endpoints:b=>({
 notifications:b.query<{items:NotificationView[];page:number;limit:number;total:number;unread:number},number>({query:page=>`/notifications?page=${page}`,providesTags:result=>[{type:'Notification',id:'LIST'},...(result?.items.map(item=>({type:'Notification' as const,id:item.id}))??[])]}),
 notificationCount:b.query<{unread:number},void>({query:()=>'/notifications/count',providesTags:['Notification']}),
 markSeen:b.mutation<{ok:boolean},string[]>({query:ids=>({url:'/notifications/seen',method:'POST',body:{ids}}),invalidatesTags:['Notification']}),
 markRead:b.mutation<NotificationView,string>({query:id=>({url:`/notifications/${id}/read`,method:'POST'}),invalidatesTags:['Notification']}),
 sendNotice:b.mutation<{id:string;count:number},{title:string;body:string;audience:'SCHOOL_ALL'|'SCHOOL_ROUTE'|'BOOKING_CUSTOMER'|'DRIVERS';routeId?:string;customerId?:string;category:'GENERAL'|'HOLIDAY'|'LATE_RUN'|'BOOKING'|'PAYMENT'}>({query:body=>({url:'/owner/communications/notices',method:'POST',body}),invalidatesTags:['Notification']}),
 enquiries:b.query<{items:{id:string;name:string;phone:string;service:string;message:string;status:string;createdAt:string}[];page:number;limit:number;total:number},number>({query:page=>`/owner/communications/enquiries?page=${page}`,providesTags:['Enquiry']}),
 handleEnquiry:b.mutation<unknown,string>({query:id=>({url:`/owner/communications/enquiries/${id}/handled`,method:'POST'}),invalidatesTags:['Enquiry']}),
 communicationUrgent:b.query<{id:string;phone:string;pickup:string;status:string;createdAt:string}[],void>({query:()=>'/owner/communications/urgent',providesTags:['Urgent']})
})});
export const ownerOverviewApi=api.injectEndpoints({endpoints:b=>({
 overview:b.query<OwnerOverview,{from:string;to:string}>({query:({from,to})=>`/owner/overview/dashboard?from=${from}&to=${to}`,transformResponse:(v:unknown)=>OwnerOverviewSchema.parse(v),providesTags:['Owner','Booking','Run','Payment','Fleet','Urgent']}),
 customers:b.query<{items:OwnerCustomer[];page:number;limit:number;total:number},{page:number;q:string}>({query:({page,q})=>`/owner/overview/customers?page=${page}&q=${encodeURIComponent(q)}`,transformResponse:(v:unknown)=>OwnerCustomerPageSchema.parse(v),providesTags:['Owner','Customer','Payment','Booking']})
})});
export const paymentsApi=api.injectEndpoints({endpoints:b=>({
 paymentInstructions:b.query<{upiId:string|null;qrUrl:string|null;cashInstructions:string;bankInstructions:string},void>({query:()=>'/customer/payments/instructions',providesTags:['PaymentSettings']}),
 ownerPaymentInstructions:b.query<{upiId:string|null;qrUrl:string|null;cashInstructions:string;bankInstructions:string},void>({query:()=>'/owner/payments/instructions',providesTags:['PaymentSettings']}),
 savePaymentInstructions:b.mutation<unknown,{upiId:string;qrUrl:string;cashInstructions:string;bankInstructions:string}>({query:body=>({url:'/owner/payments/instructions',method:'PUT',body}),invalidatesTags:['PaymentSettings']}),
 myPayments:b.query<PaymentView[],void>({query:()=>'/customer/payments',transformResponse:(v:unknown)=>PaymentViewSchema.array().parse(v),providesTags:result=>[{type:'Payment',id:'LIST'},...(result?.map(item=>({type:'Payment' as const,id:item.id}))??[])]}),
 schoolPaymentStatements:b.query<{childId:string;name:string;month:string;chargePaise:number;verifiedPaise:number;pendingPaise:number;duePaise:number;creditPaise:number}[],void>({query:()=>'/customer/payments/statements',providesTags:['Payment']}),
 paymentQueue:b.query<{items:PaymentView[];counts:Record<string,number>},{status?:string;q?:string}>({query:({status='',q=''})=>`/owner/payments?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}`,transformResponse:(v:{items:unknown;counts:Record<string,number>})=>({...v,items:PaymentViewSchema.array().parse(v.items)}),providesTags:result=>[{type:'Payment',id:'LIST'},...(result?.items.map(item=>({type:'Payment' as const,id:item.id}))??[])]}),
 claimPayment:b.mutation<PaymentView,import('zod').infer<typeof PaymentInputSchema>>({query:body=>({url:'/customer/payments',method:'POST',body}),invalidatesTags:['Payment','Booking','Notification']}),
 recordPayment:b.mutation<PaymentView,import('zod').infer<typeof PaymentInputSchema>>({query:body=>({url:'/owner/payments/record',method:'POST',body}),invalidatesTags:['Payment','Booking','Customer','Notification']}),
 decidePayment:b.mutation<PaymentView,{id:string;action:'verify'|'reject';body:unknown}>({query:({id,action,body})=>({url:`/owner/payments/${id}/${action}`,method:'POST',body}),invalidatesTags:['Payment','Booking','Customer','Notification']}),
 adjustPayment:b.mutation<{id:string},{id:string;kind:'REFUND'|'REVERSAL'|'ADJUSTMENT';amountPaise:number;reason:string;idempotencyKey:string}>({query:({id,...body})=>({url:`/owner/payments/${id}/adjust`,method:'POST',body}),invalidatesTags:['Payment','Booking','Customer','Notification']})
})});
export type FeeRow={childId:string;customerId:string;name:string;month:string;status:string;agreementVersion:number|null;dueDay:number|null;dueDate:string|null;startPolicy:string|null;prorationPolicy:string|null;billedPaise:number;adjustmentPaise:number;verifiedPaise:number;pendingPaise:number;previousDuePaise:number;previousCreditPaise:number;duePaise:number;creditPaise:number};
export const feesApi=api.injectEndpoints({endpoints:b=>({
 customerFees:b.query<{month:string;items:FeeRow[];totals:{billedPaise:number;verifiedPaise:number;pendingPaise:number;duePaise:number;creditPaise:number;previousDuePaise:number}},string>({query:month=>`/fees/customer?month=${month}`,providesTags:['Payment']}),
 ownerFees:b.query<{month:string;items:FeeRow[];page:number;limit:number;total:number},{month:string;q:string;page:number}>({query:({month,q,page})=>`/fees/owner?month=${month}&q=${encodeURIComponent(q)}&page=${page}`,providesTags:['Payment']}),
 proposedFeeAgreements:b.query<{id:string;childId:string;version:number;monthlyFeePaise:number;effectiveDate:string;dueDay:number;startPolicy:string}[],void>({query:()=>'/fees/customer/agreements',providesTags:['Payment']}),
 acceptFeeAgreement:b.mutation<{id:string;status:string},string>({query:id=>({url:`/fees/customer/agreements/${id}/accept`,method:'POST'}),invalidatesTags:['Payment','Notification']}),
 proposeFeeAgreement:b.mutation<unknown,{childId:string;monthlyFeePaise:number;effectiveDate:string;dueDay:number;startPolicy:'FULL_MONTH_FROM_START'|'NEXT_MONTH';reason:string}>({query:({childId,...body})=>({url:`/fees/owner/${childId}/agreements`,method:'POST',body}),invalidatesTags:['Payment','Notification']}),
 adjustFee:b.mutation<unknown,{childId:string;month:string;kind:'WAIVER'|'DISCOUNT'|'CHARGE';amountPaise:number;reason:string;idempotencyKey:string}>({query:({childId,...body})=>({url:`/fees/owner/${childId}/adjust`,method:'POST',body}),invalidatesTags:['Payment','Notification']}),
 reminderPreference:b.mutation<unknown,boolean>({query:enabled=>({url:'/fees/reminder-preference',method:'PUT',body:{enabled}})})
 ,studentFeeNotices:b.query<{id:string;title:string;body:string;createdAt:string}[],void>({query:()=>'/fees/student',providesTags:['Payment']})
})});
export const urgentApi=api.injectEndpoints({endpoints:builder=>({sendUrgent:builder.mutation<{id:string;status:'RECEIVED';message:string},UrgentRequestInput>({query:body=>({url:'/public/urgent',method:'POST',body})}),urgentQueue:builder.query<UrgentRequestView[],void>({query:()=>'/owner/urgent',transformResponse:(v:unknown)=>UrgentRequestViewSchema.array().parse(v),providesTags:['Urgent']}),urgentCount:builder.query<{count:number},void>({query:()=>'/owner/urgent/count',providesTags:['Urgent']}),urgentAction:builder.mutation<UrgentRequestView,{id:string;action:'contact'|'accept'|'decline'|'assign'|'withdraw';body:unknown}>({query:({id,action,body})=>({url:`/owner/urgent/${id}/${action}`,method:'POST',body}),transformResponse:(v:unknown)=>UrgentRequestViewSchema.parse(v),invalidatesTags:['Urgent','Calendar','Driver','Notification']})})});
export const bookingsApi=api.injectEndpoints({endpoints:builder=>({bookingEstimate:builder.mutation<BookingEstimate,BookingInput>({query:body=>({url:'/customer/bookings/estimate',method:'POST',body}),transformResponse:(v:unknown)=>BookingEstimateSchema.parse(v)}),bookingList:builder.query<BookingView[],void>({query:()=>'/customer/bookings',transformResponse:(v:unknown)=>BookingViewSchema.array().parse(v),providesTags:['Booking']}),bookingDetail:builder.query<BookingView,string>({query:id=>`/customer/bookings/${id}`,transformResponse:(v:unknown)=>BookingViewSchema.parse(v),providesTags:['Booking']}),createBooking:builder.mutation<BookingView,BookingInput>({query:body=>({url:'/customer/bookings',method:'POST',body}),transformResponse:(v:unknown)=>BookingViewSchema.parse(v),invalidatesTags:['Booking','Customer','Owner','Notification']}),customerAction:builder.mutation<BookingView,{id:string;action:'accept-quote'|'revision'|'cancel';reason?:string}>({query:({id,action,reason})=>({url:`/customer/bookings/${id}/${action}`,method:'POST',body:reason?{reason}:{}}),invalidatesTags:['Booking','Owner','Notification']}),ownerBookings:builder.query<BookingView[],boolean>({query:requests=>`/owner/bookings${requests?'/requests':''}`,transformResponse:(v:unknown)=>BookingViewSchema.array().parse(v),providesTags:['Booking']}),ownerBooking:builder.query<BookingView,string>({query:id=>`/owner/bookings/${id}`,transformResponse:(v:unknown)=>BookingViewSchema.parse(v),providesTags:['Booking']}),phoneBooking:builder.mutation<BookingView,BookingInput & {customerId:string;reason:string;customerConsent:true}>({query:body=>({url:'/owner/bookings/phone',method:'POST',body}),invalidatesTags:['Booking','Owner','Notification']}),decideDriverCharge:builder.mutation<BookingView,{id:string;proposalId:string;decision:'APPROVED'|'REJECTED';reason:string}>({query:({id,proposalId,...body})=>({url:`/owner/bookings/${id}/charge-proposals/${proposalId}/decision`,method:'POST',body}),invalidatesTags:['Booking','Owner','Driver','Notification']}),ownerBookingAction:builder.mutation<BookingView,{id:string;action:'quote'|'reject'|'waive-advance'|'confirm'|'reschedule'|'cancel'|'goods'|'goods/checkpoint';body:unknown}>({query:({id,action,body})=>({url:`/owner/bookings/${id}/${action}`,method:action==='goods'?'PUT':'POST',body}),invalidatesTags:['Booking','Owner','Calendar','Notification']})})});
export const publicApi = api.injectEndpoints({ endpoints: (builder) => ({
  services: builder.query<z.infer<typeof PublicServicesSchema>, void>({ query: () => '/public/services', transformResponse: (value: unknown) => PublicServicesSchema.parse(value), providesTags: ['PublicServices'] }),
  business: builder.query<PublicBusiness, void>({ query: () => '/public/business', transformResponse: (value: unknown) => PublicBusinessSchema.parse(value) }),
  vehicles: builder.query<PublicVehicle[], void>({ query: () => '/public/vehicles', transformResponse: (value: unknown) => PublicVehicleSchema.array().parse(value) }),
  sendEnquiry: builder.mutation<{ id: string; status: 'RECEIVED'; message: string }, EnquiryInput>({ query: (body) => ({ url: '/public/enquiries', method: 'POST', body }) })
}) });
type AuthResponse = z.infer<typeof AuthResponseSchema>;
export const authApi = api.injectEndpoints({ endpoints: builder => ({
  me: builder.query<AuthResponse, void>({ query: () => '/auth/me', transformResponse: (value: unknown) => AuthResponseSchema.parse(value), providesTags: ['Session'], async onQueryStarted(_arg, { dispatch, queryFulfilled }) { try { const { data } = await queryFulfilled; dispatch(setCsrfToken(data.csrfToken)); } catch { dispatch(clearAuth()); } } }),
  login: builder.mutation<AuthResponse, LoginInput>({ query: body => ({ url: '/auth/login', method: 'POST', body }), transformResponse: (value: unknown) => AuthResponseSchema.parse(value) }),
  signup: builder.mutation<AuthResponse, SignupInput>({ query: body => ({ url: '/auth/signup', method: 'POST', body }), transformResponse: (value: unknown) => AuthResponseSchema.parse(value) }),
  logout: builder.mutation<void, void>({ query: () => ({ url: '/auth/logout', method: 'POST' }), async onQueryStarted(_arg, { dispatch, queryFulfilled }) { try { await queryFulfilled; try{sessionStorage.removeItem('saferide-public-booking-draft');}catch{/* Storage is optional. */} dispatch(clearAuth()); dispatch(api.util.resetApiState()); } catch { /* Keep session state until a confirmed logout. */ } } }),
  acceptInvite: builder.mutation<{ message: string }, { token: string; password: string;acceptTerms?:boolean;acceptPrivacy?:boolean }>({ query: body => ({ url: '/auth/accept-invite', method: 'POST', body }) }),
  resetPassword: builder.mutation<{ message: string }, { token: string; password: string }>({ query: body => ({ url: '/auth/reset-password', method: 'POST', body }) }),
  inviteDriver: builder.mutation<{ id: string; activationToken: string; note: string }, { name: string; mobile: string; email?: string }>({ query: body => ({ url: '/owner/users/invite-driver', method: 'POST', body }), invalidatesTags: ['Owner'] }),
  reinviteDriver: builder.mutation<{ activationToken: string; note: string }, string>({ query: id => ({ url: `/owner/users/${id}/reinvite`, method: 'POST' }) }),
  ownerUsers: builder.query<{ id: string; name: string; mobile: string; role: string; status: string }[], void>({ query: () => '/owner/users', providesTags: ['Owner'] }),
  ownerReset: builder.mutation<{ resetToken: string; note: string }, { id: string; reason: string }>({ query: ({ id, reason }) => ({ url: `/owner/users/${id}/reset`, method: 'POST', body: { reason } }) }),
  deactivateUser: builder.mutation<{ status: string }, { id: string; reason: string }>({ query: ({ id, reason }) => ({ url: `/owner/users/${id}/deactivate`, method: 'POST', body: { reason } }), invalidatesTags: ['Owner'] })
}) });
export type OwnerSettings = {name:string;contactName:string;tagline:string;logoUrl:string;phone:string;email:string;whatsapp:string;serviceArea:string;serviceAreas:string[];businessHours:string;paymentUpiId:string;paymentQrUrl:string;paymentCashInstructions:string;paymentBankInstructions:string;homepageHeadline:string;homepageDescription:string;language:'en'|'hi';schoolDueDay:number;schoolReminderDays:number[];baseFarePaise:number;perKmPaise:number;perHourPaise:number;perDayPaise:number;advancePercent:number;cancellationPolicy:string;refundPolicy:string;gpsFreshnessMinutes:number;gpsRetentionDays:number};
export type OwnerAudit = {id:string;actorId:string;targetId:string;action:string;reason:string|null;oldValue:unknown;newValue:unknown;reference:string|null;createdAt:string};
export type VehicleRate={vehicleId:string;service:'wedding'|'party'|'local'|'outstation'|'airport'|'goods';basePaise:number;perKmPaise:number;perHourPaise:number;fullDayPaise:number;minimumPaise:number;roundTripMultiplier:number;nightPaise:number;waitingPerHourPaise:number;tollPaise:number;parkingPaise:number;discountPaise:number};
export const ownerControlApi=api.injectEndpoints({endpoints:b=>({
 ownerSettings:b.query<OwnerSettings,void>({query:()=>'/owner/control/settings',providesTags:['Owner']}),
 saveOwnerSettings:b.mutation<OwnerSettings,OwnerSettings&{reason:string}>({query:body=>({url:'/owner/control/settings',method:'PUT',body}),invalidatesTags:['Owner','PaymentSettings','PublicServices']}),
 vehicleRates:b.query<VehicleRate[],void>({query:()=>'/owner/control/rates',providesTags:['Owner']}),
 saveVehicleRates:b.mutation<VehicleRate[],{rates:VehicleRate[];reason:string}>({query:body=>({url:'/owner/control/rates',method:'PUT',body}),invalidatesTags:['Owner','Booking']}),
 ownerAudit:b.query<{page:number;items:OwnerAudit[]},number>({query:page=>`/owner/control/audit?page=${page}`,providesTags:['Owner']}),
 createCustomer:b.mutation<{id:string;activationToken:string},{name:string;mobile:string;email:string;reason:string}>({query:body=>({url:'/owner/control/customers',method:'POST',body}),invalidatesTags:['Owner','Customer']}),
 editAccount:b.mutation<unknown,{id:string;name?:string;mobile?:string;email?:string;reason:string}>({query:({id,...body})=>({url:`/owner/control/users/${id}`,method:'PATCH',body}),invalidatesTags:['Owner','Customer']}),
 deleteAccount:b.mutation<unknown,{id:string;reason:string;confirmation:string}>({query:({id,...body})=>({url:`/owner/control/users/${id}/delete`,method:'POST',body}),invalidatesTags:['Owner','Customer','Session']})
})});
export const customerApi = api.injectEndpoints({ endpoints: builder => ({
  dashboard: builder.query<CustomerDashboard, void>({ query: () => '/customer/dashboard', transformResponse: (value: unknown) => CustomerDashboardSchema.parse(value), providesTags: ['Customer'] }),
  location: builder.query<LocationState,{kind:'run'|'booking';tripId:string;childId?:string}>({ query: ({kind,tripId,childId}) => `/tracking/${kind}/${tripId}${childId?`?childId=${childId}`:''}`,transformResponse:(value:unknown)=>LocationStateSchema.parse(value),keepUnusedDataFor:0,
    async onCacheEntryAdded(selection,{cacheDataLoaded,cacheEntryRemoved,updateCachedData,dispatch}) {
      let socket: import('socket.io-client').Socket | undefined;
      let removed=false;
      void cacheEntryRemoved.then(()=>{removed=true;socket?.disconnect();});
      try {
        await cacheDataLoaded;
        const {io}=await import('socket.io-client');
        if(removed)return;
        const proxied = import.meta.env.MODE === 'vercel';
        socket=io({
          path:proxied?'/api/live':'/socket.io',
          addTrailingSlash:!proxied,
          transports:[proxied?'polling':'websocket'],
          withCredentials:true
        });
        const accept=(raw:unknown)=>{
          const result=LocationStateSchema.safeParse(raw);
          if(result.success&&result.data.kind===selection.kind&&result.data.tripId===selection.tripId)updateCachedData(()=>result.data);
        };
        socket.on('connect',()=>socket?.emit('tracking:join',selection,(reply:{ok:boolean;point?:unknown})=>{if(reply.ok)accept(reply.point);else dispatch(customerApi.util.invalidateTags(['Location']));}));
        socket.on('tracking:update',accept);
        socket.on('tracking:revoked',()=>dispatch(customerApi.util.invalidateTags(['Location','Run','Customer','Student'])));
      }catch{/* Cache removed before the first snapshot. */}
    },
    providesTags:['Location'] }),
  requestLeave: builder.mutation<{ id: string; status: string }, { childId: string; date: string; reason: string }>({ query: body => ({ url: '/leaves', method: 'POST', body }), invalidatesTags: ['Customer','Leave','Run'] })
}) });
export const leavesApi=api.injectEndpoints({endpoints:builder=>({
  studentProfile:builder.query<{id:string;name:string;school:string},void>({query:()=>'/leaves/student-profile',providesTags:['Student']}),
  leaveDay:builder.query<{serviceDay:'SCHEDULED'|'HOLIDAY'|'ROUTE_CANCELLED'|'NO_ROUTE';routeName:string|null},{childId:string;date:string}>({query:({childId,date})=>`/leaves/day?childId=${childId}&date=${date}`,providesTags:['Route']}),
  leaves:builder.query<LeaveView[],void>({query:()=>'/leaves',transformResponse:(v:unknown)=>LeaveSchema.array().parse(v),providesTags:['Leave']}),
  createLeave:builder.mutation<{id:string;status:string},{childId:string;date:string;reason:string}>({query:body=>({url:'/leaves',method:'POST',body}),invalidatesTags:['Leave','Run','Customer','Notification']}),
  callInLeave:builder.mutation<{id:string;status:string},{childId:string;date:string;reason:string}>({query:body=>({url:'/leaves/call-in',method:'POST',body}),invalidatesTags:['Leave','Run','Customer','Notification']}),
  decideLeave:builder.mutation<{id:string;status:string},{id:string;action:'confirm'|'decline'|'cancel'|'approve'|'reject'|'correct';reason?:string}>({query:({id,action,reason})=>({url:`/leaves/${id}/${action}`,method:'POST',body:{reason}}),invalidatesTags:['Leave','Run','Customer','Notification','Student']})
})});
export const studentApi=api.injectEndpoints({endpoints:b=>({
  home:b.query<StudentHome,void>({query:()=>'/student/home',transformResponse:(v:unknown)=>StudentHomeSchema.parse(v),providesTags:['Student','Run','Location']}),
  access:b.query<StudentAccessView[],void>({query:()=>'/student-access',transformResponse:(v:unknown)=>StudentAccessViewSchema.array().parse(v),providesTags:['Student']}),
  requestAccess:b.mutation<StudentAccessView,{childId:string;mobile:string;ageYears:number;guardianConsent:true}>({query:({childId,...body})=>({url:`/student-access/${childId}/request`,method:'POST',body}),invalidatesTags:['Student','Notification']}),
  invite:b.mutation<StudentAccessView&{activationToken:string;expiresInHours:number},{childId:string;reason:string}>({query:({childId,reason})=>({url:`/student-access/${childId}/invite`,method:'POST',body:{reason}}),invalidatesTags:['Student','Notification']}),
  revoke:b.mutation<StudentAccessView,{childId:string;reason:string}>({query:({childId,reason})=>({url:`/student-access/${childId}/revoke`,method:'POST',body:{reason}}),invalidatesTags:['Student','Notification']})
})});
export const schoolApi = api.injectEndpoints({ endpoints: builder => ({
  mySubscriptions: builder.query<SchoolSubscription[], void>({ query: () => '/customer/school/subscriptions', transformResponse: (value: unknown) => SchoolSubscriptionSchema.array().parse(value), providesTags: result => ['Customer' as const,{type:'Subscription' as const,id:'LIST'},...(result?.map(item=>({type:'Subscription' as const,id:item.id}))??[])] }),
  requestSchool: builder.mutation<SchoolSubscription, SubscriptionRequestInput>({ query: body => ({ url: '/customer/school/subscriptions', method: 'POST', body }), invalidatesTags: ['Customer','Owner'] }),
  acceptSchoolQuote: builder.mutation<SchoolSubscription, {id:string;version:number}>({ query: ({id,version}) => ({ url: `/customer/school/subscriptions/${id}/accept`, method: 'POST', body:{version} }), invalidatesTags: ['Customer','Owner','Notification'] }),
  declineSchoolQuote: builder.mutation<SchoolSubscription, {id:string;version:number}>({ query: ({id,version}) => ({ url: `/customer/school/subscriptions/${id}/decline`, method: 'POST', body:{version} }), invalidatesTags: ['Customer','Owner','Notification'] }),
  addSchoolChild: builder.mutation<{id:string;name:string},{id:string;body:SchoolChildInput}>({ query: ({id,body}) => ({ url: `/customer/school/subscriptions/${id}/children`, method: 'POST', body }), invalidatesTags: ['Customer','Owner','Student'] }),
  ownerSubscriptions: builder.query<SchoolSubscription[], void>({ query: () => '/owner/school/subscriptions', transformResponse: (value: unknown) => SchoolSubscriptionSchema.array().parse(value), providesTags: result => ['Owner' as const,{type:'Subscription' as const,id:'LIST'},...(result?.map(item=>({type:'Subscription' as const,id:item.id}))??[])] }),
  schoolCapacity: builder.query<z.infer<typeof SchoolCapacitySchema>, void>({ query: () => '/owner/school/capacity', transformResponse: (value: unknown) => SchoolCapacitySchema.parse(value), providesTags: ['Owner','Fleet'] }),
  addSchoolVehicle: builder.mutation<{id:string;name:string;seats:number},SchoolVehicleInput>({ query: body => ({ url: '/owner/school/vehicles', method: 'POST', body }), invalidatesTags: ['Owner'] }),
  ownerSchoolCustomers: builder.query<{id:string;name:string;mobile:string}[], string>({ query: q => `/owner/school/customers?q=${encodeURIComponent(q)}` }),
  ownerRequestSchool: builder.mutation<SchoolSubscription,z.infer<typeof OwnerSubscriptionRequestInputSchema>>({ query: body => ({ url: '/owner/school/subscriptions', method: 'POST', body }), invalidatesTags: ['Owner'] }),
  approveProposal: builder.mutation<SchoolSubscription,{id:string;version:number;reason:string}>({ query: ({id,...body}) => ({ url: `/owner/school/subscriptions/${id}/approve-proposal`, method: 'POST',body }), invalidatesTags: ['Owner','Customer','Notification'] }),
  counterProposal: builder.mutation<SchoolSubscription,{id:string;version:number;monthlyFeePaise:number;effectiveDate:string;expiresAt:string;reason:string}>({ query: ({id,...body}) => ({ url: `/owner/school/subscriptions/${id}/counter`, method: 'POST',body }), invalidatesTags: ['Owner','Customer','Notification'] }),
  quoteSchool: builder.mutation<SchoolSubscription,{id:string;legacy:boolean;body:{monthlyFeePaise:number;approvedSlots:number;effectiveDate:string;expiresAt:string;ownerNotes:string;reason:string;version:number}}>({ query: ({id,legacy,body}) => ({ url: `/owner/school/subscriptions/${id}/${legacy?'quote':'counter'}`, method: 'POST', body }), invalidatesTags: ['Owner','Customer','Notification'] }),
  approveSchool: builder.mutation<SchoolSubscription,{id:string;body:{vehicleId:string;driverId:string;routeName:string;reason:string}}>({ query: ({id,body}) => ({ url: `/owner/school/subscriptions/${id}/approve`, method: 'POST', body }), invalidatesTags: ['Owner','Customer'] }),
  decideSchool: builder.mutation<SchoolSubscription,{id:string;action:'activate'|'reject'|'pause'|'resume'|'cancel';reason:string}>({ query: ({id,action,reason}) => ({ url: `/owner/school/subscriptions/${id}/${action}`, method: 'POST', body: {reason} }), invalidatesTags: ['Owner','Customer'] }),
  ownerAddSchoolChild: builder.mutation<{id:string;name:string},{id:string;body:SchoolChildInput}>({ query: ({id,body}) => ({ url: `/owner/school/subscriptions/${id}/children`, method: 'POST', body }), invalidatesTags: ['Owner','Customer','Student'] })
}) });
export const studentsApi=api.injectEndpoints({endpoints:builder=>({
  myStudents:builder.query<Student[],void>({query:()=>'/customer/students',transformResponse:(value:unknown)=>StudentSchema.array().parse(value),providesTags:result=>[{type:'Student',id:'LIST'},...(result?.map(item=>({type:'Student' as const,id:item.id}))??[])]}),
  ownerStudents:builder.query<Student[],void>({query:()=>'/owner/students',transformResponse:(value:unknown)=>StudentSchema.array().parse(value),providesTags:result=>[{type:'Student',id:'LIST'},...(result?.map(item=>({type:'Student' as const,id:item.id}))??[])]}),
  guardianInvites:builder.query<{id:string;studentName:string;school:string}[],void>({query:()=>'/customer/students/guardian-invites',providesTags:result=>[{type:'Student',id:'LIST'},...(result?.map(item=>({type:'Student' as const,id:item.id}))??[])]}),
  respondGuardian:builder.mutation<{status:string},{id:string;decision:'accept'|'reject'}>({query:({id,decision})=>({url:`/customer/students/guardian-invites/${id}/respond`,method:'POST',body:{decision}}),invalidatesTags:['Student']}),
  requestStudentChange:builder.mutation<{id:string;status:string},{id:string;body:{kind:'PICKUP_STOP'|'CLASS'|'EMERGENCY_CONTACT'|'FEE';proposedValue:string;reason:string;effectiveDate?:string}}>({query:({id,body})=>({url:`/customer/students/${id}/change-requests`,method:'POST',body}),invalidatesTags:['Student']}),
  reviewStudent:builder.mutation<{status:string},{id:string;body:{approvedStop:string;routeName:string;effectiveDate:string;reason:string}}>({query:({id,body})=>({url:`/owner/students/${id}/review`,method:'POST',body}),invalidatesTags:['Student','Owner','Customer','Notification']}),
  inviteGuardian:builder.mutation<{id:string;status:string},{id:string;customerId:string;proofNote:string}>({query:({id,...body})=>({url:`/owner/students/${id}/guardian-invites`,method:'POST',body}),invalidatesTags:['Student']}),
  reviewGuardian:builder.mutation<{status:string},{id:string;approve:boolean;reason:string}>({query:({id,...body})=>({url:`/owner/students/guardian-invites/${id}/review`,method:'POST',body}),invalidatesTags:['Student']}),
  reviewStudentChange:builder.mutation<{status:string},{id:string;approve:boolean;reason:string}>({query:({id,...body})=>({url:`/owner/students/change-requests/${id}/review`,method:'POST',body}),invalidatesTags:['Student']}),
  deactivateStudent:builder.mutation<{status:string},{id:string;reason:string}>({query:({id,reason})=>({url:`/owner/students/${id}/deactivate`,method:'POST',body:{reason}}),invalidatesTags:['Student','Customer','Owner','Notification']}),
  anonymizeStudent:builder.mutation<{status:string},{id:string;reason:string}>({query:({id,reason})=>({url:`/owner/students/${id}/anonymize`,method:'POST',body:{reason,confirm:'ANONYMIZE'}}),invalidatesTags:['Student','Customer','Owner','Notification']})
})});
export const opsApi=api.injectEndpoints({endpoints:builder=>({
  fleetVehicles:builder.query<{items:FleetVehicle[];total:number;page:number;limit:number},{q?:string;page?:number}>({query:({q='',page=1})=>`/owner/ops/vehicles?q=${encodeURIComponent(q)}&page=${page}`,transformResponse:(v:{items:unknown;total:number;page:number;limit:number})=>({...v,items:FleetVehicleSchema.array().parse(v.items)}),providesTags:result=>['Fleet' as const,{type:'Vehicle' as const,id:'LIST'},...(result?.items.map(item=>({type:'Vehicle' as const,id:item.id}))??[])]}),
  fleetDrivers:builder.query<FleetDriver[],void>({query:()=>'/owner/ops/drivers',transformResponse:(v:unknown)=>FleetDriverSchema.array().parse(v),providesTags:['Fleet']}),
  createVehicle:builder.mutation<FleetVehicle,FleetVehicleInput>({query:body=>({url:'/owner/ops/vehicles',method:'POST',body}),invalidatesTags:['Fleet']}),
  updateVehicle:builder.mutation<FleetVehicle,{id:string;body:FleetVehicleInput}>({query:({id,body})=>({url:`/owner/ops/vehicles/${id}`,method:'PATCH',body}),invalidatesTags:(_result,_error,{id})=>['Fleet','Route','Calendar',{type:'Vehicle',id}]}),
  deactivateVehicle:builder.mutation<{active:boolean},{id:string;reason:string}>({query:({id,reason})=>({url:`/owner/ops/vehicles/${id}/deactivate`,method:'POST',body:{reason}}),invalidatesTags:['Fleet']}),
  reactivateVehicle:builder.mutation<{active:boolean},{id:string;reason:string}>({query:({id,reason})=>({url:`/owner/ops/vehicles/${id}/reactivate`,method:'POST',body:{reason}}),invalidatesTags:['Fleet']}),
  uploadVehiclePhoto:builder.mutation<{imageUrl:string},{id:string;file:File}>({query:({id,file})=>({url:`/owner/ops/vehicles/${id}/photo`,method:'PUT',body:file,headers:{'Content-Type':file.type}}),invalidatesTags:['Fleet']}),
  updateDriverProfile:builder.mutation<{updated:boolean},{id:string;body:{qualifications:('PASSENGER'|'SCHOOL'|'GOODS')[];licenseExpiry:string|null;notes:string}}>({query:({id,body})=>({url:`/owner/ops/drivers/${id}/profile`,method:'PUT',body}),invalidatesTags:['Fleet']}),
  reactivateDriver:builder.mutation<{status:string},{id:string;reason:string}>({query:({id,reason})=>({url:`/owner/ops/drivers/${id}/reactivate`,method:'POST',body:{reason}}),invalidatesTags:['Fleet']}),
  ownerDriverDuty:builder.mutation<{abilities:string[];message:string},{id:string;enabled:boolean;reason:string}>({query:({id,enabled,reason})=>({url:`/owner/users/${id}/driver-duty`,method:'POST',body:{enabled,reason}}),invalidatesTags:['Fleet','Session']}),
  schoolRoutes:builder.query<{items:SchoolRoute[];total:number;page:number;limit:number},{q?:string;page?:number}>({query:({q='',page=1})=>`/owner/ops/routes?q=${encodeURIComponent(q)}&page=${page}`,transformResponse:(v:{items:unknown;total:number;page:number;limit:number})=>({...v,items:SchoolRouteSchema.array().parse(v.items)}),providesTags:['Route']}),
  createRoute:builder.mutation<SchoolRoute,SchoolRouteInput>({query:body=>({url:'/owner/ops/routes',method:'POST',body}),invalidatesTags:['Route','Calendar']}),
  updateRoute:builder.mutation<SchoolRoute,{id:string;body:SchoolRouteInput}>({query:({id,body})=>({url:`/owner/ops/routes/${id}`,method:'PUT',body}),invalidatesTags:['Route','Calendar']}),
  assignStudentStop:builder.mutation<{studentId:string;routeId:string;stopId:string},{routeId:string;childId:string;stopId:string;reason:string}>({query:({routeId,childId,stopId,reason})=>({url:`/owner/ops/routes/${routeId}/students/${childId}`,method:'POST',body:{stopId,reason}}),invalidatesTags:['Route','Student']}),
  createBlock:builder.mutation<{id:string},{type:'MAINTENANCE'|'DRIVER_UNAVAILABLE';vehicleId:string|null;driverId:string|null;startAt:string;endAt:string;reason:string}>({query:body=>({url:'/owner/ops/blocks',method:'POST',body}),invalidatesTags:['Calendar','Fleet']}),
  cancelBlock:builder.mutation<{active:boolean},{id:string;reason:string}>({query:({id,reason})=>({url:`/owner/ops/blocks/${id}/cancel`,method:'POST',body:{reason}}),invalidatesTags:['Calendar']}),
  calendar:builder.query<z.infer<typeof CalendarEntrySchema>[],{from:string;to:string}>({query:({from,to})=>`/owner/ops/calendar?from=${from}&to=${to}`,transformResponse:(v:unknown)=>CalendarEntrySchema.array().parse(v),providesTags:['Calendar']}),
  driverToday:builder.query<{date:string;routes:{id:string;name:string;school:string;vehicleName:string;registration:string|null;morning:{start:string;end:string};return:{start:string;end:string};stops:{name:string;order:number}[]}[];bookings:{id:string;startAt:string;endAt:string}[];urgents:{id:string;startAt:string;endAt:string;pickup:string;destination:string;phone:string;location:{latitude:number;longitude:number;accuracy:number}|null}[];unavailable:{startAt:string;endAt:string}[]},void>({query:()=>'/driver/schedule/today',providesTags:['Driver','Route']})
})});
export const runsApi=api.injectEndpoints({endpoints:builder=>({
  runs:builder.query<SchoolRunView[],void>({query:()=>'/runs',transformResponse:(v:unknown)=>SchoolRunSchema.array().parse(v),providesTags:result=>[{type:'Run',id:'LIST'},...(result?.map(item=>({type:'Run' as const,id:item.id}))??[])]}),
  run:builder.query<SchoolRunView,string>({query:id=>`/runs/${id}`,transformResponse:(v:unknown)=>SchoolRunSchema.parse(v),providesTags:(_result,_error,id)=>[{type:'Run',id}]}),
  startRun:builder.mutation<SchoolRunView,{routeId:string;date:string;session:'morning'|'afternoon'}>({query:body=>({url:'/runs',method:'POST',body}),invalidatesTags:['Run','Customer','Owner','Driver','Notification']}),
  runEvent:builder.mutation<SchoolRunView,{runId:string;childId:string;action:string;reason:string;idempotencyKey:string}>({query:({runId,...body})=>({url:`/runs/${runId}/events`,method:'POST',body}),invalidatesTags:['Run','Customer','Owner','Notification']}),
  correctRunEvent:builder.mutation<SchoolRunView,{runId:string;eventId:string;correctedAction:string;reason:string;idempotencyKey:string}>({query:({runId,...body})=>({url:`/runs/${runId}/corrections`,method:'POST',body}),invalidatesTags:['Run','Customer','Owner','Notification']})
  ,completeRun:builder.mutation<SchoolRunView,string>({query:id=>({url:`/runs/${id}/complete`,method:'POST'}),invalidatesTags:['Run','Customer','Owner','Driver','Location','Notification']})
})});
export const trackingApi=api.injectEndpoints({endpoints:builder=>({
  active:builder.query<(LocationState&{label:string;driverName:string|null;driverPhone:string|null})[],void>({query:()=>'/tracking/active',providesTags:['Location']}),
  sharing:builder.mutation<LocationState,{kind:'run'|'booking';tripId:string;enabled:boolean}>({query:body=>({url:'/tracking/sharing',method:'POST',body}),invalidatesTags:['Location']}),
  point:builder.mutation<LocationState,{kind:'run'|'booking';tripId:string;heading?:number|null;speed?:number|null;latitude:number;longitude:number;accuracy:number;observedAt:string}>({query:body=>({url:'/tracking/point',method:'POST',body}),invalidatesTags:['Location']})
})});
export type DriverTrip={id:string;service:string;status:string;stage:string|null;startAt:string|null;actualStartedAt:string|null;actualEndedAt:string|null;pickup:string;destination:string;stops:string[];customerName:string;customerPhone:string|null;ownerPhone:string|null;vehicleName:string;registration:string|null;startOdometerKm:number|null;endOdometerKm:number|null;additionalChargeProposals:{id:string;amountPaise:number;reason:string;status:string;at:string}[];history:{action:string;at:string;reason:string|null}[]};
export const driverApi=api.injectEndpoints({endpoints:b=>({
 day:b.query<{date:string;ownerPhone:string|null;items:{kind:'run'|'booking';id:string;runId:string|null;session:string|null;startAt:string;title:string;summary:string;vehicleName:string;registration:string|null;status:string}[];unavailable:{startAt:string;endAt:string}[]},void>({query:()=>'/driver/today',providesTags:['Driver','Run','Booking']}),
 trip:b.query<DriverTrip,string>({query:id=>`/driver/trips/${id}`,providesTags:['Driver','Booking']}),
 progress:b.mutation<DriverTrip,{id:string;stage:string;idempotencyKey:string;odometerKm?:number}>({query:({id,...body})=>({url:`/driver/trips/${id}/progress`,method:'POST',body}),invalidatesTags:['Driver','Booking','Customer','Owner','Location','Notification']}),
 report:b.mutation<{saved:boolean},{id:string;kind:string;message:string;idempotencyKey:string}>({query:({id,...body})=>({url:`/driver/trips/${id}/report`,method:'POST',body}),invalidatesTags:['Driver','Booking','Customer','Owner','Notification']}),
 charge:b.mutation<DriverTrip,{id:string;amountPaise:number;reason:string;idempotencyKey:string}>({query:({id,...body})=>({url:`/driver/trips/${id}/charges`,method:'POST',body}),invalidatesTags:['Driver','Booking','Owner','Notification']}),
 parentContact:b.query<{name:string|null;phone:string|null},{runId:string;childId:string}>({query:({runId,childId})=>`/driver/runs/${runId}/contact/${childId}`}),
 runReport:b.mutation<{saved:boolean},{runId:string;kind:string;message:string;idempotencyKey:string}>({query:({runId,...body})=>({url:`/driver/runs/${runId}/report`,method:'POST',body}),invalidatesTags:['Driver','Run','Owner','Notification']})
})});
export const store = configureStore({ reducer: { [api.reducerPath]: api.reducer, auth: authSlice.reducer }, middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware) });
export async function cacheAuthenticatedSession(session: AuthResponse) {
  store.dispatch(setCsrfToken(session.csrfToken));
  await store.dispatch(authApi.util.upsertQueryData('me', undefined, session));
}
setupListeners(store.dispatch);
export const clearApiState = () => store.dispatch(api.util.resetApiState());
export type RootState = ReturnType<typeof store.getState>;









