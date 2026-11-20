import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const BusinessSchema = new Schema({
  key: { type: String, required: true, unique: true, default: 'primary' },
  name: { type: String, required: true, trim: true },
  contactName: { type: String, trim: true, default: null },
  tagline: { type: String, trim: true, default: null },
  phone: { type: String, trim: true, default: null },
  email: { type: String, lowercase: true, trim: true, default: null },
  whatsapp: { type: String, trim: true, default: null },
  serviceArea: { type: String, trim: true, default: null },
  businessHours: { type: String, trim: true, default: null },
  privateBankAccount: { type: String, default: null }
  ,paymentUpiId:{type:String,default:null},paymentQrUrl:{type:String,default:null},paymentCashInstructions:{type:String,default:''},paymentBankInstructions:{type:String,default:''}
  ,bookingRates:{type:[Schema.Types.Mixed],default:[]},bookingRatesVersion:{type:Number,min:0,default:0},logoUrl:{type:String,default:null},serviceAreas:{type:[String],default:[]},homepageHeadline:{type:String,default:''},homepageDescription:{type:String,default:''},language:{type:String,enum:['en','hi'],default:'en'},schoolDueDay:{type:Number,min:1,max:28,default:10},schoolReminderDays:{type:[Number],default:[7,3,1,0]},baseFarePaise:{type:Number,min:0,default:0},perKmPaise:{type:Number,min:0,default:0},perHourPaise:{type:Number,min:0,default:0},perDayPaise:{type:Number,min:0,default:0},advancePercent:{type:Number,min:0,max:100,default:0},cancellationPolicy:{type:String,default:''},refundPolicy:{type:String,default:''},gpsFreshnessMinutes:{type:Number,min:1,max:120,default:2},gpsRetentionDays:{type:Number,min:1,max:365,default:1}
}, { timestamps: true });
export const Business = mongoose.model('Business', BusinessSchema);

const VehicleSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['PASSENGER_VAN', 'CAR', 'GOODS_PICKUP'], required: true },
  seats: { type: Number, min: 1, default: null },
  cargoPayloadKg:{type:Number,min:1,default:null},
  schoolReservedSeats: { type: Number, min: 0, default: 0 },
  imageUrl: { type: String, default: null },
  services: { type: [String], default: [] },
  publicVisible: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  registration: { type: String, default: null },
  legalSuitabilityConfirmed:{type:Boolean,default:false},
  documentExpiry:{type:String,default:null},
  driverId: { type: Schema.Types.ObjectId, default: null },
  routeIds: { type: [Schema.Types.ObjectId], default: [] },
  privateNotes: { type: String, default: null }
}, { timestamps: true });
VehicleSchema.index({ businessId: 1, publicVisible: 1, active: 1 });
VehicleSchema.index({ businessId: 1, registration: 1 }, { unique: true, partialFilterExpression: { registration: { $type: 'string' } } });
export const Vehicle = mongoose.model('Vehicle', VehicleSchema);
const VehiclePhotoSchema=new Schema({businessId:{type:Schema.Types.ObjectId,required:true,index:true},vehicleId:{type:Schema.Types.ObjectId,required:true,unique:true},contentType:{type:String,enum:['image/jpeg','image/png','image/webp'],required:true},data:{type:Buffer,required:true}},{timestamps:true});
VehiclePhotoSchema.index({businessId:1,vehicleId:1});
export const VehiclePhoto=mongoose.model('VehiclePhoto',VehiclePhotoSchema);

const DriverProfileSchema=new Schema({businessId:{type:Schema.Types.ObjectId,required:true,index:true},userId:{type:Schema.Types.ObjectId,required:true,unique:true},qualifications:{type:[String],enum:['PASSENGER','SCHOOL','GOODS'],default:[]},licenseExpiry:{type:String,default:null},notes:{type:String,default:''}},{timestamps:true});
DriverProfileSchema.index({businessId:1,userId:1});
export const DriverProfile=mongoose.model('DriverProfile',DriverProfileSchema);

