import { useEffect, useState } from 'react';
import { CANVAS_W, CANVAS_H } from '../game/constants.js';

const calc = () => {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  const vw = vv ? vv.width : window.innerWidth;
  const vh = vv ? vv.height : window.innerHeight;
  const scaleX = vw / CANVAS_W;
  const scaleY = vh / CANVAS_H;
  return {
    scaleX,
    scaleY,
    scale: Math.min(scaleX, scaleY),
    vw,
    vh,
  };
};

// Fits the game canvas edge-to-edge across any viewport (zero black bars on top/bottom/sides)
export function useScale() {
  const [s, setS] = useState(calc);
  useEffect(() => {
    const onResize = () => setS(calc());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onResize);
      window.visualViewport.addEventListener('scroll', onResize);
    }
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onResize);
        window.visualViewport.removeEventListener('scroll', onResize);
      }
    };
  }, []);
  return { ...s, portrait: s.vh > s.vw };
}
