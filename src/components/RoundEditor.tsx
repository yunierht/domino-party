import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { Button } from './ui';
import { NumberPad } from './NumberPad';
import { Match, Round, teamById } from '../types';

export function RoundEditor({
  visible,
  match,
  round,
  presetWinnerTeamId,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  match: Match;
  /** Existing round when editing, undefined when adding. */
  round?: Round;
  /** When adding from a team box, the winning team is already known. */
  presetWinnerTeamId?: string;
  onClose: () => void;
  onSave: (winnerTeamId: string, points: number) => void;
  onDelete?: () => void;
}) {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const c = theme.colors;

  const isEditing = !!round;
  // Hide the team picker when adding from a specific team's box.
  const lockTeam = !isEditing && !!presetWinnerTeamId;

  const [winnerTeamId, setWinnerTeamId] = useState(
    presetWinnerTeamId ?? match.teams[0].id,
  );
  const [points, setPoints] = useState('');

  useEffect(() => {
    if (visible) {
      setWinnerTeamId(round?.winnerTeamId ?? presetWinnerTeamId ?? match.teams[0].id);
      setPoints(round ? String(round.points) : '');
    }
  }, [visible, round, presetWinnerTeamId, match.teams]);

  const teamColors = [c.teamA, c.teamB];
  const numeric = parseInt(points, 10);
  const valid = !Number.isNaN(numeric) && numeric > 0;

  const lockedTeam = teamById(match, winnerTeamId);
  const lockedColor =
    winnerTeamId === match.teams[0].id ? c.teamA : c.teamB;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: s(20) }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: s(380),
            backgroundColor: c.surface,
            borderRadius: theme.radius + 8,
            padding: s(20),
          }}
        >
            {/* Title */}
            <Text style={{ color: c.text, fontSize: s(20), fontWeight: '800', marginBottom: s(16) }}>
              {isEditing ? t.editRound : t.addRound}
            </Text>

            {lockTeam ? (
              /* Adding from a team box: team is fixed, just show it. */
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: c.surfaceAlt,
                  borderRadius: theme.radius,
                  borderLeftWidth: s(5),
                  borderLeftColor: lockedColor,
                  padding: s(14),
                  marginBottom: s(20),
                }}
              >
                <View
                  style={{ width: s(12), height: s(12), borderRadius: s(6), backgroundColor: lockedColor, marginRight: s(10) }}
                />
                <Text style={{ color: c.text, fontSize: s(18), fontWeight: '800' }} numberOfLines={1}>
                  {lockedTeam?.name}
                </Text>
              </View>
            ) : (
              /* Editing: allow changing the winning team. */
              <>
                <Text style={{ color: c.textMuted, fontSize: s(13), fontWeight: '700', marginBottom: s(10) }}>
                  {t.whoWon}
                </Text>
                <View style={{ flexDirection: 'row', gap: s(10), marginBottom: s(20) }}>
                  {match.teams.map((team, i) => {
                    const selected = winnerTeamId === team.id;
                    return (
                      <Pressable
                        key={team.id}
                        onPress={() => setWinnerTeamId(team.id)}
                        style={{
                          flex: 1,
                          paddingVertical: s(16),
                          borderRadius: theme.radius,
                          alignItems: 'center',
                          backgroundColor: selected ? teamColors[i] : c.surfaceAlt,
                          borderWidth: 2,
                          borderColor: selected ? teamColors[i] : c.border,
                        }}
                      >
                        <Text
                          numberOfLines={1}
                          style={{ color: selected ? '#fff' : c.text, fontSize: s(16), fontWeight: '800' }}
                        >
                          {team.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={{ color: c.textMuted, fontSize: s(13), fontWeight: '700', marginBottom: s(10) }}>
              {t.pointsEarned}
            </Text>
            {/* Big value display (no OS keyboard — stays fully visible) */}
            <View
              style={{
                backgroundColor: c.surfaceAlt,
                borderRadius: theme.radius,
                height: s(70),
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: lockTeam ? lockedColor : c.border,
                marginBottom: s(14),
              }}
            >
              <Text style={{ color: points ? c.text : c.textMuted, fontSize: s(38), fontWeight: '900' }}>
                {points || '0'}
              </Text>
            </View>

            <NumberPad value={points} onChange={setPoints} />

            <View style={{ height: s(6) }} />
            <Button
              label={t.save}
              onPress={() => valid && onSave(winnerTeamId, numeric)}
              disabled={!valid}
              fullWidth
            />
            <View style={{ height: s(10) }} />
            {isEditing && onDelete ? (
              <Button label={t.delete} variant="danger" onPress={onDelete} fullWidth />
            ) : (
              <Button label={t.cancel} variant="ghost" onPress={onClose} fullWidth />
            )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