const StopSchema=new Schema({name:{type:String,required:true},address:{type:String,required:true},order:{type:Number,required:true}},{_id:true});
const RouteSchema=new Schema({businessId:{type:Schema.Types.ObjectId,required:true,index:true},name:{type:String,required:true},school:{type:String,required:true},schoolAddress:{type:String,required:true},vehicleId:{type:Schema.Types.ObjectId,required:true},driverId:{type:Schema.Types.ObjectId,required:true},capacity:{type:Number,required:true,min:1},startDate:{type:String,required:true},endDate:{type:String,required:true},weekdays:{type:[Number],required:true},holidayDates:{type:[String],default:[]},exceptions:{type:[new Schema({date:String,active:Boolean},{_id:false})],default:[]},morning:{start:{type:String,required:true},end:{type:String,required:true}},return:{start:{type:String,required:true},end:{type:String,required:true}},stops:{type:[StopSchema],default:[]},active:{type:Boolean,default:true}},{timestamps:true});
RouteSchema.index({businessId:1,active:1,vehicleId:1,startDate:1,endDate:1});RouteSchema.index({businessId:1,active:1,driverId:1,startDate:1,endDate:1});
export const SchoolRoute=mongoose.model('SchoolRoute',RouteSchema);

const ScheduleBlockSchema=new Schema({businessId:{type:Schema.Types.ObjectId,required:true,index:true},type:{type:String,enum:['BOOKING','URGENT','MAINTENANCE','DRIVER_UNAVAILABLE'],required:true},relatedId:{type:Schema.Types.ObjectId,default:null},vehicleId:{type:Schema.Types.ObjectId,default:null},driverId:{type:Schema.Types.ObjectId,default:null},startAt:{type:Date,required:true},endAt:{type:Date,required:true},bufferMinutes:{type:Number,default:20},reason:{type:String,required:true},active:{type:Boolean,default:true}},{timestamps:true});
ScheduleBlockSchema.index({businessId:1,active:1,vehicleId:1,startAt:1,endAt:1});ScheduleBlockSchema.index({businessId:1,active:1,driverId:1,startAt:1,endAt:1});ScheduleBlockSchema.index({businessId:1,relatedId:1,type:1},{unique:true,partialFilterExpression:{relatedId:{$type:'objectId'}}});
export const ScheduleBlock=mongoose.model('ScheduleBlock',ScheduleBlockSchema);
const ScheduleLockSchema=new Schema({businessId:{type:Schema.Types.ObjectId,required:true,unique:true},version:{type:Number,default:0}});
export const ScheduleLock=mongoose.model('ScheduleLock',ScheduleLockSchema);

const UrgentRequestSchema=new Schema({businessId:{type:Schema.Types.ObjectId,required:true,index:true},pickup:{type:String,default:''},location:{latitude:Number,longitude:Number,accuracy:Number},phone:{type:String,required:true},destination:{type:String,default:''},notes:{type:String,default:''},status:{type:String,enum:['NEW','CONTACT_ATTEMPTED','ACCEPTED','DECLINED','ASSIGNED'],default:'NEW'},contactedAt:{type:Date,default:null},acceptedAt:{type:Date,default:null},declinedAt:{type:Date,default:null},assignedAt:{type:Date,default:null},vehicleId:{type:Schema.Types.ObjectId,default:null},driverId:{type:Schema.Types.ObjectId,default:null},startAt:{type:Date,default:null},endAt:{type:Date,default:null},reason:{type:String,default:null},expiresAt:{type:Date,required:true}},{timestamps:true});
UrgentRequestSchema.index({businessId:1,status:1,createdAt:-1});UrgentRequestSchema.index({expiresAt:1},{expireAfterSeconds:0});
export const UrgentRequest=mongoose.model('UrgentRequest',UrgentRequestSchema);

const EnquirySchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  service: { type: String, required: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['NEW', 'CONTACTED', 'CLOSED'], default: 'NEW' }
}, { timestamps: true });
EnquirySchema.index({ businessId: 1, phone: 1, createdAt: -1 });
EnquirySchema.index({ businessId: 1, status: 1, createdAt: -1 });
export const Enquiry = mongoose.model('Enquiry', EnquirySchema);
export type EnquiryRecord = InferSchemaType<typeof EnquirySchema>;

// Owner access will be exposed through authenticated, business-scoped routes in a later phase.
export function findOwnerEnquiries(businessId: mongoose.Types.ObjectId) {
  return Enquiry.find({ businessId }).sort({ createdAt: -1 }).lean();
}

