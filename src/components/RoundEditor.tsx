import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { Button } from './ui';
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: theme.radius + 8,
              borderTopRightRadius: theme.radius + 8,
              padding: s(20),
              paddingBottom: s(34),
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: s(40),
                height: s(5),
                borderRadius: 3,
                backgroundColor: c.border,
                marginBottom: s(16),
              }}
            />

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
            <TextInput
              value={points}
              onChangeText={setPoints}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={c.textMuted}
              autoFocus
              onSubmitEditing={() => valid && onSave(winnerTeamId, numeric)}
              style={{
                backgroundColor: c.surfaceAlt,
                borderRadius: theme.radius,
                height: s(64),
                textAlign: 'center',
                fontSize: s(32),
                fontWeight: '900',
                color: c.text,
                borderWidth: 1,
                borderColor: c.border,
                marginBottom: s(20),
              }}
            />

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
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
