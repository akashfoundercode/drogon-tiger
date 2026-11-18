export const isIOS = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

export const isIPhone = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /iPhone|iPod/.test(navigator.userAgent);
};

export const isMobileDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isMobileUA || isIPadOS;
};

export function isFullscreen() {
  if (typeof document === 'undefined') return false;
  // iOS standalone PWA (Home Screen Web App)
  if (typeof window !== 'undefined' && window.navigator?.standalone) {
    return true;
  }
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

export async function enterFullscreen(element = document.documentElement) {
  try {
    // Safari address bar minimization scroll trick
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 1);
      setTimeout(() => window.scrollTo(0, 0), 30);
    }

    if (isFullscreen()) return true;

    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      await element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      await element.msRequestFullscreen();
    }

    // Try locking to landscape if supported
    if (window.screen?.orientation?.lock) {
      try {
        await window.screen.orientation.lock('landscape');
      } catch {
        // Orientation lock not supported or permission denied
      }
    }
    return true;
  } catch (err) {
    console.debug('Fullscreen request deferred/failed:', err);
    return false;
  }
}

export async function exitFullscreen() {
  try {
    if (!isFullscreen()) return true;

    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      await document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      await document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      await document.msExitFullscreen();
    }

    if (window.screen?.orientation?.unlock) {
      try {
        window.screen.orientation.unlock();
      } catch {
        // Ignore unlock errors
      }
    }
    return true;
  } catch (err) {
    console.debug('Exit fullscreen failed:', err);
    return false;
  }
}

export function toggleFullscreen(element = document.documentElement) {
  if (isFullscreen()) {
    return exitFullscreen();
  }
  return enterFullscreen(element);
}
