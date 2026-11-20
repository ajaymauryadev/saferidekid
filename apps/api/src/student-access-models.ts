import mongoose,{Schema} from 'mongoose';

const StudentAccessSchema=new Schema({
 businessId:{type:Schema.Types.ObjectId,required:true,index:true},
 childId:{type:Schema.Types.ObjectId,required:true},
 guardianId:{type:Schema.Types.ObjectId,required:true},
 studentUserId:{type:Schema.Types.ObjectId,default:null},
 mobile:{type:String,required:true},
 ageYears:{type:Number,required:true,min:13,max:18},
 consentAt:{type:Date,required:true},
 consentText:{type:String,required:true},
 status:{type:String,enum:['PENDING_OWNER','INVITED','ACTIVE','REVOKED'],required:true},
 reviewedBy:{type:Schema.Types.ObjectId,default:null},
 reviewedAt:{type:Date,default:null},
 revokedBy:{type:Schema.Types.ObjectId,default:null},
 revokedAt:{type:Date,default:null},
 reason:{type:String,default:null}
},{timestamps:true});
StudentAccessSchema.index({businessId:1,childId:1},{unique:true});
StudentAccessSchema.index({businessId:1,guardianId:1,status:1});
StudentAccessSchema.index({businessId:1,studentUserId:1},{unique:true,partialFilterExpression:{studentUserId:{$type:'objectId'}}});
export const StudentAccess=mongoose.model('StudentAccess',StudentAccessSchema);
