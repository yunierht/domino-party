import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import React from 'react';import {create,act} from 'react-test-renderer';import ts from 'typescript';import * as engine from './engine.ts';import * as session from './session.ts';import * as presentation from './presentation.ts';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
function load(file,deps){const m={exports:{}};const code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;new Function('require','module','exports',code)(id=>{if(!(id in deps))throw Error(id);return deps[id];},m,m.exports);return m.exports;}
const c=(rank,suit='s')=>({rank,suit});
test('player total bubble stays absent before cards and shows the actual dealt total',async()=>{
 const empty=await mount('en',null);try{assert.equal(empty.r.root.findAllByType('Text').some(t=>t.props.children==='—'),false);assert.equal(empty.r.root.findAllByProps({testID:'blackjack-player-total'}).length,0);}finally{await empty.close();}
 const dealt=await mount();try{assert.equal(dealt.r.root.findByProps({testID:'blackjack-player-total'}).props.children[0],engine.value(dealt.game.player).total);}finally{await dealt.close();}
});
async function mount(lang='en',initial=engine.newRound([c(10),c(9),c(8),c(7),c(10,'h')])){
 const navigation=[];const modes=[];let appListener;let backListener;let game=initial;let celebrated=null;const timers=new Map();let id=0;const oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout;
 globalThis.setTimeout=fn=>{timers.set(++id,fn);return id;};globalThis.clearTimeout=n=>timers.delete(n);
 const rn={View:'View',Text:'Text',Pressable:'Pressable',ScrollView:'ScrollView',Modal:'Modal',Image:'Image',AppState:{currentState:'active',addEventListener:(_event,fn)=>{appListener=fn;return {remove(){}};}},BackHandler:{addEventListener:(_event,fn)=>{backListener=fn;return {remove(){}};}},useWindowDimensions:()=>({width:320,height:568})};
 const deps={'../computer/ComputerGameContext':{useComputerGame:()=>({game:null})},'./SeatChipPile':{SeatChipPile:'SeatChipPile'},'./TiltSurface':{TiltSurface:'TiltSurface'},'react-native-svg':{__esModule:true,default:'Svg',Defs:'Defs',LinearGradient:'LinearGradient',Stop:'Stop',Rect:'Rect',Path:'Path',Text:'SvgText'},'@expo/vector-icons':{Feather:'Feather'},'../computer/DominoTableBackground':{DominoTableBackground:()=>null},'./dealers':{DEALERS:[{id:'mateo',name:'Mateo',image:1}],DealerChoices:'DealerChoices'},'../poker/CasinoChip':{ChipStack:()=>null},'./FloatingAction':{FloatingAction:({id,label,visible,enabled,onPress})=>visible?React.createElement('Pressable',{testID:id,disabled:!enabled,onPress},React.createElement('Text',null,label)):null},'./BetWell':{BetWell:'BetWell'},'./TurnPrompt':{TurnPrompt:'TurnPrompt'},'./BettingTray':{BettingTray:'BettingTray',DenominationChip:'DenominationChip'},'./ChipFlight':{ChipFlight:'ChipFlight'},'./presentation':presentation,'./useBlackjackCardSound':{useBlackjackCardSound(){}},'../state/PrefsContext':{usePrefs:()=>({ready:false,tileSound:false})},react:React,'react-native':rn,'./engine':engine,'./BlackjackContext':{useBlackjack:()=>({game,setGame:fn=>{game=typeof fn==='function'?fn(game):fn;},celebrated,setCelebrated:v=>{celebrated=v;},chips:1000,bet:20,wins:0,losses:0,pushes:0,startRound:()=>{game=engine.newRound();},refill(){},setDealerId(){},name:'Ana',dealerId:'mateo'})},'../computer/opponents':{OPPONENTS:[{id:'yuni',name:'Yuni',image:1}]},'../computer/TableSettings':{TableSettings:'TableSettings'},'../sound/useTableMusic':{useTableMusic(){}},'../computer/tableTheme':{TABLE:{}} ,'./ClassicPlayingCard':{ClassicPlayingCard:'PlayingCard'},'../i18n/I18nContext':{useI18n:()=>({lang})},'../nav/NavContext':{useNav:()=>({back(){navigation.push('back');},go(route){navigation.push(route);}})},'../poker/TableGameContext':{GameSwitchButton:({targetMode,onSelect})=>React.createElement('Pressable',{onPress:onSelect},React.createElement('Text',null,targetMode==='poker'?'Poker':'Domino')),useTableGame:()=>({enterMode(mode){modes.push(mode);}})}};
 const {BlackjackScreen}=load('./BlackjackScreen.tsx',deps);let r;await act(()=>{r=create(React.createElement(BlackjackScreen));});
 return {r,navigation,modes,async app(state){await act(()=>appListener(state));},async hardwareBack(){await act(()=>backListener());},get game(){return game;},async render(){await act(()=>r.update(React.createElement(BlackjackScreen)));},async tick(){const jobs=[...timers.values()];timers.clear();await act(()=>jobs.forEach(fn=>fn()));await this.render();},async close(){await act(()=>r.unmount());globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;}};
}
test('actual screen hides dealer hole and total; dealing locks Hit, then bust reveals and ends',async()=>{
 const h=await mount();try{
 const hit=()=>h.r.root.findByProps({testID:'blackjack-hit'});
 assert.equal(h.r.root.findAllByProps({testID:'blackjack-hit'}).length,0);assert.equal(h.r.root.findAllByType('PlayingCard').filter(x=>x.props.back).length,1);
 assert.equal(h.r.root.findByProps({testID:'dealer-total'}).props.children,'');
 await h.tick();assert.equal(hit().props.disabled,false);await act(()=>hit().props.onPress());await h.render();
 assert.equal(h.game.result,'dealer');assert.equal(h.r.root.findAllByType('PlayingCard').filter(x=>x.props.back).length,0);
 assert.equal(h.r.root.findAllByProps({testID:'blackjack-deal'}).length,0);
 }finally{await h.close();}
});
test('stand triggers automatic dealer and rules pause that timer; Spanish actions supported',async()=>{
 const h=await mount('es');try{await h.tick();await act(()=>h.r.root.findByProps({testID:'blackjack-stand'}).props.onPress());await h.render();assert.equal(h.game.phase,'dealer');
 await openRules(h);await h.render();await h.tick();assert.equal(h.game.phase,'dealer');
 await act(()=>h.r.root.findByProps({testID:'blackjack-close-rules'}).props.onPress());await h.render();await h.tick();await h.tick();assert.equal(h.game.result,'player');
 }finally{await h.close();}
});
test('provider preserves its round on screen unmount, separate from Poker state',async()=>{
 const m=load('./BlackjackContext.tsx',{react:React,'./session':session});let state;function Probe(){state=m.useBlackjack();return null;}let r;
 await act(()=>{r=create(React.createElement(m.BlackjackProvider,null,React.createElement(Probe)));});
 const g=engine.newRound();await act(()=>state.setGame(g));await act(()=>r.update(React.createElement(m.BlackjackProvider,null,null)));await act(()=>r.update(React.createElement(m.BlackjackProvider,null,React.createElement(Probe))));assert.equal(state.game,g);await act(()=>r.unmount());
});

