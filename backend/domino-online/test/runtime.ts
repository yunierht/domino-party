// Test-only subclass; never bundled in .local/worker.mjs or Wrangler's main.
import worker, { DominoRoom } from '../src/worker.ts';
import type { Room } from '../src/room.ts';
import {act,project,deadline} from '../src/room.ts';
export default worker;
export class TestDominoRoom extends DominoRoom {
  async finishRoundForTest():Promise<void> {
    await this.ctx.storage.transaction(async()=>{
      let room:Room=JSON.parse(this.ctx.storage.sql.exec<{data:string}>('SELECT data FROM room WHERE id=1').one().data);
      const now=Date.now();
      for(let i=0;i<80&&!room.game?.result;i++){
        const player=room.game!.turn,hash=room.seats[player]!.secretHash,view=project(room,hash,now),move=view.legalMoves[0];
        room=act(room,hash,move?{type:'play',tileId:move.tileId,end:move.ends[0]}:
          view.canDraw?{type:'draw',slot:view.stock[0]}:{type:'pass'},now);
      }
      if(!room.game?.result)throw Error('round_not_finished');
      this.ctx.storage.sql.exec('UPDATE room SET data=? WHERE id=1',JSON.stringify(room));
      const at=deadline(room);if(at!==null)await this.ctx.storage.setAlarm(at);
    });
  }
  roundForTest():number|undefined {
    return (JSON.parse(this.ctx.storage.sql.exec<{data:string}>('SELECT data FROM room WHERE id=1').one().data) as Room).game?.round;
  }
  async prepareBoneyardForTest():Promise<void> {
    await this.ctx.storage.transaction(async()=>{
      const room:Room=JSON.parse(this.ctx.storage.sql.exec<{data:string}>('SELECT data FROM room WHERE id=1').one().data);
      if(!room.game)throw Error('not_started');
      const now=Date.now();
      // Deterministic drawing boundary; this test fixture never ships in Worker main.
      room.game={...room.game,board:[{id:'2-2',a:2,b:2}],openingId:'2-2',turn:'human',
        hands:{human:[{id:'0-0',a:0,b:0}],computer:[{id:'6-6',a:6,b:6}]},
        stock:[{id:'1-3',a:1,b:3},{id:'2-3',a:2,b:3}],passes:0,result:null,last:null};
      room.slotIds=['1-3','2-3'];room.revision++;
      room.turnClock={deadline:now+5000,remainingMs:30000,manualPaused:false};
      for(const seat of Object.values(room.seats))if(seat)seat.leaseUntil=now+30000;
      this.ctx.storage.sql.exec('UPDATE room SET data=? WHERE id=1',JSON.stringify(room));
      await this.ctx.storage.setAlarm(now+5000);
    });
  }
  async expireTurnForTest(schedule=true): Promise<void> {
    await this.ctx.storage.transaction(async()=>{
      const room:Room=JSON.parse(this.ctx.storage.sql.exec<{data:string}>('SELECT data FROM room WHERE id=1').one().data);
      const now=Date.now();
      for(const seat of Object.values(room.seats))if(seat)seat.leaseUntil=now+30000;
      room.turnClock={deadline:now-1,remainingMs:30000,manualPaused:false};
      this.ctx.storage.sql.exec('UPDATE room SET data=? WHERE id=1',JSON.stringify(room));
      if(schedule)await this.ctx.storage.setAlarm(now+25);
    });
  }
  turnForTest():string|undefined {
    return (JSON.parse(this.ctx.storage.sql.exec<{data:string}>('SELECT data FROM room WHERE id=1').one().data) as Room).game?.turn;
  }
  async expireForTest(): Promise<void> {
    await this.ctx.storage.transaction(async () => {
      const row = this.ctx.storage.sql.exec<{data:string}>('SELECT data FROM room WHERE id=1').one();
      const room: Room = JSON.parse(row.data);
      for (const seat of Object.values(room.seats)) if (seat) seat.leaseUntil = Date.now() - 120_001;
      this.ctx.storage.sql.exec('UPDATE room SET data=? WHERE id=1',JSON.stringify(room));
      await this.ctx.storage.setAlarm(Date.now() + 25);
    });
  }
  phaseForTest(): string {
    return (JSON.parse(this.ctx.storage.sql.exec<{data:string}>('SELECT data FROM room WHERE id=1').one().data) as Room).phase;
  }
}

export {ManualCodes} from '../src/manualCodes.ts';
import {PokerRoom} from '../src/pokerWorker.ts';
export class TestPokerRoom extends PokerRoom {
 async expireTurnForTest(){const room=this.load()!;room.clock!.deadline=Date.now()-1;for(const s of Object.values(room.seats))if(s)s.leaseUntil=Date.now()+30000;this.ctx.storage.sql.exec('UPDATE room SET data=? WHERE id=1',JSON.stringify(room));await this.ctx.storage.setAlarm(Date.now()+25);}
 async expirePresenceForTest(){const room=this.load()!;for(const s of Object.values(room.seats))if(s){s.absentSince=Date.now()-120001;s.closeAt=Date.now()-1;}this.ctx.storage.sql.exec('UPDATE room SET data=? WHERE id=1',JSON.stringify(room));await this.ctx.storage.setAlarm(Date.now()+25);}
}
import {ManualCodes} from '../src/manualCodes.ts';
export class TestManualCodes extends ManualCodes {
 protected nextCode(){return '000007';}
 expireForTest(code:string){this.ctx.storage.sql.exec('UPDATE aliases SET expires=0 WHERE code=?',code);}
 exhaustForTest(key:string,count:number){this.ctx.storage.sql.exec('INSERT INTO attempts(actor,window,count) VALUES(?,?,?) ON CONFLICT(actor) DO UPDATE SET window=excluded.window,count=excluded.count',key,Math.floor(Date.now()/60000),count);}
 attemptRowsForTest(){return this.ctx.storage.sql.exec<{n:number}>('SELECT COUNT(*) AS n FROM attempts').one().n;}
}

import {BlackjackRoom} from '../src/blackjackWorker.ts';
export class TestBlackjackRoom extends BlackjackRoom {
 async expireSeatForTest(seat:'human'|'computer'){await this.ctx.storage.transaction(async()=>{const room=this.load()!;if(!room.clocks[seat])return;room.clocks[seat]!.deadline=Date.now()-1;for(const s of Object.values(room.seats))if(s)s.leaseUntil=Date.now()+30000;this.ctx.storage.sql.exec('UPDATE room SET data=? WHERE id=1',JSON.stringify(room));await this.ctx.storage.setAlarm(Date.now()+25);});}
 async expirePresenceForTest(){await this.ctx.storage.transaction(async()=>{const room=this.load()!;for(const s of Object.values(room.seats))if(s){s.absentSince=Date.now()-120001;s.closeAt=Date.now()-1;}this.ctx.storage.sql.exec('UPDATE room SET data=? WHERE id=1',JSON.stringify(room));await this.ctx.storage.setAlarm(Date.now()+25);});}
}
