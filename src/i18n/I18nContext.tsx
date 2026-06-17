import React, { createContext, useContext, useEffect, useState } from 'react';
import { Lang, Strings, STRINGS } from './strings';
import { KEYS, loadJSON, saveJSON } from '../storage/storage';

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Strings;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    loadJSON<Lang>(KEYS.lang, 'en').then((l) => {
      if (STRINGS[l]) setLangState(l);
    });
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    saveJSON(KEYS.lang, l);
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t: STRINGS[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
