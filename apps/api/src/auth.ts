import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import mongoose from 'mongoose';
import { compare, hash, hashSync } from 'bcryptjs';
import { LoginInputSchema, SignupInputSchema, TokenPasswordInputSchema, type Principal, type Role } from '@saferide/shared';
import { Business } from './models.js';
import { ActionToken, Session, User } from './auth-models.js';
import {SchoolChild,SchoolSubscription,GuardianStudentLink} from './customer-models.js';
import {StudentAccess} from './student-access-models.js';

const COOKIE = 'sr_session';
const SESSION_MS = 7 * 24 * 60 * 60_000;
const DUMMY_HASH = hashSync('unused-secret-never-valid', 12);
const attempts = new Map<string, { count: number; resetAt: number }>();
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');
export const hashPassword = (password: string) => hash(password, 12);
export type AuthContext = { user: InstanceType<typeof User>; session: InstanceType<typeof Session> };
declare module 'express-serve-static-core' { interface Request { auth?: AuthContext } }

function principal(user: InstanceType<typeof User>): Principal {
  return { id: String(user._id), name: user.name, mobile: user.mobile, email: user.email || null, role: user.role as Role, businessId: String(user.businessId), contactVerified: user.contactVerified, abilities: user.abilities.filter(value => value === 'DRIVER_DUTY') as Principal['abilities'] };
}
export function isAllowedWebOrigin(origin: string | undefined, webOrigin: string) {
  if (!origin) return false;
  if (origin === webOrigin) return true;
  try {
    const configured = new URL(webOrigin), requested = new URL(origin);
    const loopback = ['localhost', '127.0.0.1'];
    return configured.protocol === 'http:' && requested.protocol === 'http:'
      && loopback.includes(configured.hostname) && loopback.includes(requested.hostname)
      && configured.port === requested.port && requested.origin === origin;
  } catch { return false; }
}
export function requireOrigin(webOrigin: string) { return (req: Request, res: Response, next: NextFunction) => {
  if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
  if (!isAllowedWebOrigin(req.get('origin'), webOrigin)) return res.status(403).json({ error: { code: 'ORIGIN_DENIED', message: 'Request origin is not allowed.' } });
  return next();
}; }
export async function resolveSession(token:unknown) {
  if(typeof token!=='string'||token.length>200||mongoose.connection.readyState!==1)return null;
  const session = await Session.findOne({ tokenHash: digest(token), revokedAt: null, expiresAt: { $gt: new Date() } }).select('+csrfToken');
  if (!session) return null;
  const user = await User.findOne({ _id: session.userId, businessId: session.businessId, status: 'ACTIVE', authVersion: session.authVersion });
  if (!user) return null;
  if(user.role==='STUDENT'){
    const access=user.studentProfileId&&await StudentAccess.findOne({businessId:user.businessId,childId:user.studentProfileId,studentUserId:user._id,status:'ACTIVE'}).lean();
    const child=access&&await SchoolChild.findOne({_id:access.childId,businessId:user.businessId,status:'ACTIVE'}).select('customerId subscriptionId').lean();
    const approved=child&&(String(child.customerId)===String(access.guardianId)||!!await GuardianStudentLink.exists({businessId:user.businessId,childId:child._id,customerId:access.guardianId,status:'APPROVED'}));
    if(!approved||!await SchoolSubscription.exists({_id:child.subscriptionId,businessId:user.businessId,status:'ACTIVE'}))return null;
  }
  return {user,session};
}
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Account service is unavailable.' } });
  try {
    const auth=await resolveSession(req.cookies?.[COOKIE]);
    if(!auth)return res.status(401).json({error:{code:'UNAUTHENTICATED',message:'Please log in.'}});
    req.auth=auth;
    res.setHeader('Cache-Control', 'no-store');
    return next();
  } catch (error) { return next(error); }
}
export function requireRole(...roles: Role[]) { return (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Please log in.' } });
  if (!roles.includes(req.auth.user.role as Role)) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have access to this action.' } });
  return next();
}; }
export function requireAbility(ability: 'DRIVER_DUTY') { return (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Please log in.' } });
  if (req.auth.user.role !== 'DRIVER' && !req.auth.user.abilities.includes(ability)) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'This duty has not been granted.' } });
  return next();
}; }
export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  const expected = req.auth?.session.csrfToken;
  const received = req.get('x-csrf-token');
  if (!expected || !received || expected.length !== received.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(received))) return res.status(403).json({ error: { code: 'CSRF_DENIED', message: 'Refresh the page and try again.' } });
  return next();
}
function setSessionCookie(res: Response, token: string, secure: boolean) { res.cookie(COOKIE, token, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: SESSION_MS }); }
async function revokePriorSession(req: Request) { const prior = req.cookies?.[COOKIE]; if (typeof prior === 'string' && prior.length <= 200) await Session.updateOne({ tokenHash: digest(prior), revokedAt: null }, { $set: { revokedAt: new Date() } }); }
export async function issueSession(user: InstanceType<typeof User>, res: Response, secure: boolean) {
  const token = newToken(), csrfToken = newToken();
  await Session.create({ businessId: user.businessId, userId: user._id, tokenHash: digest(token), csrfToken, authVersion: user.authVersion, expiresAt: new Date(Date.now() + SESSION_MS) });
  setSessionCookie(res, token, secure);
  res.setHeader('Cache-Control', 'no-store');
  return { user: principal(user), csrfToken };
}
export function createAuthRouter(webOrigin: string, secure: boolean) {
  const router = Router();
  router.use(requireOrigin(webOrigin));
  router.post('/signup', async (req, res, next) => {
    const parsed = SignupInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Please check your account details.', fields: parsed.error.flatten().fieldErrors } });
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Account service is unavailable.' } });
    try {
      const business = await Business.findOne({ key: 'primary' }).select('_id').lean();
      if (!business) return res.status(503).json({ error: { code: 'NOT_CONFIGURED', message: 'Account registration is not available yet.' } });
      const now = new Date();
      const user = await User.create({ businessId: business._id, role: 'CUSTOMER', name: parsed.data.name, mobile: parsed.data.mobile, email: parsed.data.email?.toLowerCase() || null, passwordHash: await hashPassword(parsed.data.password), termsAcceptedAt: now, termsVersion: '2026-11-08', privacyAcceptedAt: now, privacyVersion: '2026-11-08', contactVerified: false });
      await revokePriorSession(req);
      return res.status(201).json(await issueSession(user, res, secure));
    } catch (error) {
      if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) return res.status(409).json({ error: { code: 'ACCOUNT_UNAVAILABLE', message: 'An account could not be created with those details.' } });
      return next(error);
    }
  });
  router.post('/login', async (req, res, next) => {
    const parsed = LoginInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Enter your login ID and password.' } });
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Account service is unavailable.' } });
    const identifier = parsed.data.identifier.toLowerCase();
    const key = digest(`${req.ip || 'unknown'}:${identifier}`), now = Date.now();
    const bucket = attempts.get(key);
    if (bucket && bucket.resetAt > now && bucket.count >= 5) return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again later.' } });
    try {
      const business = await Business.findOne({ key: 'primary' }).select('_id').lean();
      const user = business ? await User.findOne({ businessId: business._id, $or: [{ mobile: identifier }, { email: identifier }] }).select('+passwordHash') : null;
      const valid = await compare(parsed.data.password, user?.passwordHash || DUMMY_HASH);
      if (!user || !valid || user.status !== 'ACTIVE') {
        const count = bucket && bucket.resetAt > now ? bucket.count + 1 : 1;
        attempts.set(key, { count, resetAt: now + 15 * 60_000 });
        const updated = user ? await User.findByIdAndUpdate(user._id, { $inc: { failedLoginCount: 1 } }, { new: true }) : null;
        const locked = count >= 5 || (updated?.failedLoginCount ?? 0) >= 5;
        if (updated && locked) await User.updateOne({ _id: updated._id }, { $set: { lockedUntil: new Date(now + 15 * 60_000) } });
        return res.status(locked ? 429 : 401).json({ error: { code: locked ? 'RATE_LIMITED' : 'INVALID_CREDENTIALS', message: locked ? 'Too many attempts. Try again later.' : 'Invalid login ID or password.' } });
      }
      if(user.role==='STUDENT'){
        const access=user.studentProfileId&&await StudentAccess.findOne({businessId:user.businessId,studentUserId:user._id,childId:user.studentProfileId,status:'ACTIVE'}).lean();
        const child=access&&await SchoolChild.findOne({_id:access.childId,businessId:user.businessId,status:'ACTIVE'}).select('customerId subscriptionId').lean();
        const guardian=child&&(String(child.customerId)===String(access.guardianId)||!!await GuardianStudentLink.exists({businessId:user.businessId,childId:child._id,customerId:access.guardianId,status:'APPROVED'}));
        if(!guardian||!await SchoolSubscription.exists({_id:child.subscriptionId,businessId:user.businessId,status:'ACTIVE'}))return res.status(401).json({error:{code:'INVALID_CREDENTIALS',message:'Invalid login ID or password.'}});
      }
      if (user.lockedUntil && user.lockedUntil.getTime() > now) return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again later.' } });
      attempts.delete(key);
      await User.updateOne({ _id: user._id }, { $set: { failedLoginCount: 0, lockedUntil: null } });
      await revokePriorSession(req);
      return res.json(await issueSession(user, res, secure));
    } catch (error) { return next(error); }
  });
  router.get('/me', requireAuth, (req, res) => res.json({ user: principal(req.auth!.user), csrfToken: req.auth!.session.csrfToken }));
  router.post('/logout', requireAuth, requireCsrf, async (req, res, next) => { try { await Session.updateOne({ _id: req.auth!.session._id }, { $set: { revokedAt: new Date() } }); res.clearCookie(COOKIE, { httpOnly: true, secure, sameSite: 'lax', path: '/' }); return res.status(204).end(); } catch (error) { return next(error); } });
  router.post('/password-reset/request', (_req, res) => res.json({ message: 'Automated recovery is not configured. Please contact the operator for a one-time assisted reset.' }));
  router.post('/accept-invite', async (req, res, next) => {
    const parsed = TokenPasswordInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Check the invitation and password.' } });
    try {
      const candidate = await ActionToken.findOne({ tokenHash: digest(parsed.data.token), purpose: { $in: ['DRIVER_INVITE','CUSTOMER_INVITE','STUDENT_INVITE'] }, consumedAt: null, expiresAt: { $gt: new Date() } });
      if (['CUSTOMER_INVITE','STUDENT_INVITE'].includes(candidate?.purpose??'') && (parsed.data.acceptTerms !== true || parsed.data.acceptPrivacy !== true)) return res.status(400).json({ error: { code: 'CONSENT_REQUIRED', message: 'Accept the terms and privacy notice before activation.' } });
      if(candidate?.purpose==='STUDENT_INVITE'){
        const access=await StudentAccess.findOne({businessId:candidate.businessId,studentUserId:candidate.userId,status:'INVITED'});
        const child=access&&await SchoolChild.findOne({_id:access.childId,businessId:candidate.businessId,status:'ACTIVE'});
        if(!child||!await SchoolSubscription.exists({_id:child.subscriptionId,businessId:candidate.businessId,status:'ACTIVE'})||String(child.customerId)!==String(access.guardianId)&&!await GuardianStudentLink.exists({businessId:candidate.businessId,childId:child._id,customerId:access.guardianId,status:'APPROVED'}))return res.status(400).json({error:{code:'INVALID_TOKEN',message:'This invitation is no longer valid.'}});
      }
      const token = candidate && await ActionToken.findOneAndUpdate({ _id:candidate._id, consumedAt: null, expiresAt: { $gt: new Date() } }, { $set: { consumedAt: new Date() } });
      if (!token) return res.status(400).json({ error: { code: 'INVALID_TOKEN', message: 'This invitation is invalid or expired.' } });
      const consent=token.purpose!=='DRIVER_INVITE'?{termsAcceptedAt:new Date(),termsVersion:'2026-11-08',privacyAcceptedAt:new Date(),privacyVersion:'2026-11-08'}:{};
      const user = await User.findOneAndUpdate({ _id: token.userId, businessId: token.businessId, role: token.purpose === 'DRIVER_INVITE' ? 'DRIVER' : token.purpose==='STUDENT_INVITE'?'STUDENT':'CUSTOMER', status: 'INVITED' }, { $set: { passwordHash: await hashPassword(parsed.data.password), status: 'ACTIVE',...consent } }, { new: true });
      if (!user) return res.status(400).json({ error: { code: 'INVALID_TOKEN', message: 'This invitation is invalid or expired.' } });
      if(token.purpose==='STUDENT_INVITE')await StudentAccess.updateOne({businessId:token.businessId,studentUserId:user._id,status:'INVITED'},{$set:{status:'ACTIVE'}});
      return res.json({ message: 'Your account is ready. Log in to continue.' });
    } catch (error) { return next(error); }
  });
  router.post('/reset-password', async (req, res, next) => {
    const parsed = TokenPasswordInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Check the reset link and password.' } });
    try {
      const token = await ActionToken.findOneAndUpdate({ tokenHash: digest(parsed.data.token), purpose: 'PASSWORD_RESET', consumedAt: null, expiresAt: { $gt: new Date() } }, { $set: { consumedAt: new Date() } });
      if (!token) return res.status(400).json({ error: { code: 'INVALID_TOKEN', message: 'This reset link is invalid or expired.' } });
      const user = await User.findOneAndUpdate({ _id: token.userId, businessId: token.businessId, status: 'ACTIVE' }, { $set: { passwordHash: await hashPassword(parsed.data.password) }, $inc: { authVersion: 1 } }, { new: true });
      if (!user) return res.status(400).json({ error: { code: 'INVALID_TOKEN', message: 'This reset link is invalid or expired.' } });
      await Session.updateMany({ userId: user._id, businessId: user.businessId, revokedAt: null }, { $set: { revokedAt: new Date() } });
      return res.json({ message: 'Password updated. Log in with your new password.' });
    } catch (error) { return next(error); }
  });
  return router;
}
export async function createActionToken(user: InstanceType<typeof User>, purpose: 'DRIVER_INVITE'|'CUSTOMER_INVITE'|'STUDENT_INVITE'|'PASSWORD_RESET', createdBy: mongoose.Types.ObjectId) {
  const token = newToken();
  await ActionToken.create({ businessId: user.businessId, userId: user._id, purpose, tokenHash: digest(token), expiresAt: new Date(Date.now() + 24 * 60 * 60_000), createdBy });
  return token;
}
