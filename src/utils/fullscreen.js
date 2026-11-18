export function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

export async function enterFullscreen(element = document.documentElement) {
  try {
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

    // Try locking to landscape if supported (Android Chrome etc.)
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
