import type {Server as HttpServer} from 'node:http';
import mongoose from 'mongoose';
import {Server} from 'socket.io';
import {resolveSession,isAllowedWebOrigin} from './auth.js';
import {locationForUser} from './tracking.js';
import {onTrackingChange} from './tracking-events.js';

type Kind='run'|'booking';
type Selection={kind:Kind;tripId:string;childId?:string};
const room=(value:Selection)=>`trip:${value.kind}:${value.tripId}`;
async function signedIn(cookie:string|undefined){
  if(mongoose.connection.readyState!==1)return null;
  const token=cookie?.split(';').map(part=>part.trim()).find(part=>part.startsWith('sr_session='))?.slice('sr_session='.length);
  return (await resolveSession(token))?.user;
}
export function attachTrackingSocket(server:HttpServer,webOrigin:string){
  const io=new Server(server,{path:'/socket.io',cors:{origin:webOrigin,credentials:true},allowRequest:(req,done)=>{
    // Same-origin browser polling GETs can omit Origin. WebSocket upgrades still require it.
    const sameOriginPoll = req.headers.origin===undefined && req.method==='GET'
      && req.headers['sec-fetch-site']==='same-origin'
      && new URL(req.url??'/', 'http://localhost').searchParams.get('transport')==='polling';
    done(null,sameOriginPoll||isAllowedWebOrigin(req.headers.origin,webOrigin));
  }});
  io.use(async(socket,next)=>{try{if(!await signedIn(socket.handshake.headers.cookie))return next(new Error('Unauthenticated'));next();}catch{return next(new Error('Unauthenticated'));}});
  io.on('connection',socket=>{
    socket.on('tracking:join',async(raw:unknown,reply:unknown)=>{
      if(typeof reply!=='function')return;
      const value=raw as Partial<Selection>|null;
      try{
        if(!value||(value.kind!=='run'&&value.kind!=='booking')||typeof value.tripId!=='string'||!mongoose.isValidObjectId(value.tripId)||
          value.childId!==undefined&&(typeof value.childId!=='string'||!mongoose.isValidObjectId(value.childId)))return reply({ok:false});
        const selection:Selection={kind:value.kind,tripId:value.tripId,childId:value.childId};
        const user=await signedIn(socket.handshake.headers.cookie);
        const point=user&&await locationForUser(selection.kind,selection.tripId,user,selection.childId);
        if(!point||!socket.connected)return reply({ok:false});
        for(const joined of socket.rooms)if(joined.startsWith('trip:'))await socket.leave(joined);
        socket.data.selection=selection;
        await socket.join(room(selection));
        reply({ok:true,point});
      }catch{reply({ok:false});}
    });
  });
  const off=onTrackingChange((kind,tripId)=>{
    const target=room({kind,tripId});
    for(const id of io.sockets.adapter.rooms.get(target)??[]){
      const socket=io.sockets.sockets.get(id);
      const selection=socket?.data.selection as Selection|undefined;
      if(!socket||!selection||room(selection)!==target)continue;
      void (async()=>{
        const user=await signedIn(socket.handshake.headers.cookie);
        const point=user&&await locationForUser(kind,tripId,user,selection.childId);
        if(socket.data.selection!==selection||!socket.rooms.has(target))return;
        if(!point){await socket.leave(target);socket.emit('tracking:revoked');return;}
        socket.emit('tracking:update',point);
      })().catch(()=>socket.disconnect(true));
    }
  });
  return async()=>{off();await new Promise<void>(resolve=>io.close(()=>resolve()));};
}
