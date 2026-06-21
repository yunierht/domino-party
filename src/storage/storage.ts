import AsyncStorage from '@react-native-async-storage/async-storage';

// Thin typed wrapper around AsyncStorage with JSON (de)serialization.

export async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function saveJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort: ignore write failures (e.g. storage full).
  }
}

export const KEYS = {
  matches: 'dominoes:matches',
  currentMatchId: 'dominoes:currentMatchId',
  theme: 'dominoes:theme',
  lang: 'dominoes:lang',
  displayName: 'dominoes:displayName',
  prefs: 'dominoes:prefs',
  lastPlayDay: 'dominoes:lastPlayDay',
} as const;
