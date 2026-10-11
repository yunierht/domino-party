import React,{createContext,useContext} from 'react';
const TableVisibility=createContext(true);
export function useTableVisible(){return useContext(TableVisibility);}
import {View} from 'react-native';
/** Retain the originating lobby's draft selections while Settings is open. */
export function GameSettingsBoundary({settings,settingsScreen,children}:{settings:boolean;settingsScreen:React.ReactNode;children:React.ReactNode}){return <View style={{flex:1}}><View style={{flex:1,display:settings?'none':'flex'}} accessibilityElementsHidden={settings} importantForAccessibility={settings?'no-hide-descendants':'auto'}><TableVisibility.Provider value={!settings}>{children}</TableVisibility.Provider></View>{settings&&settingsScreen}</View>;}
