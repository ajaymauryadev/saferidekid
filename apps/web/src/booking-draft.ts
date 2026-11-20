import {ConfirmedBookingPointSchema, BookingServiceSchema} from '@saferide/shared';
import {z} from 'zod';

export const bookingDraftKey = 'saferide-public-booking-draft';
const text = z.string().max(250).catch('');
const confirmedPoint = ConfirmedBookingPointSchema.nullable().catch(null);
const draftSchema = z.object({
  pickup:text, destination:text, service:BookingServiceSchema.catch('local'),
  pickupPoint:confirmedPoint, destinationPoint:ConfirmedBookingPointSchema.nullable().catch(null),
  startAt:text, endAt:text, passengers:z.number().catch(1), cargoKg:z.number().catch(0),
  roundTrip:z.boolean().catch(false), plannedWaitingMinutes:z.number().catch(0),
  stops:z.string().catch(''), notes:z.string().catch(''), requestKey:z.uuid().optional().catch(undefined)
});
export function readBookingDraft(){
  try{return draftSchema.parse(JSON.parse(sessionStorage.getItem(bookingDraftKey) || '{}'));}
  catch{return draftSchema.parse({});}
}
