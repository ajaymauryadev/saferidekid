import { describe, expect, it } from 'vitest';
import { calendarConflicts } from './owner-calendar-page';
const entry=(id:string,startAt:string,endAt:string,vehicleId:string,driverId:string)=>({id,type:'BOOKING' as const,title:id,startAt,endAt,vehicleId,driverId});
describe('calendar overlap warning',()=>{it('flags shared resources only when intervals overlap',()=>{const rows=[entry('a','2026-11-11T08:00:00.000Z','2026-11-11T09:00:00.000Z','v1','d1'),entry('b','2026-11-11T08:30:00.000Z','2026-11-11T09:30:00.000Z','v1','d2'),entry('c','2026-11-11T09:00:00.000Z','2026-11-11T10:00:00.000Z','v1','d3'),entry('d','2026-11-11T08:30:00.000Z','2026-11-11T09:30:00.000Z','v2','d4')];expect([...calendarConflicts(rows)]).toEqual(['a','b','c']);});});
