import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import {useI18n} from '../i18n/I18nContext';
import {TrackingAppearance} from '../state/trackingAppearanceStore';

export function TrackingAppearanceControls({value, onChange}: {
  value: TrackingAppearance;
  onChange: (patch: Partial<TrackingAppearance>) => void;
}) {
  const {theme, s} = useTheme();
  const {lang} = useI18n();
  const c = theme.colors;
  const spanish = lang === 'es';
  const group = (key: keyof TrackingAppearance, label: string, options: {value: string; label: string; color?: string}[]) => (
    <View style={{marginBottom:s(10),flexDirection:key==='style'?'column':'row',alignItems:key==='style'?undefined:'center'}}>
      <Text style={{color:c.textMuted,fontSize:s(11),fontWeight:'700',marginBottom:key==='style'?s(6):0,width:key==='style'?undefined:s(54),marginRight:key==='style'?0:s(8)}}>{label}</Text>
      <View style={{flexDirection:'row',gap:s(7),flex:key==='style'?undefined:1}}>
        {options.map(option => {
          const selected = value[key] === option.value;
          return <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={`${label}: ${option.label}`} accessibilityState={{checked:selected}} aria-checked={selected}
            onPress={() => onChange({[key]:option.value})}
            style={({pressed}) => ({flex:1,minHeight:s(44),borderRadius:s(10),borderWidth:1,borderColor:selected?c.primary:c.border,backgroundColor:c.surfaceAlt,paddingHorizontal:s(key==='style'?3:7),flexDirection:'row',alignItems:'center',justifyContent:'center',gap:s(5),opacity:pressed?.7:1})}>
            {option.color && <View style={{width:s(10),height:s(10),borderRadius:s(5),backgroundColor:option.color}}/>}
            <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={.8} style={{color:c.text,fontSize:s(key==='style'?11:12),fontWeight:selected?'800':'600',flexShrink:1,textAlign:'center'}}>{option.label}</Text>
            {selected&&<Text pointerEvents="none" style={{position:'absolute',top:s(1),right:s(4),color:c.primary,fontSize:s(11)}}>✓</Text>}
          </Pressable>;
        })}
      </View>
    </View>
  );
  return <View style={{backgroundColor:c.surface,borderWidth:1,borderColor:c.border,borderRadius:s(16),padding:s(12),paddingBottom:s(2),marginBottom:s(16)}}>
    {group('style',spanish?'Contador':'Counter',[
      {value:'robotic',label:spanish?'Robótico':'Robotic'},
      {value:'speedometer',label:spanish?'Velocímetro':'Speedometer'},
      {value:'orbital',label:'Orbital'},
    ])}

  </View>;
}
