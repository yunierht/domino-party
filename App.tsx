import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { I18nProvider } from './src/i18n/I18nContext';
import { GameProvider, useGame } from './src/state/GameContext';
import { NavProvider, useNav } from './src/nav/NavContext';
import { FullScreenLoader } from './src/components/ui';

import { HomeScreen } from './src/screens/HomeScreen';
import { NewMatchScreen } from './src/screens/NewMatchScreen';
import { GameScreen } from './src/screens/GameScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { WatchScreen } from './src/screens/WatchScreen';

function Router() {
  const { screen } = useNav();
  switch (screen) {
    case 'home':
      return <HomeScreen />;
    case 'newMatch':
      return <NewMatchScreen />;
    case 'game':
      return <GameScreen />;
    case 'history':
      return <HistoryScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'watch':
      return <WatchScreen />;
    default:
      return <HomeScreen />;
  }
}

function AppShell() {
  const { theme, ready } = useTheme();
  const { loaded } = useGame();

  if (!ready || !loaded) return <FullScreenLoader />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <Router />
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <GameProvider>
            <NavProvider>
              <AppShell />
            </NavProvider>
          </GameProvider>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
