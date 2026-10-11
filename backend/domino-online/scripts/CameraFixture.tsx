// Browser-only geometry reproduction; never imported by the application entry.
import React,{useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {OnlineDominoTable} from '../../../src/online/OnlineDominoTable';
import type {OnlineView,Tile} from '../../../src/online/contract';
const deck:Tile[]=[];for(let a=0;a<=6;a++)for(let b=a;b<=6;b++)deck.push({id:`${a}-${b}`,a,b});
export function CameraFixture(){
 const [hand,setHand]=useState(7),[count,setCount]=useState(28),[round,setRound]=useState(1);
 const view:OnlineView={approved:true,closeReason:null,reconnectDeadline:[null,null],lobbyReady:[],protocol:1,code:'ABCDEF0123',epoch:'camera-fixture',revision:1,phase:'playing',seat:'human',names:{human:'Prueba',computer:'Rival'},presentation:{avatars:{human:'yuni',computer:'rafael'},openingId:deck[14].id},board:deck.slice(0,count),hand:deck.slice(0,hand),opponentCount:7,stock:[],round,turn:'human',mode:'points',target:100,scores:{human:0,computer:0},wins:{human:0,computer:0},last:null,result:null,winner:null,roundReady:[],legalMoves:[],canDraw:false,canPass:false};
 return <View style={{flex:1}}><Text style={{color:'#F5EACC',fontSize:11,textAlign:'center'}}>Reproducción de cámara · sin partida ni red</Text><View style={{flexDirection:'row',justifyContent:'center',gap:4}}>{[{label:'Mano 7',run:()=>setHand(7)},{label:'Mano 14',run:()=>setHand(14)},{label:'Cadena 14',run:()=>setCount(14)},{label:'Cadena 28',run:()=>setCount(28)},{label:'Otra ronda',run:()=>{setCount(1);setRound(r=>r+1);}}].map(item=><Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={item.run} style={{minHeight:44,padding:6,justifyContent:'center'}}><Text style={{fontSize:11,color:'#F5EACC'}}>{item.label}</Text></Pressable>)}</View><OnlineDominoTable view={view} enabled es onAction={()=>{}} onBack={()=>{}} error={null}/></View>;
}
