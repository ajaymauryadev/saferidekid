import mongoose,{Schema} from 'mongoose';

const ExpenseSchema=new Schema({businessId:{type:Schema.Types.ObjectId,required:true,index:true},category:{type:String,enum:['Fuel','Toll','Parking','Maintenance','Driver','Other'],required:true},date:{type:String,required:true},amountPaise:{type:Number,required:true,min:1},method:{type:String,enum:['CASH','UPI','BANK'],required:true},vehicleId:{type:Schema.Types.ObjectId,default:null},bookingId:{type:Schema.Types.ObjectId,default:null},tripId:{type:Schema.Types.ObjectId,default:null},note:{type:String,default:''},proofReference:{type:String,default:''},createdBy:{type:Schema.Types.ObjectId,required:true},updatedBy:{type:Schema.Types.ObjectId,default:null},voidedAt:{type:Date,default:null},voidedBy:{type:Schema.Types.ObjectId,default:null},voidReason:{type:String,default:null}},{timestamps:true});
ExpenseSchema.index({businessId:1,date:-1,_id:-1});
ExpenseSchema.index({businessId:1,vehicleId:1,date:-1});
export const Expense=mongoose.model('Expense',ExpenseSchema);

const CounterSchema=new Schema({businessId:{type:Schema.Types.ObjectId,required:true},kind:{type:String,required:true},next:{type:Number,required:true,default:0}});
CounterSchema.index({businessId:1,kind:1},{unique:true});
export const DocumentCounter=mongoose.model('DocumentCounter',CounterSchema);
const DocumentSchema=new Schema({businessId:{type:Schema.Types.ObjectId,required:true},kind:{type:String,required:true},number:{type:String,required:true},targetId:{type:Schema.Types.ObjectId,required:true},snapshotHash:{type:String,required:true},snapshot:{type:Schema.Types.Mixed,required:true},issuedBy:{type:Schema.Types.ObjectId,required:true}},{timestamps:true});
DocumentSchema.index({businessId:1,kind:1,number:1},{unique:true});
DocumentSchema.index({businessId:1,kind:1,targetId:1,snapshotHash:1},{unique:true});
export const FinanceDocument=mongoose.model('FinanceDocument',DocumentSchema);
