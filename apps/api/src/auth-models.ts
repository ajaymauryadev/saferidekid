import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  role: { type: String, enum: ['CUSTOMER','OWNER','DRIVER','STUDENT'], required: true },
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, default: null },
  passwordHash: { type: String, default: null, select: false },
  status: { type: String, enum: ['ACTIVE','INVITED','SUSPENDED','DELETED'], default: 'ACTIVE' },
  contactVerified: { type: Boolean, default: false },
  termsAcceptedAt: { type: Date, default: null },
  termsVersion: { type: String, default: null },
  privacyAcceptedAt: { type: Date, default: null },
  privacyVersion: { type: String, default: null },
  abilities: { type: [String], enum: ['DRIVER_DUTY'], default: [] },
  authVersion: { type: Number, default: 0 },
  failedLoginCount: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  studentProfileId: { type: Schema.Types.ObjectId, default: null }
  ,feeRemindersEnabled:{type:Boolean,default:true}
}, { timestamps: true });
UserSchema.index({ businessId: 1, mobile: 1 }, { unique: true });
UserSchema.index({ businessId: 1, email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
UserSchema.index({ businessId: 1, role: 1 }, { unique: true, partialFilterExpression: { role: 'OWNER' } });
UserSchema.index({ businessId: 1, role: 1, createdAt: -1 });
export const User = mongoose.model('User', UserSchema);

const SessionSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  csrfToken: { type: String, required: true, select: false },
  authVersion: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null }
}, { timestamps: true });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ userId: 1, revokedAt: 1 });
export const Session = mongoose.model('Session', SessionSchema);

const ActionTokenSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  purpose: { type: String, enum: ['DRIVER_INVITE','CUSTOMER_INVITE','STUDENT_INVITE','PASSWORD_RESET'], required: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  expiresAt: { type: Date, required: true },
  consumedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, required: true }
}, { timestamps: true });
ActionTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const ActionToken = mongoose.model('ActionToken', ActionTokenSchema);

const AuditEventSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, required: true, index: true },
  actorId: { type: Schema.Types.ObjectId, required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  action: { type: String, required: true },
  reason: { type: String, default: null },
  oldValue: { type: Schema.Types.Mixed, default: null },
  newValue: { type: Schema.Types.Mixed, default: null },
  reference: { type: String, default: null }
}, { timestamps: true });
AuditEventSchema.index({ businessId: 1, createdAt: -1 });
for (const operation of ['updateOne','updateMany','findOneAndUpdate','replaceOne','deleteOne','deleteMany','findOneAndDelete'] as const) AuditEventSchema.pre(operation, function () { throw new Error('Audit events are append-only.'); });
AuditEventSchema.post('save', async function (doc) { const { notificationFromAudit } = await import('./notifications.js'); await notificationFromAudit(doc); });
export const AuditEvent = mongoose.model('AuditEvent', AuditEventSchema);
