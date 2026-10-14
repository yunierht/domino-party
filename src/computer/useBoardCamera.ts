import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { chainBounds, chainMetrics, fitBoardCamera, resizedBoardCamera, reconcileBoardCamera, BoardCamera } from './boardLayout';
import type { Tile } from './engine';
import { useReducedMotion } from './DrinkGift';

export function useBoardCamera(board: Tile[], openingId: string | null, width: number, height: number, round?: number) {
  const reduced = useReducedMotion();
  const current = useRef<BoardCamera>({ x: 0, y: 0, scale: 1 });
  const values = useRef({ x: new Animated.Value(0), y: new Animated.Value(0), scale: new Animated.Value(1) }).current;
  const active = useRef(false), pending = useRef(false), centerRequested = useRef(false);
  const manual=useRef(false),goal=useRef<BoardCamera>(current.current),animating=useRef(false);
  const animationId=useRef(0);
  const [revision, refresh] = useState(0);
  const previous = useRef({ width, height, count: 0, round });
  const fit = useRef(() => {});
  const stop = () => {animationId.current++;Object.values(values).forEach(value => value.stopAnimation());animating.current=false;};
  useEffect(() => {
    const entries = (['x', 'y', 'scale'] as const).map(key => ({ key, id: values[key].addListener(({ value }) => { current.current[key] = value; }) }));
    return () => { stop(); entries.forEach(({ key, id }) => values[key].removeListener(id)); };
  }, [values]);
  fit.current = () => {
    if(width<=0||height<=0)return;
    if (active.current) { pending.current = true; return; }
    pending.current = false;
    const newRound = round !== previous.current.round || board.length < previous.current.count;
    const firstPlacement=previous.current.count===0&&board.length>0;
    const firstMeasured=previous.current.width<=0||previous.current.height<=0;
    const reset = newRound || firstPlacement || firstMeasured || centerRequested.current;
    if(reset)manual.current=false;
    centerRequested.current = false;
    let planned=animating.current?goal.current:current.current;
    if (!reset && (width !== previous.current.width || height !== previous.current.height)) {
      if(animating.current)stop();
      const adjusted = resizedBoardCamera(current.current, previous.current, {width,height});
      planned=resizedBoardCamera(planned,previous.current,{width,height});
      current.current = adjusted;
      values.x.setValue(adjusted.x); values.y.setValue(adjusted.y);
    }
    const bounds=chainBounds(board,openingId,chainMetrics(2048,4096),false);
    let target = reset?fitBoardCamera(bounds,{width,height},{width:2048,height:4096},current.current,true):reconcileBoardCamera(bounds,{width,height},{width:2048,height:4096},planned,previous.current,manual.current);
    // Lower the opening slightly, then preserve it until the chain needs fitting.
    // Reuse the normal bounds clamp so small viewports retain their safety margin.
    if(reset&&board.length===1)target=fitBoardCamera(bounds,{width,height},{width:2048,height:4096},{...target,y:target.y+16});
    previous.current = { width, height, count: board.length, round };
    if (newRound||firstPlacement||firstMeasured) {
      // A fresh round must not inherit zoom if its layout interrupts an animation.
      stop();
      current.current = target;
      goal.current=target;
      values.x.setValue(target.x); values.y.setValue(target.y); values.scale.setValue(target.scale);
      return;
    }
    if(target===planned&&animating.current&&!reduced)return;
    // A resize creates separate objects even when the compensated values match.
    if(target===current.current||!animating.current&&Math.abs(target.x-current.current.x)<.25&&Math.abs(target.y-current.current.y)<.25&&Math.abs(target.scale-current.current.scale)<.0001){goal.current=current.current;return;}
    stop();
    goal.current=target;animating.current=true;
    const id=++animationId.current;
    Animated.parallel((['x', 'y', 'scale'] as const).map(key => Animated.timing(values[key], {
      toValue: target[key], duration: reduced ? 0 : 320, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }))).start(()=>{if(id===animationId.current)animating.current=false;});
  };
  // Compensate viewport geometry before paint so turn text cannot expose a stale transform.
  useLayoutEffect(() => { fit.current(); }, [board, openingId, width, height, round, reduced, revision]);
  return { current, values,
    begin: () => { active.current = true; stop();goal.current=current.current; },
    end: () => { active.current = false; if (pending.current) refresh(n => n + 1); },
    pan: (x: number, y: number) => { manual.current=true;values.x.setValue(x); values.y.setValue(y);goal.current={...current.current,x,y}; },
    center: () => { centerRequested.current = true; refresh(n => n + 1); },
  };
}
