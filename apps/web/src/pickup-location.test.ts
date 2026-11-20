import {describe,expect,it} from 'vitest';
import {classifyPickup} from './pickup-location';
import {ConfirmedBookingPointSchema} from '@saferide/shared';
const fix=(accuracy:number,timestamp=Date.now())=>({coords:{latitude:26.87150,longitude:80.89970,accuracy},timestamp} as GeolocationPosition);
describe('booking location confidence',()=>{
  it('separates precise, rural approximate and city-scale observations',()=>{
    expect(classifyPickup(fix(20))).toBe('usable');
    expect(classifyPickup(fix(450))).toBe('coarse');
    expect(classifyPickup(fix(200000))).toBe('very-coarse');
  });
  it('rejects stale, future and missing observation times',()=>{
    for(const timestamp of [Date.now()-31000,Date.now()+60000,NaN])expect(classifyPickup(fix(20,timestamp))).toBe('invalid');
  });
  it('requires provenance and confirmation and allows a manual pin without GPS accuracy',()=>{
    const pin={latitude:27,longitude:81};
    expect(ConfirmedBookingPointSchema.safeParse(pin).success).toBe(false);
    expect(ConfirmedBookingPointSchema.safeParse({...pin,source:'MAP',confirmed:true}).success).toBe(true);
    expect(ConfirmedBookingPointSchema.safeParse({...pin,source:'GPS',confirmed:true}).success).toBe(false);
  });
});
