import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

/** Animates a number from its previous value to `target` whenever it changes.
 *  Returns the in-progress display value — round/format it at the call site. */
export function useCountUp(target: number, duration = 0.6): number {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = target;
    if (from === target) {
      setDisplay(target);
      return;
    }
    const controls = animate(from, target, {
      duration,
      ease: 'easeOut',
      onUpdate: setDisplay,
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
}
