import {useTheme} from '../theme/ThemeContext';
import React from 'react';import {Pressable} from 'react-native';import {Feather} from '@expo/vector-icons';import {useNav} from '../nav/NavContext';
/** Independent of Back: returns to the landing page without resetting game state. */
export function HomeButton({es=false,color,focusColor}:{es?:boolean;color?:string;focusColor?:string}){const {goHome}=useNav();const {theme}=useTheme();return <Pressable testID="header-home" accessibilityRole="button" accessibilityLabel={es?'Inicio':'Home'} onPress={goHome} style={{outlineColor:focusColor,width:44,height:44,marginLeft:8,marginRight:4,alignItems:'center',justifyContent:'center'}}><Feather name="home" size={20} color={color??theme.colors.textMuted}/></Pressable>;}
