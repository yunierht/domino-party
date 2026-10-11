import {GoldPressable} from '../components/GoldPressable';
import React,{useEffect,useMemo,useState} from 'react';
import {AppState,BackHandler,Platform,Pressable,ScrollView,Share,Text,TextInput,View} from 'react-native';
import {useI18n} from '../i18n/I18nContext';
import {useNav} from '../nav/NavContext';
import {Header} from '../components/Header';
import {DominoTile} from '../computer/DominoTile';
import {OnlineClient} from './client';
import type {ClientState} from './client';
import {onlineEndpoint,invitation} from './endpoint';
import {httpTransport} from './transport';
import {vault,credential} from './credentialStorage';

function ActionButton({label,onPress,disabled=false,id,secondary=false}:{label:string;onPress:()=>void;disabled?:boolean;id:string;secondary?:boolean}){
  return <GoldPressable finish gold={!secondary} testID={id} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}}
    disabled={disabled} onPress={disabled?undefined:onPress} style={{minHeight:46,paddingHorizontal:16,paddingVertical:12,borderRadius:12,backgroundColor:secondary?'#173C32':'#DAB766',borderWidth:1,borderColor:'#B69A56',opacity:disabled?.4:1,alignItems:'center',justifyContent:'center'}}>
    <Text style={{color:secondary?'#F5EACC':'#10251E',fontWeight:'800',fontSize:15}}>{label}</Text>
  </GoldPressable>;
}
export function OnlineDominoScreen(){
  const {lang}=useI18n(),es=lang==='es',{goHome}=useNav();
  const tr=(a:string,b:string)=>es?a:b;
  let endpoint:string|null;try{endpoint=onlineEndpoint(process.env.EXPO_PUBLIC_DOMINO_ONLINE_URL);}catch{endpoint=null;}
  const client=useMemo(()=>endpoint?new OnlineClient(vault,httpTransport(endpoint),credential,endpoint):null,[endpoint]);
  const [state,setState]=useState<ClientState>({view:null,busy:false,status:'idle',error:null,canResume:false});
  const [name,setName]=useState(''),[code,setCode]=useState(''),[target,setTarget]=useState('100'),[mode,setMode]=useState<'points'|'wins'>('points');
  const [selected,setSelected]=useState<string|null>(null),[notice,setNotice]=useState<string|null>(null),[clock,setClock]=useState(Date.now());
  useEffect(()=>{
    if(!client)return;
    let active=true,alive=true;const unsubscribe=client.subscribe(setState);
    void client.load().then(()=>{if(alive&&client.state.canResume)return client.resume();});
    const timer=setInterval(()=>{setClock(Date.now());if(active){if(client.state.status==='disconnected')void client.resume();else void client.refresh();}},2000);
    const sub=AppState.addEventListener('change',value=>{active=value==='active';if(active)void client.resume();else void client.disconnect();});
    const back=BackHandler.addEventListener('hardwareBackPress',()=>{goHome();return true;});
    return()=>{alive=false;unsubscribe();clearInterval(timer);sub.remove();back.remove();void client.disconnect();};
  },[client]);
  const v=state.view;
  useEffect(()=>{if(selected&&!v?.legalMoves.some(m=>m.tileId===selected))setSelected(null);},[v?.revision]);
  const canAct=!state.busy&&state.status==='connected'&&v?.phase==='playing';
  const legal=v?.legalMoves.find(m=>m.tileId===selected)?.ends??[];
  const inputStyle={backgroundColor:'#14382D',borderColor:'#6D7557',borderWidth:1,borderRadius:10,color:'#FFF4D7',padding:12,fontSize:17,minHeight:48} as const;
  const textStyle={color:'#F5EACC',fontSize:16} as const;
  const section={padding:16,gap:12,borderRadius:16,borderColor:'#5F6B4A',borderWidth:1,backgroundColor:'#0E2E25'} as const;
  const validName=!!name.trim(),validTarget=Number.isInteger(Number(target))&&Number(target)>0&&Number(target)<=10000;
  async function share(){if(!v)return;const message=invitation(v.code,es);try{
    if(Platform.OS==='web'){
      if(navigator.share)await navigator.share({text:message});
      else if(navigator.clipboard){await navigator.clipboard.writeText(message);setNotice(tr('Invitación copiada.','Invitation copied.'));}
      else setNotice(message);
    }else await Share.share({message});
  }catch{setNotice(tr('Puedes copiar el código de la sala.','You can copy the room code.'));}}
  const errorText=state.error==='room_full'?tr('La sala está llena.','The room is full.'):
    state.error==='invalid_code'?tr('Introduce el código de 10 caracteres.','Enter the 10-character room code.'):
    state.error==='storage_error'?tr('No se pudo guardar la sesión. Vuelve a intentarlo.','Session could not be saved. Please retry.'):
    ['stale_revision','illegal_action'].includes(state.error??'')?tr('La mesa cambió. Revisa la jugada.','The table changed. Check your move.'):
    tr('No hay conexión con la sala. Intentando recuperar…','Room connection lost. Trying to recover…');
  const deadlines=v?.reconnectDeadline.filter((x):x is number=>x!==null)??[];
  const seconds=deadlines.length?Math.max(0,Math.ceil((Math.min(...deadlines)-clock)/1000)):null;
  return <View testID="online-domino-screen" style={{flex:1,backgroundColor:'#081F18',paddingHorizontal:16}}>
    <Header title={tr('Dominó online','Online Domino')} reserveThemeSpace={false} onBackPress={goHome}/>
    <ScrollView contentContainerStyle={{gap:16,paddingBottom:28}} keyboardShouldPersistTaps="handled">
      {!endpoint&&<Text accessibilityRole="alert" style={textStyle}>{tr('La conexión local de Online no está configurada correctamente.','The local Online connection is not configured correctly.')}</Text>}
      {Platform.OS==='web'&&<Text style={{color:'#BBC9B6',fontSize:12}}>{tr('En navegador, tu sesión se conserva en esta pestaña.','In a browser, your session stays in this tab.')}</Text>}
      {state.error&&<View style={section}><Text accessibilityRole="alert" style={textStyle}>{errorText}</Text>
        {state.canResume&&<ActionButton id="online-retry" label={tr('Reconectar','Reconnect')} onPress={()=>{void client?.resume();}} disabled={state.busy}/>}</View>}
      {notice&&<Text selectable style={textStyle}>{notice}</Text>}
      {!v?<View style={section}>
        <Text style={{...textStyle,fontSize:22,fontWeight:'800'}}>{tr('Juega con un amigo','Play with a friend')}</Text>
        <Text style={{color:'#CAD5BF'}}>{tr('Dos jugadores. Entra con tu nombre, sin registro.','Two players. Enter your name, no sign-up required.')}</Text>
        <TextInput testID="online-name" accessibilityLabel={tr('Tu nombre','Your name')} placeholder={tr('Tu nombre','Your name')} placeholderTextColor="#A5B59F" maxLength={40} value={name} onChangeText={setName} style={inputStyle}/>
        <View style={{flexDirection:'row',gap:8}}>{(['points','wins'] as const).map(m=><View key={m} style={{flex:1}}><ActionButton id={`online-mode-${m}`} secondary={mode!==m} label={m==='points'?tr('Puntos','Points'):tr('Victorias','Wins')} onPress={()=>{setMode(m);setTarget(m==='points'?'100':'3');}}/></View>)}</View>
        <TextInput testID="online-target" accessibilityLabel={tr('Meta de partida','Match target')} value={target} onChangeText={setTarget} keyboardType="number-pad" maxLength={5} style={inputStyle}/>
        <ActionButton id="online-create" label={tr('Crear sala privada','Create private room')} disabled={!client||state.busy||!validName||!validTarget} onPress={()=>{void client?.create(name.trim(),Number(target),mode);}}/>
        <TextInput testID="online-code" accessibilityLabel={tr('Código de sala','Room code')} placeholder={tr('Código de sala','Room code')} placeholderTextColor="#A5B59F" autoCapitalize="characters" maxLength={10} value={code} onChangeText={v=>setCode(v.toUpperCase().replace(/[^A-F0-9]/g,''))} style={inputStyle}/>
        <ActionButton id="online-join" secondary label={tr('Entrar por código','Join by code')} disabled={!client||state.busy||!validName||code.length!==10} onPress={()=>{void client?.join(name.trim(),code);}}/>
        {state.canResume&&<ActionButton id="online-resume" secondary label={tr('Volver a mi sala','Return to my room')} onPress={()=>{void client?.resume();}} disabled={state.busy}/>}
      </View>:<>
        <View style={section}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10}}>
          <Text selectable testID="online-room-code" style={{...textStyle,fontSize:22,fontWeight:'900',letterSpacing:2}}>{v.code}</Text>
          <ActionButton id="online-share" secondary label={tr('Invitar','Invite')} onPress={()=>{void share();}}/>
        </View><Text style={{color:'#B5C9B1'}}>{`${v.names.human} · ${v.names.computer??tr('Esperando amigo…','Waiting for friend…')}`}</Text></View>
        {v.phase==='waiting'?<View style={section}>
          <Text style={textStyle}>{!v.names.computer?tr('Comparte el código con tu amigo.','Share the code with your friend.'):!v.approved?tr('El anfitrión debe aceptar al invitado.','The host needs to accept the guest.'):tr('Ambos deben estar listos para repartir.','Both players must be ready to deal.')}</Text>
          {v.seat==='human'&&v.names.computer&&!v.approved&&<ActionButton id="online-approve" label={tr('Aceptar a','Accept')+' '+v.names.computer} onPress={()=>{void client?.command({type:'approve'});}} disabled={state.busy}/>}
          {v.approved&&<ActionButton id="online-ready" label={v.lobbyReady.includes(v.seat)?tr('Listo · esperando amigo','Ready · waiting for friend'):tr('Estoy listo','I am ready')} disabled={state.busy||v.lobbyReady.includes(v.seat)} onPress={()=>{void client?.command({type:'ready'});}}/>}
        </View>:<>
          {v.phase==='paused'&&<Text accessibilityRole="alert" testID="online-paused" style={{...textStyle,textAlign:'center'}}>{tr('Partida pausada · esperando reconexión','Game paused · waiting for reconnection')}{seconds!==null?` · ${seconds}s`:''}</Text>}
          {v.phase==='closed'&&<Text testID="online-closed" style={{...textStyle,textAlign:'center'}}>{tr('Sala cerrada. Sin ganador por desconexión.','Room closed. No winner due to disconnection.')}</Text>}
          <View style={section}>
            <Text style={{...textStyle,textAlign:'center'}}>{`${v.names.human}: ${(v.mode==='wins'?v.wins:v.scores)?.human??0}  ·  ${v.names.computer}: ${(v.mode==='wins'?v.wins:v.scores)?.computer??0}  / ${v.target}`}</Text>
            <Text style={{color:'#DCC58B',textAlign:'center'}}>{tr('Ronda','Round')+' '+v.round+' · '+tr('Tu rival tiene','Your opponent has')+' '+v.opponentCount+' '+tr('fichas','tiles')}</Text>
            <ScrollView horizontal testID="online-board" contentContainerStyle={{minHeight:82,alignItems:'center',gap:3,padding:8}}>
              {v.board.length?v.board.map(t=><DominoTile key={t.id} a={t.a} b={t.b} size={25}/>):<Text style={{color:'#AEBD9E'}}>{tr('Mesa lista para la salida','Table ready for the opening move')}</Text>}
            </ScrollView>
            <Text style={{...textStyle,textAlign:'center'}}>{v.result? v.result.winner==='tie'?tr('Ronda empatada','Round tied'):`${v.names[v.result.winner]} · ${tr('gana','wins')} +${v.result.points}`:v.phase==='playing'?(v.turn===v.seat?tr('Tu turno','Your turn'):tr('Turno de','Turn of')+' '+v.names[v.turn??'human']):''}</Text>
            <View testID="online-hand" style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:10}}>{v.hand.map(t=><Pressable key={t.id} accessibilityRole="button" accessibilityLabel={`${tr('Ficha','Tile')} ${t.a}-${t.b}`} accessibilityState={{disabled:!canAct||!v.legalMoves.some(m=>m.tileId===t.id),selected:selected===t.id}}
              disabled={!canAct||!v.legalMoves.some(m=>m.tileId===t.id)} onPress={()=>setSelected(t.id)} style={{padding:3,opacity:v.legalMoves.some(m=>m.tileId===t.id)?.95:.55}}><DominoTile a={t.a} b={t.b} vertical size={28} selected={selected===t.id}/></Pressable>)}</View>
            {v.canDraw&&<><Text style={textStyle}>{tr('Escoge una ficha del pozo','Choose a boneyard tile')}</Text><View testID="online-stock" style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{v.stock.map((slot,i)=><ActionButton key={slot} id={`online-draw-${i}`} secondary label={String(i+1)} disabled={!canAct} onPress={()=>{void client?.command({type:'draw',slot});}}/>)}</View></>}
            {v.canPass&&<ActionButton id="online-pass" label={tr('Pasar','Pass')} disabled={!canAct} onPress={()=>{void client?.command({type:'pass'});}}/>}
            {v.result&&!v.winner&&v.phase==='playing'&&<ActionButton id="online-next" label={v.roundReady.includes(v.seat)?tr('Listo para la siguiente','Ready for the next round'):tr('Siguiente ronda','Next round')} disabled={state.busy||v.roundReady.includes(v.seat)} onPress={()=>{void client?.command({type:'nextRound'});}}/>}
            {v.phase==='completed'&&<Text style={{...textStyle,textAlign:'center'}}>{v.names[v.winner??'human']+' · '+tr('ganó la partida','won the match')}</Text>}
          </View>
        </>}
        <ActionButton id="online-forget" secondary label={tr('Cerrar mi sesión online','Close my online session')} disabled={state.busy} onPress={()=>{void client?.forget();}}/>
      </>}
    </ScrollView>
    {v&&v.phase==='playing'&&!v.result&&<View testID="online-actions" style={{paddingVertical:10,gap:8,borderTopWidth:1,borderColor:'#6D7557',backgroundColor:'#081F18'}}>
      <Text accessibilityLiveRegion="polite" style={{...textStyle,textAlign:'center',fontSize:14}}>{v.turn!==v.seat?tr('Espera el turno de tu amigo.','Wait for your friend’s turn.'):
        selected?`${tr('Ficha seleccionada','Selected tile')}: ${selected}`:tr('Selecciona una ficha y elige dónde colocarla.','Select a tile and choose where to place it.')}</Text>
      {selected&&v.turn===v.seat&&<View style={{flexDirection:'row',gap:8}}>{(v.board.length?(['left','right'] as const):(['right'] as const)).map(end=><View key={end} style={{flex:1}}>
        <ActionButton id={`online-play-${end}`} label={!v.board.length?tr('Colocar en la mesa','Place on the table'):end==='left'?tr('Colocar a la izquierda','Place on the left'):tr('Colocar a la derecha','Place on the right')}
          disabled={!canAct||!legal.includes(end)} onPress={()=>{void client?.command({type:'play',tileId:selected,end});}}/>
      </View>)}</View>}
    </View>}
  </View>;
}
