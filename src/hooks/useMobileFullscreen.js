import { useEffect } from 'react';
import { enterFullscreen, isFullscreen, isIOS, isMobileDevice } from '../utils/fullscreen.js';

export function useMobileFullscreen() {
  useEffect(() => {
    // Only run on mobile/tablet devices. Never on desktop.
    if (!isMobileDevice()) {
      return undefined;
    }

    let prevPortrait = window.innerHeight > window.innerWidth;
    let userManuallyExited = false;

    // Prevent iOS Safari pinch-to-zoom gestures inside the game
    const preventZoom = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };
    const preventGesture = (e) => e.preventDefault();

    if (isIOS()) {
      document.addEventListener('touchstart', preventZoom, { passive: false });
      document.addEventListener('gesturestart', preventGesture, { passive: false });
      document.addEventListener('gesturechange', preventGesture, { passive: false });
      document.addEventListener('gestureend', preventGesture, { passive: false });
    }

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

    // Auto-enter fullscreen whenever rotated into landscape on mobile
    const handleOrientationChange = () => {
      const nowLandscape = window.innerWidth > window.innerHeight;
      if (nowLandscape) {
        userManuallyExited = false;
        // On iOS Safari, scrolling to 0,0 hides the floating address bar
        window.scrollTo(0, 0);
        enterFullscreen();
      }
      prevPortrait = !nowLandscape;
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleOrientationChange);
    }

    // On mobile touch in landscape mode, enter fullscreen
    const handleTouch = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape && !isFullscreen() && !userManuallyExited) {
        window.scrollTo(0, 0);
        enterFullscreen();
      }
    };

    window.addEventListener('touchend', handleTouch, { passive: true });

    // Initial check: if already landscape on mobile, try to go fullscreen
    if (window.innerWidth > window.innerHeight && !isFullscreen()) {
      window.scrollTo(0, 0);
      enterFullscreen();
    }

    return () => {
      if (isIOS()) {
        document.removeEventListener('touchstart', preventZoom);
        document.removeEventListener('gesturestart', preventGesture);
        document.removeEventListener('gesturechange', preventGesture);
        document.removeEventListener('gestureend', preventGesture);
      }
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange', onFullscreenChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleOrientationChange);
      }
      window.removeEventListener('touchend', handleTouch);
    };
  }, []);
}