test('natural immediately reveals dealer and Next round creates a fresh playable deal',async()=>{
 const h=await mount('en',engine.newRound([c(14),c(9),c(13),c(7)]));try{
 assert.equal(h.r.root.findAllByType('PlayingCard').filter(x=>x.props.back).length,0);
 await h.tick();const flight=h.r.root.findByType('ChipFlight');await act(()=>flight.props.onComplete());await h.render();assert.equal(h.r.root.findAllByProps({testID:'blackjack-deal'}).length,0);
 const tray=h.r.root.findByType('BettingTray');await act(()=>tray.props.onChip(20,{current:null}));await h.render();await act(()=>h.r.root.findByProps({testID:'blackjack-deal'}).props.onPress());await h.render();assert.equal(h.game.player.length,2);assert.equal(h.game.deck.length,48);
 }finally{await h.close();}
});

test('compact action controls stay outside the table scroll area',async()=>{
 const h=await mount();try{await h.tick();let node=h.r.root.findByProps({testID:'blackjack-hit'});while(node){assert.notEqual(node.type,'ScrollView');node=node.parent;}}finally{await h.close();}
});
test('inactive app pauses dealer; reactivation resumes exactly one legal step',async()=>{
 const h=await mount();try{await h.tick();await act(()=>h.r.root.findByProps({testID:'blackjack-stand'}).props.onPress());await h.render();await h.tick();await h.app('background');await h.tick();assert.equal(h.game.phase,'dealer');await h.app('active');await h.tick();assert.equal(h.game.result,'player');}finally{await h.close();}
});
test('switch cancellation preserves round; confirmation changes mode and routes without resetting',async()=>{
 const h=await mount();const button=label=>h.r.root.findAllByType('Pressable').find(x=>x.findAllByType('Text').some(t=>t.props.children===label));
 try{await h.tick();const before=h.game;await act(()=>button('Poker').props.onPress());await act(()=>button('Cancel').props.onPress());assert.equal(h.game,before);assert.deepEqual(h.navigation,[]);await act(()=>button('Poker').props.onPress());await act(()=>button('Switch').props.onPress());assert.deepEqual(h.modes,['poker']);assert.deepEqual(h.navigation,['computerGame']);assert.equal(h.game,before);}finally{await h.close();}
});
test('hardware Back dismisses rules before navigating and keeps round',async()=>{
 const h=await mount();try{const before=h.game;await openRules(h);await h.hardwareBack();assert.deepEqual(h.navigation,[]);await h.hardwareBack();assert.deepEqual(h.navigation,['back']);assert.equal(h.game,before);}finally{await h.close();}
});

