import {HomeButton} from './HomeButton';
import {useI18n} from '../i18n/I18nContext';
import React from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useNav } from '../nav/NavContext';

export function Header({
  title,
  centeredTitle = false,
  showBack = true,
  right,
  onTitlePress,
  showTitleEditHint = true,
  reserveThemeSpace = true,
  leftAction,
  onBackPress,
}: {
  title: string;
  centeredTitle?: boolean;
  showBack?: boolean;
  right?: React.ReactNode;
  /** When set, the title becomes tappable. */
  onTitlePress?: () => void;
  /** Set false when the tappable title should not show a pencil hint. */
  showTitleEditHint?: boolean;
  reserveThemeSpace?:boolean;
  leftAction?:React.ReactNode;
  onBackPress?:()=>void;
}) {
  const {lang}=useI18n();
  const { theme, s } = useTheme();
  const { back, canGoBack } = useNav();
  const c = theme.colors;
  const {width}=useWindowDimensions();
  const titleSize=s((reserveThemeSpace||leftAction)&&right&&width<380?18:22);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: s(52),
        marginBottom:s(8),
        paddingRight:centeredTitle?0:reserveThemeSpace?56:0,
      }}
    >
      {showBack && canGoBack ? (
        <><Pressable
          accessibilityRole="button" accessibilityLabel={lang==='es'?'Volver':'Back'}
          onPress={onBackPress??back}
          style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}
        >
          <Text style={{ color: c.primary, fontSize: s(26), fontWeight: '700' }}>
            ‹
          </Text>
        </Pressable><HomeButton es={lang==='es'}/></>
      ) : (
        <View style={{ width: s(8) }} />
      )}
      {leftAction}{leftAction&&<HomeButton es={lang==='es'}/>}
      {onTitlePress ? (
        <Pressable
          onPress={onTitlePress}
          hitSlop={8}
          style={{flex:1,minWidth:0,minHeight:44,flexDirection: 'row', alignItems: 'center', gap: s(7) }}
        >
          <Text
            style={{ color: c.text, fontSize:titleSize, fontWeight: '800', fontFamily: theme.fontFamily, flexShrink: 1 }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {showTitleEditHint && <Feather name="edit-2" size={s(15)} color={c.textMuted} />}
        </Pressable>
      ) : (
        <Text
          testID={centeredTitle?'centered-header-title':undefined}
          style={{ flex: 1, color: c.text, fontSize:titleSize, fontWeight: '800', fontFamily: theme.fontFamily, ...(centeredTitle?{position:'absolute',left:100,right:100,textAlign:'center' as const}: {}) }}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
      {centeredTitle&&right?<View style={{marginLeft:"auto"}}>{right}</View>:right}
    </View>
  );
}
