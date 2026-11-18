import { useEffect } from 'react';
import { enterFullscreen, isFullscreen } from '../utils/fullscreen.js';

export function useMobileFullscreen() {
  useEffect(() => {
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);

    let prevPortrait = window.innerHeight > window.innerWidth;
    let userManuallyExited = false;

    const onFullscreenChange = () => {
      if (!isFullscreen()) {
        userManuallyExited = true;
      } else {
        userManuallyExited = false;
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);

    // Auto-enter fullscreen whenever rotated into landscape
    const handleOrientationChange = () => {
      const nowLandscape = window.innerWidth > window.innerHeight;
      if (nowLandscape) {
        // Reset manual exit flag on rotation so rotate always triggers fullscreen
        userManuallyExited = false;
        enterFullscreen();
      }
      prevPortrait = !nowLandscape;
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }

    // On user touch in landscape mode, if not in fullscreen and not manually exited, enter fullscreen
    const handleTouch = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape && !isFullscreen() && !userManuallyExited) {
        enterFullscreen();
      }
    };

    window.addEventListener('touchend', handleTouch, { passive: true });
    window.addEventListener('click', handleTouch, { passive: true });

    // Initial check: if already landscape on mobile, try to go fullscreen
    if (isTouch && window.innerWidth > window.innerHeight && !isFullscreen()) {
      enterFullscreen();
    }

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange', onFullscreenChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      window.removeEventListener('touchend', handleTouch);
      window.removeEventListener('click', handleTouch);
    };
  }, []);
}
