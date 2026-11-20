import { Router } from 'express';
import mongoose from 'mongoose';
import { DriverDutyInputSchema, InviteDriverInputSchema, OwnerResetInputSchema } from '@saferide/shared';
import { ActionToken, AuditEvent, Session, User } from './auth-models.js';
import { createActionToken, requireAuth, requireCsrf, requireOrigin, requireRole } from './auth.js';
import { findOwnerEnquiries, ScheduleBlock, SchoolRoute } from './models.js';

export function createOwnerAuthRouter(webOrigin: string) {
  const router = Router();
  router.use(requireOrigin(webOrigin), requireAuth, requireRole('OWNER'));
  router.get('/enquiries', async (req, res, next) => { try { const records = await findOwnerEnquiries(req.auth!.user.businessId as mongoose.Types.ObjectId).limit(50); return res.json(records.map(record => ({ id: String(record._id), name: record.name, phone: record.phone, service: record.service, message: record.message, status: record.status, createdAt: record.createdAt }))); } catch (error) { return next(error); } });
  router.get('/users', async (req, res, next) => { try { const users = await User.find({ businessId: req.auth!.user.businessId }).select('name mobile role status').sort({ createdAt: -1 }).limit(100).lean(); return res.json(users.map(user => ({ id: String(user._id), name: user.name, mobile: user.mobile, role: user.role, status: user.status }))); } catch (error) { return next(error); } });
  router.get('/users/:id', async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Account not found.' } });
    try { const user = await User.findOne({ _id: req.params.id, businessId: req.auth!.user.businessId }); if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Account not found.' } }); return res.json({ id: String(user._id), name: user.name, mobile: user.mobile, email: user.email, role: user.role, status: user.status, abilities: user.abilities }); } catch (error) { return next(error); }
  });
  router.post('/users/invite-driver', requireCsrf, async (req, res, next) => {
    const parsed = InviteDriverInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Check driver details.', fields: parsed.error.flatten().fieldErrors } });
    try {
      const owner = req.auth!.user;
      const driver = await User.create({ businessId: owner.businessId, role: 'DRIVER', name: parsed.data.name, mobile: parsed.data.mobile, email: parsed.data.email?.toLowerCase() || null, status: 'INVITED' });
      const token = await createActionToken(driver, 'DRIVER_INVITE', owner._id as mongoose.Types.ObjectId);
      await AuditEvent.create({ businessId: owner.businessId, actorId: owner._id, targetId: driver._id, action: 'DRIVER_INVITED' });
      res.setHeader('Cache-Control', 'no-store');
      return res.status(201).json({ id: String(driver._id), activationToken: token, expiresInHours: 24, note: 'Share this token through a trusted private channel. It is shown only once.' });
    } catch (error) { if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) return res.status(409).json({ error: { code: 'ACCOUNT_UNAVAILABLE', message: 'An account could not be created with those details.' } }); return next(error); }
  });
  router.post('/users/:id/reinvite', requireCsrf, async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Account not found.' } });
    try {
      const owner = req.auth!.user;
      const driver = await User.findOne({ _id: req.params.id, businessId: owner.businessId, role: 'DRIVER', status: 'INVITED' });
      if (!driver) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Invited driver not found.' } });
      await ActionToken.updateMany({ userId: driver._id, businessId: owner.businessId, purpose: 'DRIVER_INVITE', consumedAt: null }, { $set: { consumedAt: new Date() } });
      const token = await createActionToken(driver, 'DRIVER_INVITE', owner._id as mongoose.Types.ObjectId);
      await AuditEvent.create({ businessId: owner.businessId, actorId: owner._id, targetId: driver._id, action: 'DRIVER_REINVITED' });
      res.setHeader('Cache-Control', 'no-store');
      return res.json({ activationToken: token, expiresInHours: 24, note: 'Share this replacement token through a trusted private channel. It is shown only once.' });
    } catch (error) { return next(error); }
  });
  router.post('/users/:id/reset', requireCsrf, async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Account not found.' } });
    const parsed = OwnerResetInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Provide a reason for assisted reset.' } });
    try {
      const owner = req.auth!.user;
      const target = await User.findOne({ _id: req.params.id, businessId: owner.businessId, status: 'ACTIVE' });
      if (!target) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Account not found.' } });
      const token = await createActionToken(target, 'PASSWORD_RESET', owner._id as mongoose.Types.ObjectId);
      await Session.updateMany({ userId: target._id, businessId: owner.businessId, revokedAt: null }, { $set: { revokedAt: new Date() } });
      await AuditEvent.create({ businessId: owner.businessId, actorId: owner._id, targetId: target._id, action: 'PASSWORD_RESET_ISSUED', reason: parsed.data.reason });
      res.setHeader('Cache-Control', 'no-store');
      return res.json({ resetToken: token, expiresInHours: 24, note: 'Share this token through a trusted private channel. It is shown only once.' });
    } catch (error) { return next(error); }
  });
  router.post('/users/:id/deactivate', requireCsrf, async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Account not found.' } });
    const parsed = OwnerResetInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Provide a reason for deactivation.' } });
    try {
      const owner = req.auth!.user;
      if (String(owner._id) === req.params.id) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'The owner cannot deactivate their own account here.' } });
      const assigned = await User.findOne({ _id: req.params.id, businessId: owner.businessId, role: 'DRIVER' }).select('_id');
      if (assigned && (await SchoolRoute.exists({ businessId: owner.businessId, driverId: assigned._id, active: true, endDate: { $gte: new Date(Date.now()+5.5*3600_000).toISOString().slice(0,10) } }) || await ScheduleBlock.exists({ businessId: owner.businessId, driverId: assigned._id, type: 'BOOKING', active: true, endAt: { $gt: new Date() } }))) return res.status(409).json({ error: { code: 'ACTIVE_ASSIGNMENT', message: 'Resolve this driver’s future routes and bookings before suspension.' } });
      const target = await User.findOneAndUpdate({ _id: req.params.id, businessId: owner.businessId, status: { $ne: 'SUSPENDED' }, role: { $ne: 'OWNER' } }, { $set: { status: 'SUSPENDED' }, $inc: { authVersion: 1 } }, { new: true });
      if (!target) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Account not found.' } });
      await Session.updateMany({ userId: target._id, businessId: owner.businessId, revokedAt: null }, { $set: { revokedAt: new Date() } });
      await AuditEvent.create({ businessId: owner.businessId, actorId: owner._id, targetId: target._id, action: 'USER_DEACTIVATED', reason: parsed.data.reason });
      return res.json({ status: 'SUSPENDED' });
    } catch (error) { return next(error); }
  });
  router.post('/users/:id/driver-duty', requireCsrf, async (req, res, next) => {
    const parsed = DriverDutyInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Provide the duty choice and reason.' } });
    const owner = req.auth!.user;
    if (String(owner._id) !== req.params.id) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'This ability can only be changed for the current owner.' } });
    try {
      const abilities = parsed.data.enabled ? ['DRIVER_DUTY'] : [];
      await User.updateOne({ _id: owner._id, businessId: owner.businessId, role: 'OWNER' }, { $set: { abilities }, $inc: { authVersion: 1 } });
      await Session.updateMany({ userId: owner._id, businessId: owner.businessId, revokedAt: null }, { $set: { revokedAt: new Date() } });
      await AuditEvent.create({ businessId: owner.businessId, actorId: owner._id, targetId: owner._id, action: parsed.data.enabled ? 'DRIVER_DUTY_GRANTED' : 'DRIVER_DUTY_REVOKED', reason: parsed.data.reason });
      return res.json({ abilities, message: 'Ability updated. Log in again.' });
    } catch (error) { return next(error); }
  });
  return router;
}