test('multiple chip taps in the same event accumulate; clear removes wager flights without touching round',async()=>{
 const h=await mount('en',null);try{const tray=()=>h.r.root.findByType('BettingTray');await act(()=>{tray().props.onChip(20,{current:null});tray().props.onChip(50,{current:null});});await h.render();assert.equal(tray().props.stake,70);assert.equal(h.game,null);assert.deepEqual(h.r.root.findAllByType('DenominationChip').map(c=>c.props.amount),[20,50]);assert.equal(h.r.root.findByProps({testID:'blackjack-bet-total'}).props.children,'$70');assert.equal(h.r.root.findAllByType('ChipFlight').length,2);await act(()=>tray().props.onClear());assert.equal(tray().props.stake,0);assert.equal(h.r.root.findAllByType('ChipFlight').length,0);}finally{await h.close();}
});
test('winning counter progresses visually and completion does not alter settled game',async()=>{
 const g=engine.newRound([c(14),c(9),c(13),c(7)]);const h=await mount('en',g);try{await h.tick();const f=h.r.root.findByType('ChipFlight');assert.equal(f.props.flight.kind,'win');const counter=()=>h.r.root.findByProps({testID:'blackjack-player-pile'}).props.amount.toLocaleString();assert.equal(counter(),'950');await act(()=>f.props.onProgress(.5));assert.equal(counter(),'975');await act(()=>f.props.onComplete());await h.render();assert.equal(counter(),'1,000');assert.equal(h.r.root.findByType('BettingTray').props.stake,0);assert.equal(h.r.root.findByProps({testID:'blackjack-bet-spot'}).findByType('Text').props.children,'$0');assert.equal(h.game,g);assert.equal(h.r.root.findAllByType('ChipFlight').length,0);}finally{await h.close();}
});

test('only legal side actions appear while chip tray stays visible',async()=>{const h=await mount();try{const count=id=>h.r.root.findAllByProps({testID:id}).length;assert.equal(count('blackjack-hit'),0);assert.equal(count('blackjack-stand'),0);assert.equal(count('blackjack-deal'),0);await h.tick();assert.equal(count('blackjack-hit'),1);assert.equal(count('blackjack-stand'),1);await act(()=>h.r.root.findByProps({testID:'blackjack-hit'}).props.onPress());await h.render();assert.equal(count('blackjack-hit'),0);assert.equal(count('blackjack-stand'),0);assert.equal(h.r.root.findAllByType('BettingTray').length,1);}finally{await h.close();}});

test('flat table has no rotation gesture without changing round or stake',async()=>{const h=await mount();try{const before=h.game;assert.equal(h.r.root.findAllByProps({testID:'blackjack-tilt-up'}).length,0);const surface=h.r.root.findByProps({testID:'blackjack-table-surface'});assert.equal(surface.type,'View');assert.equal(surface.props.style.transform,undefined);assert.equal(surface.props.onMoveShouldSetResponder,undefined);assert.equal(h.game,before);assert.equal(h.r.root.findByType('BettingTray').props.stake,20);}finally{await h.close();}});

test('dealer win flies from BET to dealer pile and clears center only on collection',async()=>{const h=await mount();try{await h.tick();await act(()=>h.r.root.findByProps({testID:'blackjack-hit'}).props.onPress());await h.render();await h.tick();const flight=h.r.root.findByType('ChipFlight');assert.equal(flight.props.flight.kind,'win');assert.equal(flight.props.flight.amount,20);assert.equal(flight.props.flight.to.x,54);assert.equal(h.r.root.findByType('BettingTray').props.stake,20);await act(()=>flight.props.onComplete());await h.render();assert.equal(h.r.root.findByType('BettingTray').props.stake,0);assert.equal(h.r.root.findAllByType('ChipFlight').length,0);assert.equal(h.r.root.findAllByType('PlayingCard').length,0);assert.equal(h.r.root.findByProps({testID:'blackjack-dealer-pile'}).props.name,'Mateo');}finally{await h.close();}});
test('new wager hides old cards until Deal creates a fresh hand',async()=>{const h=await mount('en',engine.newRound([c(14),c(9),c(13),c(7)]));try{await h.tick();await act(()=>h.r.root.findByType('ChipFlight').props.onComplete());await h.render();assert.equal(h.r.root.findAllByType('PlayingCard').length,0);await act(()=>h.r.root.findByType('BettingTray').props.onChip(20,{current:null}));await h.render();assert.equal(h.r.root.findAllByType('PlayingCard').length,0);assert.equal(h.r.root.findAllByProps({testID:'blackjack-player-total'}).length,0);await act(()=>h.r.root.findByProps({testID:'blackjack-deal'}).props.onPress());await h.render();assert.equal(h.r.root.findAllByType('PlayingCard').length,4);}finally{await h.close();}});

async function openRules(h){
 await act(()=>h.r.root.findAllByType('Pressable').find(b=>['Settings','Ajustes'].includes(b.props.accessibilityLabel)).props.onPress());
 const settings=h.r.root.findByType('TableSettings');assert.equal(settings.props.visible,true);
 await act(()=>settings.props.onRules());assert.equal(h.r.root.findByType('TableSettings').props.visible,false);
}
