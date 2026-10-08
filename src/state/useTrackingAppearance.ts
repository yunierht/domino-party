import {useEffect, useSyncExternalStore} from 'react';
import {loadJSON, saveJSON} from '../storage/storage';
import {createTrackingAppearanceStore,nextTrackingColor,nextTrackingStyle} from './trackingAppearanceStore';

export const TRACKING_APPEARANCE_KEY = 'dominoes:trackingAppearance';
export const TRACKING_COLORS = {
  yellow: '#D7A63D', green: '#65C59A', red: '#AA463B', blue: '#68B9F5',
} as const;
const store = createTrackingAppearanceStore({
  read: () => loadJSON<unknown>(TRACKING_APPEARANCE_KEY, null),
  write: value => saveJSON(TRACKING_APPEARANCE_KEY, value),
});

/** Explicit New Match intent; Setup choices and ordinary navigation never call this. */
export function resetNewTrackingMatchAppearance() {
  store.update({style:'robotic',teamAColor:'yellow',teamBColor:'red'});
}

/** Scoped to scorekeeping screens; changing these preferences never touches match storage. */
export function useTrackingAppearance() {
  const appearance = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => {void store.hydrate();}, []);
  return {
    ...appearance,
    setAppearance: store.update,
    resetNewMatchAppearance:resetNewTrackingMatchAppearance,
    cycleStyle:()=>store.update({style:nextTrackingStyle(store.getSnapshot().style)}),
    cycleTeamColor:(side:'A'|'B')=>{const key=side==='A'?'teamAColor':'teamBColor';store.update({[key]:nextTrackingColor(store.getSnapshot()[key])});},
    teamAColorValue: TRACKING_COLORS[appearance.teamAColor],
    teamBColorValue: TRACKING_COLORS[appearance.teamBColor],
  };
}
