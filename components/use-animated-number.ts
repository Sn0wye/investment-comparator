import { useEffect, useRef, useState } from "react";

// Tweens toward `value` after the first render; the first render shows the
// real value so prerendered HTML is meaningful.
export function useAnimatedNumber(value: number, duration = 500) {
  const [shown, setShown] = useState(value);
  const current = useRef(value);
  useEffect(() => {
    const start = current.current;
    if (start === value) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = value;
      setShown(value);
      return;
    }
    const t0 = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      current.current = p < 1 ? start + (value - start) * eased : value;
      setShown(current.current);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return shown;
}
