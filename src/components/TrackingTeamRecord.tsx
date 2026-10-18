import React from 'react';
import {Text,View} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import {useI18n} from '../i18n/I18nContext';
import type {TrackingRecord} from '../stats/trackingTeamRecord';
export function TrackingTeamRecord({record}:{record:TrackingRecord|null}){
 const {theme,s}=useTheme(),{lang}=useI18n(),es=lang==='es',c=theme.colors;
 return <View testID="tracking-team-record" pointerEvents="none" style={{position:'absolute',top:s(12),left:s(12),width:s(88),zIndex:2,gap:s(4)}}>
  <Text testID="tracking-team-wins" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.85} style={{color:c.textMuted,fontSize:s(11),lineHeight:s(16)}}>{es?'Ganadas: ':'Wins: '}<Text style={{color:c.text,fontWeight:'800'}}>{record?.wins??'—'}</Text></Text>
  <Text testID="tracking-team-losses" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.85} style={{color:c.textMuted,fontSize:s(11),lineHeight:s(16)}}>{es?'Perdidas: ':'Losses: '}<Text style={{color:c.text,fontWeight:'800'}}>{record?.losses??'—'}</Text></Text>
 </View>;
}
