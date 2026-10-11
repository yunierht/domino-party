import type {Room} from './room.ts';
import {actor} from './room.ts';
import {parseVoiceRequest} from '../../../src/online/voiceProtocol.ts';
import type {VoiceMessage,VoiceReply,VoiceCall,VoiceCallCommand} from '../../../src/online/voiceProtocol.ts';
import {expireVoiceCall,updateVoiceCall} from './voiceCall.ts';
/** Shared signaling adapter. Audio remains peer-to-peer; domain supplies only membership/presence. */
export async function roomVoice(ctx:DurableObjectState,load:()=>Room|null,limit:(hash:string,now:number)=>void,hash:string,input:unknown,errorReply:(error:unknown)=>{status:number;body:{error:string}}):Promise<{status:number;body:VoiceReply|{error:string}}>{
    try{
      const request=parseVoiceRequest(input);
      return await ctx.storage.transaction(async()=>{
        const room=load();if(!room)throw Error('not_found');
        const seat=actor(room,hash),now=Date.now(),self=room.seats[seat],other=room.seats[seat==='human'?'computer':'human'];
        if(room.phase==='closed'||room.phase==='completed')throw Error('closed');
        if(room.phase!=='playing'||!self||!other||self.leaseUntil<=now||other.leaseUntil<=now)throw Error('not_connected');
        if(request.epoch!==room.epoch)throw Error('stale_epoch');
        limit('voice:'+hash,now);
        ctx.storage.sql.exec('DELETE FROM voice_peers WHERE updated<?',now-15000);
        ctx.storage.sql.exec('DELETE FROM voice_events WHERE created<?',now-60000);
        const stored=ctx.storage.sql.exec<{data:string}>('SELECT data FROM voice_call WHERE id=1').toArray()[0];
        let call=expireVoiceCall(stored?JSON.parse(stored.data) as VoiceCall:null,now);
        if(call?.status==='accepted'&&ctx.storage.sql.exec<{n:number}>('SELECT COUNT(*) AS n FROM voice_peers').one().n!==2)call={...call,status:'ended',reason:'disconnected'};
        const message=request.message;
        if(message?.type==='call'){
          ctx.storage.sql.exec('DELETE FROM voice_calls_seen WHERE created<?',now-300000);
          const seen=ctx.storage.sql.exec('SELECT id FROM voice_calls_seen WHERE id=?',message.callId).toArray().length>0;
          if(seen&&call?.id!==message.callId)throw Error('voice_call_ended');
          if(!seen){if(ctx.storage.sql.exec<{n:number}>('SELECT COUNT(*) AS n FROM voice_calls_seen').one().n>=128)throw Error('voice_capacity');ctx.storage.sql.exec('INSERT INTO voice_calls_seen(id,created) VALUES(?,?)',message.callId,now);}
        }
        if(message&&['call','accept','reject','cancel','leave'].includes(message.type)){
          const previous=call;call=updateVoiceCall(call,{seat,sessionId:request.sessionId},message as VoiceCallCommand,now);
          if(call.status==='accepted'&&previous?.status!=='accepted'){
            ctx.storage.sql.exec('DELETE FROM voice_events');ctx.storage.sql.exec('DELETE FROM voice_peers');
            for(const side of ['human','computer'] as const){const session=side===call.caller?call.callerSession:call.calleeSession!;
              ctx.storage.sql.exec('INSERT INTO voice_peers(actor,session,updated) VALUES(?,?,?)',room.seats[side]!.secretHash,session,now);}
          }
        }
        if(call)ctx.storage.sql.exec('INSERT INTO voice_call(id,data) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',JSON.stringify(call));
        if(call?.status!=='accepted'){
          if(message&&(message.type==='offer'||message.type==='answer'||message.type==='ice'))throw Error('voice_call_forbidden');
          ctx.storage.sql.exec('DELETE FROM voice_peers');ctx.storage.sql.exec('DELETE FROM voice_events');return{status:200,body:{peer:null,messages:[],call}};
        }
        const own=ctx.storage.sql.exec<{session:string}>('SELECT session FROM voice_peers WHERE actor=?',hash).toArray()[0];
        if(own?.session!==request.sessionId){if(message)throw Error('voice_replaced');return{status:200,body:{peer:null,messages:[],call:null}};}
        ctx.storage.sql.exec('UPDATE voice_peers SET updated=? WHERE actor=?',now,hash);
        const peer=ctx.storage.sql.exec<{session:string}>('SELECT session FROM voice_peers WHERE actor=?',other.secretHash).toArray()[0];
        if(message&&(message.type==='offer'||message.type==='answer'||message.type==='ice')){
          if(message.callId!==call.id)throw Error('voice_call_missing');
          if(!peer||peer.session!==message.target)throw Error('voice_peer_missing');
          if(ctx.storage.sql.exec<{n:number}>('SELECT COUNT(*) AS n FROM voice_events').one().n>=128)throw Error('voice_capacity');
          ctx.storage.sql.exec('INSERT INTO voice_events(recipient,session,created,payload) VALUES(?,?,?,?)',other.secretHash,peer.session,now,JSON.stringify(message));
        }
        ctx.storage.sql.exec('DELETE FROM voice_events WHERE recipient=? AND id<=?',hash,request.after);
        const messages=ctx.storage.sql.exec<{id:number;payload:string}>('SELECT id,payload FROM voice_events WHERE recipient=? AND session=? ORDER BY id LIMIT 32',hash,request.sessionId).toArray().map(row=>({id:row.id,message:JSON.parse(row.payload) as VoiceMessage}));
        return{status:200,body:{peer:peer?.session??null,messages,call}};
      });
    }catch(error){return errorReply(error);}
  }
