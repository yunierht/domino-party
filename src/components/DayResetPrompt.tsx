import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useGame } from '../state/GameContext';
import { KEYS, loadJSON, saveJSON } from '../storage/storage';
import { AppDialog } from './AppDialog';

/** Local calendar day as YYYY-MM-DD. */
const todayKey = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

/**
 * On the first launch of a new calendar day (when older games still exist),
 * offers to clear history so previous days' games don't blend into today's
 * stats. Prompts at most once per day.
 */
export function DayResetPrompt() {
  const { t } = useI18n();
  const { loaded, matches, deleteAllMatches } = useGame();
  const [visible, setVisible] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (!loaded || checked.current) return;
    checked.current = true;
    const today = todayKey();
    (async () => {
      const last = await loadJSON<string | null>(KEYS.lastPlayDay, null);
      if (last && last !== today && matches.length > 0) setVisible(true);
      // Remember today so we only ask once for this new day.
      saveJSON(KEYS.lastPlayDay, today);
    })();
  }, [loaded, matches.length]);

  return (
    <AppDialog
      visible={visible}
      icon="sunrise"
      title={t.newDayTitle}
      message={t.newDayBody}
      actions={[
        {
          label: t.clearAll,
          variant: 'danger',
          onPress: () => {
            deleteAllMatches();
            setVisible(false);
          },
        },
        { label: t.keepGames, variant: 'ghost', onPress: () => setVisible(false) },
      ]}
      onRequestClose={() => setVisible(false)}
    />
  );
}
