export type TrackingStyle = 'robotic' | 'speedometer' | 'orbital';
export const TRACKING_STYLE_ORDER:TrackingStyle[]=['robotic','speedometer','orbital'];
export function nextTrackingStyle(style:TrackingStyle):TrackingStyle{return TRACKING_STYLE_ORDER[(TRACKING_STYLE_ORDER.indexOf(style)+1)%TRACKING_STYLE_ORDER.length];}
export type TrackingColor = 'green' | 'yellow' | 'blue' | 'red';
export type TrackingAColor = TrackingColor;
export type TrackingBColor = TrackingColor;
export const TRACKING_COLOR_ORDER: TrackingColor[] = ['green','yellow','blue','red'];
export function nextTrackingColor(color: TrackingColor): TrackingColor {
  return TRACKING_COLOR_ORDER[(TRACKING_COLOR_ORDER.indexOf(color)+1)%TRACKING_COLOR_ORDER.length];
}
export interface TrackingAppearance {
  style: TrackingStyle;
  teamAColor: TrackingAColor;
  teamBColor: TrackingBColor;
}
export const DEFAULT_TRACKING_APPEARANCE: TrackingAppearance = {
  style: 'robotic', teamAColor: 'yellow', teamBColor: 'red',
};

export function normalizeTrackingAppearance(value: unknown): TrackingAppearance {
  const saved = (value && typeof value === 'object' ? value : {}) as Partial<TrackingAppearance>;
  return {
    style: saved.style === 'speedometer' || saved.style === 'orbital' ? saved.style : 'robotic',
    teamAColor: TRACKING_COLOR_ORDER.includes(saved.teamAColor as TrackingColor) ? saved.teamAColor! : 'yellow',
    teamBColor: TRACKING_COLOR_ORDER.includes(saved.teamBColor as TrackingColor) ? saved.teamBColor! : 'red',
  };
}

/** Local presentation preferences. This store has no match, navigation or game dependencies. */
export function createTrackingAppearanceStore({read, write}: {
  read: () => Promise<unknown>;
  write: (value: TrackingAppearance) => Promise<void>;
}) {
  let snapshot = {...DEFAULT_TRACKING_APPEARANCE, ready: false};
  let loading: Promise<void> | undefined;
  let writes = Promise.resolve();
  let edits: Partial<TrackingAppearance> = {};
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(listener => listener());
  const persist = () => {
    const {style, teamAColor, teamBColor} = snapshot;
    // Capture this revision and serialize writes so the final selection wins.
    writes = writes.then(() => write({style, teamAColor, teamBColor})).catch(() => {});
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {listeners.add(listener); return () => {listeners.delete(listener);};},
    hydrate() {
      if (!loading) loading = read().catch(() => null).then(saved => {
        snapshot = {...normalizeTrackingAppearance(saved), ...edits, ready: true};
        notify();
        if (Object.keys(edits).length) persist();
      });
      return loading;
    },
    update(patch: Partial<TrackingAppearance>) {
      const next = {...snapshot, ...patch};
      const valid = normalizeTrackingAppearance(next);
      const changed: Partial<TrackingAppearance> = {};
      for (const key of ['style', 'teamAColor', 'teamBColor'] as const) {
        if (key in patch && !snapshot.ready) Object.assign(edits, {[key]: valid[key]});
        if (key in patch && valid[key] !== snapshot[key]) Object.assign(changed, {[key]: valid[key]});
      }
      if (!Object.keys(changed).length) return;
      edits = {...edits, ...changed};
      snapshot = {...snapshot, ...changed};
      notify();
      if (snapshot.ready) persist();
    },
    flush: () => writes,
  };
}
