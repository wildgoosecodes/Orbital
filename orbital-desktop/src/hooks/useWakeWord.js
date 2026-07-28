import { useEffect, useRef } from 'react';
import { startWakeWordListening } from '../lib/wakewordPipeline';

/** Starts hands-free "Hey Orbital" listening while `enabled` is true; calls
 *  onDetected() each time the phrase is heard. */
export function useWakeWord(enabled, onDetected) {
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  useEffect(() => {
    if (!enabled) return undefined;

    let stopFn = null;
    let cancelled = false;

    startWakeWordListening({
      getModelDir: () => window.orbital.getWakewordModelDir(),
      onDetected: () => onDetectedRef.current(),
    }).then((stop) => {
      if (cancelled) {
        stop?.();
      } else {
        stopFn = stop;
      }
    });

    return () => {
      cancelled = true;
      stopFn?.();
    };
  }, [enabled]);
}
