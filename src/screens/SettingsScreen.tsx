import {FriendsProfileNameField} from '../friends/FriendsModule';
import {useNav} from '../nav/NavContext';
import {GoldPressable} from '../components/GoldPressable';
import React,{useState} from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { usePrefs } from '../state/PrefsContext';
import { Card, DominoTile } from '../components/ui';
import { Header } from '../components/Header';
import { Background } from '../components/Background';
import { THEMES, ThemeName } from '../theme/themes';
import { VoiceStyle, VOICE_STYLES, previewVoice } from '../announce/voice';
import { playTap } from '../sound/sounds';
import { Lang } from '../i18n/strings';

import { MusicChoices } from '../sound/MusicChoices';
import {useTableMusic} from '../sound/useTableMusic';
import {useComputerGame} from '../computer/ComputerGameContext';
import {OnlinePlayerAvatarPicker} from '../online/OnlinePlayerAvatarPicker';

export function SettingsScreen() {
  const {back,canGoBack}=useNav();
  const { theme, themeName, setThemeName, s } = useTheme();
  const { t, lang, setLang } = useI18n();
  const {playerAvatarId,setPlayerAvatarId,playerAvatarPhoto,playerAvatarName,setPlayerAvatarPhoto,clearPlayerAvatarPhoto} = useComputerGame();
  const { announceWinner, setAnnounceWinner, voice, setVoice, sound, setSound, tableMusic, setTableMusic,tableMusicTrack,ready } = usePrefs();
  useTableMusic(ready&&tableMusic,tableMusicTrack);
  const c = theme.colors;
  const [languageOpen,setLanguageOpen]=useState(false);
  const [appearanceOpen,setAppearanceOpen]=useState(false);

  const voiceMeta: { id: VoiceStyle; label: string }[] = [
    { id: 'announcer', label: t.voiceAnnouncer },
    { id: 'hype', label: t.voiceHype },
    { id: 'deep', label: t.voiceDeep },
    { id: 'robot', label: t.voiceRobot },
  ];

  const themeMeta: { name: ThemeName; title: string; desc: string }[] = [
    { name: 'carbon', title: t.themeCarbon, desc: t.themeCarbonDesc },
    { name: 'dark', title: t.themeDark, desc: t.themeDarkDesc },
    { name: 'casino', title: t.themeCasino, desc: t.themeCasinoDesc },
    { name: 'cubano', title: t.themeCubano, desc: t.themeCubanoDesc },
    { name: 'usa', title: t.themeUsa, desc: t.themeUsaDesc },
  ];

  const langMeta: { code: Lang; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: s(20), paddingBottom: s(40) }}>
      <Header title={t.settings} showBack={false} leftAction={canGoBack?<Pressable testID="settings-back" accessibilityRole="button" accessibilityLabel={lang==='es'?'Volver':'Back'} onPress={back} style={{width:44,height:44,justifyContent:'center',alignItems:'center'}}><Feather name="arrow-left" size={22} color={c.primary}/></Pressable>:undefined}/>

      <View testID="settings-music-row" style={{flexDirection:'row',alignItems:'center',gap:s(8),justifyContent:'space-between'}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:s(8)}}><Text style={{color:c.textMuted,fontSize:s(13),fontWeight:'800',textTransform:'uppercase',letterSpacing:.8}}>{lang === 'es' ? 'Música' : 'Music'}</Text><Switch accessibilityLabel={lang === 'es' ? 'Música' : 'Music'} value={tableMusic} onValueChange={setTableMusic} trackColor={{false:c.border,true:c.primary}} thumbColor="#fff" /></View>
        <Pressable testID="settings-language-selector" accessibilityRole="button" accessibilityLabel={lang==='es'?'Idioma: Español':'Language: English'} accessibilityState={{expanded:languageOpen}} onPress={()=>{setLanguageOpen(open=>!open);setAppearanceOpen(false);}} style={{minHeight:44,flexShrink:1,flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:10,borderRadius:theme.radius,borderWidth:1,borderColor:c.border,backgroundColor:c.surface}}><Feather name="globe" size={16} color={c.primary}/><Text numberOfLines={1} style={{color:c.text,fontSize:s(14),fontWeight:'600',flexShrink:1}}>{lang==='es'?'Español':'English'}</Text><Feather name={languageOpen?'chevron-up':'chevron-down'} size={16} color={c.textMuted}/></Pressable>
      </View>
      {languageOpen?<View testID="settings-language-menu" style={{alignSelf:'flex-end',width:160,marginTop:4,borderRadius:theme.radius,borderWidth:1,borderColor:c.border,backgroundColor:c.surface}}>{langMeta.map(l=><Pressable key={l.code} testID={'settings-language-'+l.code} accessibilityRole="button" accessibilityLabel={l.label} accessibilityState={{selected:lang===l.code}} onPress={()=>{setLang(l.code);setLanguageOpen(false);}} style={{minHeight:44,paddingHorizontal:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{color:c.text,fontSize:s(14),fontWeight:lang===l.code?'700':'400'}}>{l.label}</Text>{lang===l.code?<Feather name="check" size={18} color={c.primary}/>:null}</Pressable>)}</View>:null}
      <MusicChoices es={lang === 'es'} settingsAppearance={{text:c.text,surface:c.surface,border:c.border,primary:c.primary,radius:theme.radius,fontFamily:theme.fontFamily}}/>
      <View testID="settings-default-avatar" style={{marginBottom:s(24)}}>
        <OnlinePlayerAvatarPicker labelSize={13} label={lang==='es'?'Tu avatar por defecto':'Your default avatar'} es={lang==='es'} selected={playerAvatarId} onSelect={setPlayerAvatarId} photo={playerAvatarPhoto} photoName={playerAvatarName} onSavePhoto={setPlayerAvatarPhoto} onClearPhoto={clearPlayerAvatarPhoto}/>
      </View>
      <FriendsProfileNameField/>
      {/* Appearance */}
      <SectionLabel>{t.appearance}</SectionLabel>
      <Pressable testID="settings-appearance-selector" accessibilityRole="button" accessibilityLabel={t.appearance+': '+themeMeta.find(m=>m.name===themeName)?.title} accessibilityState={{expanded:appearanceOpen}} onPress={()=>{setAppearanceOpen(open=>!open);setLanguageOpen(false);}} style={{minHeight:68,padding:10,borderRadius:theme.radius,borderWidth:1,borderColor:c.border,backgroundColor:c.surface,flexDirection:'row',alignItems:'center',gap:12}}>
        <View style={{width:44,height:44,flexShrink:0,overflow:'hidden',borderRadius:8}}>{theme.background?<Background theme={theme} width={44} height={44}/>:<LinearGradient colors={c.gradient} style={{width:44,height:44}}/>}</View>
        <View style={{flex:1,minWidth:0,gap:3}}><Text style={{color:c.text,fontSize:s(16),fontWeight:'700'}}>{themeMeta.find(m=>m.name===themeName)?.title}</Text><Text style={{color:c.textMuted,fontSize:s(13),lineHeight:s(18)}}>{themeMeta.find(m=>m.name===themeName)?.desc}</Text></View>
        <View style={{width:24,flexShrink:0,alignItems:'center'}}><Feather name={appearanceOpen?'chevron-up':'chevron-down'} size={20} color={c.primary}/></View>
      </Pressable>
      {appearanceOpen?<View testID="settings-theme-menu" style={{marginTop:6,borderRadius:theme.radius,borderWidth:1,borderColor:c.border,backgroundColor:c.surface,overflow:'hidden'}}>{themeMeta.map(m=>{const chosen=themeName===m.name,tdef=THEMES[m.name];return <Pressable key={m.name} testID={'settings-theme-'+m.name} accessibilityRole="button" accessibilityLabel={m.title} accessibilityState={{selected:chosen}} onPress={()=>{setThemeName(m.name);setAppearanceOpen(false);}} style={{minHeight:48,paddingHorizontal:10,paddingVertical:6,flexDirection:'row',alignItems:'center',gap:12}}><View style={{width:32,height:32,flexShrink:0,borderRadius:6,overflow:'hidden'}}>{tdef.background?<Background theme={tdef} width={32} height={32}/>:<LinearGradient colors={tdef.colors.gradient} style={{width:32,height:32}}/>}</View><Text style={{flex:1,color:c.text,fontSize:s(14),fontWeight:chosen?'700':'400'}}>{m.title}</Text><View style={{width:24,flexShrink:0,alignItems:'center'}}>{chosen?<Feather name="check" size={18} color={c.primary}/>:null}</View></Pressable>;})}</View>:null}

      {/* Winner announcement */}
      <View style={{ height: s(24) }} />
      <SectionLabel>{t.announcer}</SectionLabel>
      <Card style={{paddingVertical:10,paddingHorizontal:12}}>
        <View testID="settings-announcer-toggle" style={{ minHeight:44,flexDirection:'row',alignItems:'center' }}>
          <Text style={{flex:1,paddingRight:12,color:c.text,fontSize:s(16),lineHeight:s(20),fontWeight:'700'}}>{t.announceWinnerTitle}</Text>
          <Switch accessibilityLabel={t.announceWinnerTitle} value={announceWinner} onValueChange={setAnnounceWinner} trackColor={{false:c.border,true:c.primary}} thumbColor="#fff" />
        </View>

        {announceWinner && (
          <>
            <View style={{ height: 1, backgroundColor: c.border, marginVertical: s(8), opacity: 0.6 }} />
            <Text style={{ color: c.textMuted, fontSize: s(13), fontWeight: '700', marginBottom: s(6) }}>
              {t.voiceLabel}
            </Text>
            <View testID="settings-voice-options" style={{ flexDirection: 'row', gap: s(6) }}>
              {voiceMeta.map((v) => {
                const selected = voice === v.id;
                return (
                  <GoldPressable finish gold={selected}
                    key={v.id} accessibilityRole="button" accessibilityLabel={v.label} accessibilityState={{selected}}
                    onPress={() => {
                      setVoice(v.id);
                      previewVoice(v.id);
                    }}
                    style={{
                      flex:v.id==='announcer'?2:v.id==='robot'?1.2:1, minWidth:44, paddingHorizontal: s(4),
                      minHeight:44,
                      borderRadius: theme.radius,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected ? c.primary : c.surfaceAlt,
                      borderWidth: 1,
                      borderColor: selected ? c.primary : c.border,
                    }}
                  >
                    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.8} style={{ color: selected ? c.onPrimary : c.text, fontSize: s(13), fontWeight: '800' }}>
                      {v.label}
                    </Text>
                  </GoldPressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => previewVoice(voice)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: s(8), marginTop: s(8),minHeight:44 }}
              hitSlop={8}
            >
              <Feather name="volume-2" size={s(18)} color={c.primary} />
              <Text style={{ color: c.primary, fontSize: s(14), fontWeight: '800' }}>{t.previewVoice}</Text>
            </Pressable>
          </>
        )}
      </Card>

      {/* Sound */}
      <View style={{ height: s(24) }} />
      <SectionLabel>{t.soundLabel}</SectionLabel>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: s(12) }}>
            <Text style={{ color: c.text, fontSize: s(16), fontWeight: '700' }}>{t.soundEffectsTitle}</Text>
            <Text style={{ color: c.textMuted, fontSize: s(13), marginTop: s(3), lineHeight: s(18) }}>
              {t.soundEffectsDesc}
            </Text>
          </View>
          <Switch
            value={sound}
            onValueChange={(v) => {
              setSound(v);
              if (v) playTap();
            }}
            trackColor={{ false: c.border, true: c.primary }}
            thumbColor="#fff"
          />
        </View>
      </Card>

      {/* About */}
      <View style={{ height: s(24) }} />
      <SectionLabel>{t.about}</SectionLabel>
      <Card>
        <Text style={{ color: c.textMuted, fontSize: s(14), lineHeight: s(20) }}>{t.aboutText}</Text>
      </Card>
    </ScrollView>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { theme, s } = useTheme();
  return (
    <Text
      style={{
        color: theme.colors.textMuted,
        fontSize: s(13),
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: s(12),
      }}
    >
      {children}
    </Text>
  );
}
