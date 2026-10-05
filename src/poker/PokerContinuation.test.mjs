import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import React from 'react';import {create,act} from 'react-test-renderer';import ts from 'typescript';
import {payoutAwards} from './payoutPresentation.ts';import * as engine from './engine.ts';import * as rebuy from './rebuy.ts';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const load=(file,deps)=>{const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText)(id=>{if(id in deps)return deps[id];throw Error(id);},m,m.exports);return m.exports;};
const rn={View:'View',Text:'Text',Pressable:'Pressable',Modal:'Modal',Image:'Image',ScrollView:'ScrollView',AppState:{currentState:'active',addEventListener:()=>({remove(){}})},BackHandler:{addEventListener:()=>({remove(){}})},useWindowDimensions:()=>({width:390,height:844,fontScale:1})};
const base={react:React,'react-native':rn,'../computer/TableSettings':{TableSettings:'TableSettings'},'../sound/useTableMusic':{useTableMusic(){}},'../computer/tableTheme':{TABLE:{}} };
const {PokerContinuation}=load('./PokerContinuation.tsx',{...base,'./rebuy':rebuy});
const finished=seat=>({...engine.newHand(undefined,()=>.3),street:'complete',result:{winner:seat==='human'?'computer':'human',reason:'fold',pot:2000},stacks:{human:seat==='human'?0:2000,computer:seat==='computer'?0:2000},bets:{human:0,computer:0},total:{human:0,computer:0}});
test('rebuy identifies the bankrupt human or rival in ES/EN and offers all three amounts',async()=>{
 for(const seat of ['human','computer'])for(const es of [true,false]){
  const names={human:'Juhni',computer:'Rigo'};let r;
  await act(()=>{r=create(React.createElement(PokerContinuation,{game:finished(seat),es,names,onContinue(){}}));});
  const texts=r.root.findByType('Modal').findAllByType('Text').map(t=>t.children.join(''));
  assert.deepEqual(texts,[es?'Comprar fichas':'Buy chips',es?`${names[seat]} se quedó sin fichas.`:`${names[seat]} ran out of chips.`,'500','750','1,000',es?'Cancelar':'Cancel',es?'Confirmar y continuar':'Confirm and continue',es?'Simulación; no es dinero real.':'Simulation only; no real money.']);
  for(const amount of [500,750,1000])assert.equal(r.root.findByProps({testID:`rebuy-${amount}`}).props.accessibilityLabel,`${amount} ${es?'fichas':'chips'}`);
  assert.ok(texts.includes('1,000'));await act(()=>r.unmount());
 }
});
test('actual PokerScreen: human zero opens Buy chips instead of Next hand/reset, credits only human',async()=>{
 let game=finished('human');let shown=`${game.hand}-${game.board.length}`;
 const {PokerScreen}=load('./PokerScreen.tsx',{...base,'../blackjack/BlackjackContext':{useBlackjack:()=>({name:''})},'../blackjack/SeatChipPile':{SeatChipPile:'SeatChipPile'},'../blackjack/TiltSurface':{TiltSurface:'TiltSurface'},'../blackjack/TableFinish':{WoodSurface:()=>null,TableStamp:()=>null},'./payoutPresentation':{payoutAwards},'../blackjack/ChipFlight':{ChipFlight:'ChipFlight'},'./ChipRaiseTray':{ChipRaiseTray:'ChipRaiseTray',SelectedChipPile:'SelectedChipPile',RaiseControls:'RaiseControls'},'../blackjack/FloatingAction':{FloatingAction:'FloatingAction'},'./engine':engine,'./PulseContinuation':{PulseContinuation:PokerContinuation},'./winningHighlights':{winningHighlights:()=>[]},'./tableFit':{communityCardWidth:()=>50},'./PokerHandHint':{PokerHandHint:()=>null},'./PokerCard':{PokerCard:()=>null},'./CardDealSound':{CardDealSound:()=>null},'./CasinoChip':{ChipStack:()=>null},'../computer/OpponentChoices':{OpponentChoices:()=>null},'../computer/DominoTableBackground':{DominoTableBackground:()=>null},'@expo/vector-icons':{Feather:()=>null},'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:24,bottom:34})},'../computer/ComputerGameContext':{useComputerGame:()=>({opponentId:'rival',setOpponentId(){}})},'../computer/opponents':{OPPONENTS:[{id:'rival',name:'Rival'}]},'../i18n/I18nContext':{useI18n:()=>({lang:'en'})},'../nav/NavContext':{useNav:()=>({back(){}})},'../state/PrefsContext':{usePrefs:()=>({ready:false})},'../sound/useTableMusic':{useTableMusic(){}},'./TableGameContext':{GameSwitchButton:()=>null,useTableGame:()=>({poker:game,pokerCollected:game,setPokerCollected(){},pokerStartingChips:1000,pokerName:'You',pokerShown:shown,setPoker:v=>{game=typeof v==='function'?v(game):v;},setPokerShown:v=>{shown=v;}})}});
 let r;await act(()=>{r=create(React.createElement(PokerScreen));});
 const surface=r.root.findByProps({testID:'poker-table-surface'});assert.equal(surface.type,'View');assert.equal(surface.props.style.transform,undefined);assert.equal(surface.props.onMoveShouldSetResponder,undefined);
 assert.ok((r.root.findAllByType('View')[0].props.style.marginBottom??0)>=0,'Poker must stay inside the parent bottom safe area');
 for(const host of r.root.findAll(n=>typeof n.type==='string'&&n.type!=='Text'))assert.equal(host.children.some(c=>typeof c==='string'),false,'raw text outside Text');
 const texts=r.root.findAllByType('Text').map(t=>t.children.join(''));
 assert.equal(texts.includes('Next hand'),false);assert.ok(texts.includes('Buy chips · Simulation'));
 assert.equal(r.root.findAllByType('Modal').filter(m=>m.props.visible).length,1);
 await act(()=>r.root.findByProps({testID:'rebuy-750'}).props.onPress());
 await act(()=>r.root.findByProps({testID:'rebuy-confirm'}).props.onPress());
 assert.equal(game.stacks.human+game.bets.human,750);assert.equal(game.stacks.computer+game.bets.computer,2000);
 await act(()=>r.unmount());
});
test('cancel/back preserve balances, rival rebuy is explicit, and dealing blocks modal',async()=>{
 const game=finished('computer');let received;let r;const props={game,es:true,names:{human:'You',computer:'Rival'},onContinue:n=>{received=n;}};
 await act(()=>{r=create(React.createElement(PokerContinuation,{...props,blocked:true}));});assert.equal(r.root.findByType('Modal').props.visible,false);
 await act(()=>r.update(React.createElement(PokerContinuation,props)));assert.equal(r.root.findByType('Modal').props.visible,true);
 await act(()=>r.root.findByProps({testID:'rebuy-cancel'}).props.onPress());assert.equal(received,undefined);assert.equal(r.root.findByType('Modal').props.visible,false);
 await act(()=>r.root.findByProps({testID:'poker-continue'}).props.onPress());
 await act(()=>r.root.findByType('Modal').props.onRequestClose());assert.equal(received,undefined);
 await act(()=>r.root.findByProps({testID:'poker-continue'}).props.onPress());
 await act(()=>r.root.findByProps({testID:'rebuy-confirm'}).props.onPress());assert.equal(received.stacks.computer+received.bets.computer,500);assert.equal(received.stacks.human+received.bets.human,2000);
 await act(()=>r.unmount());
});
