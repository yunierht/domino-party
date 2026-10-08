import {MatchPanelBevel} from '../components/MatchPresentation';
import {trackingSetupComfort,trackingSetupHeaderGap} from '../components/trackingLayout';
import {TrackingColorButton} from '../components/TrackingColorButton';
import {type TrackingColor} from '../state/trackingAppearanceStore';
import {useTrackingAppearance} from '../state/useTrackingAppearance';
import React, { useEffect,useRef,useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TextInputProps, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { useGame } from '../state/GameContext';
import { useNav } from '../nav/NavContext';
import { Button, Card } from '../components/ui';
import { Header } from '../components/Header';

const PRESETS = [100, 150];

export function NewMatchScreen() {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const {createMatch,currentMatch,updateMatchConfiguration,canEdit}=useGame();
  const {go,back,goHome,setupMode}=useNav();
  const editingMatch=setupMode==='edit'?currentMatch:null;
  const editingRequested=setupMode==='edit';
  const c = theme.colors;
  const appearance=useTrackingAppearance();
  const {height}=useWindowDimensions();
  const insets=useSafeAreaInsets();
  const [layoutHeight,setLayoutHeight]=useState<number|null>(null);
  const availableHeight=layoutHeight??height-insets.top-insets.bottom;
  const compact=availableHeight<720;
  const comfort=trackingSetupComfort(availableHeight);
  const spacing=(small:number,large:number)=>Math.round(small+(large-small)*comfort);

  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [a1, setA1] = useState('');
  const [a2, setA2] = useState('');
  const [b1, setB1] = useState('');
  const [b2, setB2] = useState('');
  const [target, setTarget] = useState<number>(100);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');
  const [error, setError] = useState('');
  const [targetDirty,setTargetDirty]=useState(false);
  const filledMatchId=useRef<string|null>(null);
  useEffect(()=>{
    if(!editingMatch||filledMatchId.current===editingMatch.id)return;
    filledMatchId.current=editingMatch.id;
    const [a,b]=editingMatch.teams;setTeamAName(a.name);setTeamBName(b.name);setA1(a.players[0]);setA2(a.players[1]);setB1(b.players[0]);setB2(b.players[1]);
    setTarget(editingMatch.targetScore);const custom=!PRESETS.includes(editingMatch.targetScore);setCustomMode(custom);setCustomText(custom?String(editingMatch.targetScore):'');setTargetDirty(false);
  },[editingMatch]);

  const resolvedTarget = customMode ? parseInt(customText, 10) || 0 : target;

  const onStart = () => {
    if(editingRequested&&!editingMatch)return;
    const confirmedTarget=editingMatch&&!targetDirty?editingMatch.targetScore:resolvedTarget;
    const nameA = teamAName.trim() || `${t.team} A`;
    const nameB = teamBName.trim() || `${t.team} B`;
    if (confirmedTarget < 1) {
      setError(t.enterPoints);
      return;
    }
    if(editingMatch&& !canEdit)return;
    if(editingMatch)updateMatchConfiguration(editingMatch.id,
      {name:nameA,players:[a1.trim(),a2.trim()]},
      {name:nameB,players:[b1.trim(),b2.trim()]},confirmedTarget);
    else createMatch(
      { name: nameA, players: [a1.trim(), a2.trim()] },
      { name: nameB, players: [b1.trim(), b2.trim()] },
      resolvedTarget,
    );
    // Replace setup screen with game: go back then forward.
    back();
    go('game');
  };

  const teamCard=(side:'A'|'B')=><TeamCard key={side} comfort={comfort} accent={side==='A'?appearance.teamAColorValue:appearance.teamBColorValue}
    colorChoice={side==='A'?appearance.teamAColor:appearance.teamBColor}
    onCycleColor={()=>appearance.cycleTeamColor(side)}
    title={`${t.team} ${side}`} name={side==='A'?teamAName:teamBName} setName={side==='A'?setTeamAName:setTeamBName}
    p1={side==='A'?a1:b1} setP1={side==='A'?setA1:setB1} p2={side==='A'?a2:b2} setP2={side==='A'?setA2:setB2}/>;
  return (
    <KeyboardAvoidingView onLayout={event=>{const measured=event.nativeEvent.layout.height;if(measured>0)setLayoutHeight(previous=>previous!==null&&Math.abs(previous-measured)<1?previous:measured);}} style={{flex:1}} behavior="padding" keyboardVerticalOffset={Platform.OS==='ios'?0:0}>
      <ScrollView contentContainerStyle={{paddingHorizontal:8,paddingTop:2,paddingBottom:spacing(4,8),width:'100%',maxWidth:620,alignSelf:'center',flexGrow:1}}
        keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" showsVerticalScrollIndicator={false}>
        <View style={{marginBottom:-s(16)}}><Header title={t.setupMatch} onBackPress={goHome}/></View>
        <View style={{height:trackingSetupHeaderGap(availableHeight)}}/>
        <View style={{flexDirection:'column',gap:0}}>
          <View testID="tracking-setup-panel-A">{teamCard('A')}</View>
          <View key="between-teams" style={{height:spacing(24,31),flexDirection:'row',alignItems:'center',gap:10}}><View style={{flex:1,height:1,backgroundColor:c.border}}/><Text style={{color:c.textMuted,fontSize:12,lineHeight:16,fontWeight:'800',letterSpacing:2}}>VS</Text><View style={{flex:1,height:1,backgroundColor:c.border}}/></View>
          <View testID="tracking-setup-panel-B">{teamCard('B')}</View>
        </View>
        <View style={{height:spacing(16,30)}}/>
        <View>
          <Text style={{color:error?c.danger:c.textMuted,fontSize:13,lineHeight:16,fontWeight:'700',textTransform:'uppercase',letterSpacing:.6,marginBottom:spacing(6,8)}}>{error||t.targetScore}</Text>
          <View style={{flexDirection:'row',alignItems:'flex-end',gap:8}}>
            {PRESETS.map(p=><Chip key={p} label={String(p)} selected={!customMode&&target===p} onPress={()=>{setCustomMode(false);setTarget(p);setTargetDirty(true);setError('');}}/>)}
            {customMode?<SetupField inline label={t.custom} accessibilityLabel={`${t.targetScore}: ${t.custom}`} value={customText} onChangeText={value=>{setCustomText(value);setTargetDirty(true);}} keyboardType="number-pad" placeholder="120" style={{borderColor:c.primary,borderWidth:1.5,textAlign:'center',fontWeight:'800'}}/>
              :<Chip label={t.custom} selected={false} onPress={()=>{setCustomMode(true);setTargetDirty(true);setError('');}}/>}
          </View>
        </View>
        <View style={{height:spacing(12,16)}}/>
        <Button label={editingRequested?t.save:t.startMatch} onPress={onStart} disabled={editingRequested&&(!editingMatch||!canEdit)} fullWidth/>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TeamCard({
  comfort,
  accent,
  colorChoice,
  onCycleColor,
  title,
  name,
  setName,
  p1,
  setP1,
  p2,
  setP2,
}: {
  comfort:number;
  accent: string;
  colorChoice: TrackingColor;
  onCycleColor:()=>void;
  title: string;
  name: string;
  setName: (v: string) => void;
  p1: string;
  setP1: (v: string) => void;
  p2: string;
  setP2: (v: string) => void;
}) {
  const { theme,s } = useTheme();
  const c=theme.colors;
  const spacing=(small:number,large:number)=>Math.round(small+(large-small)*comfort);
  const { t } = useI18n();
  return (
    <Card style={{borderColor:accent,borderWidth:1.5,borderRadius:24,shadowOpacity:.45,padding:spacing(12,38)}}><MatchPanelBevel color={accent}/>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: s(5),
          left: s(10),
          right: s(10),
          height: 1,
          backgroundColor: 'rgba(255,255,255,0.13)',
        }}
      />
      <View style={{flexDirection:'row',alignItems:'flex-start',gap:12,marginBottom:spacing(12,27)}}>
        <View style={{flex:1}}><SetupField labelGap={spacing(4,10)} label={t.teamName} accessibilityLabel={`${t.teamName}: ${title}`} value={name} onChangeText={setName} placeholder={title} style={{height:spacing(44,55),fontWeight:'700',borderColor:accent,borderWidth:1}}/></View>
        <TrackingColorButton teamLabel={title} value={colorChoice} onPress={onCycleColor}/>
      </View>
      <View style={{flexDirection:'row',gap:8}}>
        <View style={{flex:1}}><SetupField labelGap={spacing(4,10)} label={t.player1} value={p1} onChangeText={setP1} placeholder={t.player1} style={{height:spacing(44,55)}}/></View>
        <View style={{flex:1}}><SetupField labelGap={spacing(4,10)} label={t.player2} value={p2} onChangeText={setP2} placeholder={t.player2} style={{height:spacing(44,55)}}/></View>
      </View>
    </Card>
  );
}

function SetupField({label,inline=false,labelGap=4,style,...props}:{label:string;inline?:boolean;labelGap?:number}&TextInputProps){
  const {theme,s}=useTheme();const c=theme.colors;
  return <View style={{flex:inline?1:undefined}}>
    {!inline&&<Text numberOfLines={1} style={{color:c.textMuted,fontSize:11,lineHeight:14,fontWeight:'600',marginBottom:labelGap,textTransform:'uppercase'}}>{label}</Text>}
    <TextInput {...props} accessibilityLabel={props.accessibilityLabel??label} placeholderTextColor={c.textMuted}
      style={[{height:44,backgroundColor:c.surfaceAlt,borderRadius:theme.radius,paddingHorizontal:10,fontSize:Math.min(18,s(16)),color:c.text,borderWidth:1,borderColor:c.border},style]}/>
  </View>;
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme, s } = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex:1,
        paddingHorizontal:s(8),
        height:44,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? c.primary : c.surfaceAlt,
        borderWidth: 1.5,
        borderColor: selected ? '#F6D37B' : c.border,
        opacity: pressed ? 0.8 : 1,
        overflow: 'hidden',
        shadowColor: selected ? c.primary : '#000',
        shadowOpacity: selected ? 0.34 : 0.26,
        shadowRadius: s(10),
        shadowOffset: { width: 0, height: pressed ? s(2) : s(5) },
        elevation: selected ? 7 : 4,
        transform: [{ translateY: pressed ? s(1) : 0 }],
      })}
    >
      <LinearGradient
        colors={
          selected
            ? ['rgba(255,255,255,0.42)', 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0.20)']
            : ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.20)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Text
        style={{
          color: selected ? c.onPrimary : c.text,
          fontSize: s(16),
          fontWeight: '900',
          textShadowColor: 'rgba(0,0,0,0.35)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
