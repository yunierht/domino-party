import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import * as Linking from 'expo-linking';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { I18nProvider } from './src/i18n/I18nContext';
import { GameProvider, useGame } from './src/state/GameContext';
import { PrefsProvider } from './src/state/PrefsContext';
import { NavProvider, useNav } from './src/nav/NavContext';
import { FullScreenLoader } from './src/components/ui';
import { Background } from './src/components/Background';
import {AppearanceSpinner} from './src/components/AppearanceSpinner';
import { DayResetPrompt } from './src/components/DayResetPrompt';
import { useTilt } from './src/hooks/useTilt';

import { HomeScreen } from './src/screens/HomeScreen';
import { NewMatchScreen } from './src/screens/NewMatchScreen';
import { GameScreen } from './src/screens/GameScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { WatchScreen } from './src/screens/WatchScreen';
import { WatchHistoryScreen } from './src/screens/WatchHistoryScreen';
import { HowToScreen } from './src/screens/HowToScreen';
import { PrivacyScreen } from './src/screens/PrivacyScreen';
import { TableGameProvider, useTableGame } from './src/poker/TableGameContext';
import { CardGameLobby } from './src/poker/CardGameLobby';
import { PokerScreen } from './src/poker/PokerScreen';
import { BlackjackProvider } from './src/blackjack/BlackjackContext';
import { BlackjackLobby } from './src/blackjack/BlackjackLobby';
import { BlackjackScreen } from './src/blackjack/BlackjackScreen';
import { ComputerGameScreen } from './src/screens/ComputerGameScreen';
import { ComputerGameProvider } from './src/computer/ComputerGameContext';

function TableScreen() { const {mode}=useTableGame(); return mode === 'poker' ? <PokerScreen /> : <ComputerGameScreen />; }

function Router() {
  const { screen, watchHistory } = useNav();
  switch (screen) {
    case 'home':
      return <HomeScreen />;
    case 'newMatch':
      return <NewMatchScreen />;
    case 'game':
      return <GameScreen />;
    case 'pokerLobby': return <CardGameLobby game="poker" />;
    case 'blackjackLobby': return <BlackjackLobby />;
    case 'blackjackTable': return <BlackjackScreen />;
    case 'computerGame':
      return <TableScreen />;
    case 'history':
      return <HistoryScreen />;
    case 'watchHistory':
      return watchHistory ? (
        <WatchHistoryScreen
          fallback={watchHistory.fallback}
          historySpaceId={watchHistory.historySpaceId}
        />
      ) : (
        <HistoryScreen matches={[]} readOnly />
      );
    case 'stats':
      return <StatsScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'watch':
      return <WatchScreen />;
    case 'howto':
      return <HowToScreen />;
    case 'privacy':
      return <PrivacyScreen />;
    default:
      return <HomeScreen />;
  }
}

function AppShell() {
  const { theme, ready } = useTheme();
  const { loaded } = useGame();
  const { openWatch, screen } = useNav();
  const computerTable = screen === 'computerGame' || screen === 'blackjackTable' || screen === 'pokerLobby' || screen === 'blackjackLobby';
  const tilt = useTilt(18);

  // Open a shared game when the app is launched/opened from a link
  // (e.g. dominoparty://watch?code=KQ7M or a /join?code=KQ7M universal link).
  const url = Linking.useURL();
  const handledUrl = useRef<string | null>(null);
  useEffect(() => {
    if (!url || handledUrl.current === url) return;
    handledUrl.current = url;
    try {
      const code = Linking.parse(url).queryParams?.code;
      if (code) openWatch(String(code));
    } catch {
      // ignore malformed links
    }
  }, [url, openWatch]);

  if (!ready || !loaded) return <FullScreenLoader />;

  return (
    <View style={{ flex: 1, backgroundColor: computerTable ? '#081D1B' : theme.colors.bg }}>
      <StatusBar style={computerTable || theme.dark ? 'light' : 'dark'} />
      {!computerTable && <Background theme={theme} tiltX={tilt.x} tiltY={tilt.y} />}
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {computerTable?<Router/>:<View style={{flex:1}}>
          <Router />
          {screen!=='home'&&screen!=='game'&&<View testID="global-theme-control" pointerEvents="box-none" style={{position:'absolute',top:2,right:8,zIndex:20}}><AppearanceSpinner/></View>}
        </View>}
      </SafeAreaView>
      <DayResetPrompt />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <PrefsProvider>
          <GameProvider>
            <NavProvider>
              <ComputerGameProvider>
              <TableGameProvider><BlackjackProvider><AppShell /></BlackjackProvider></TableGameProvider>
              </ComputerGameProvider>
            </NavProvider>
          </GameProvider>
          </PrefsProvider>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
