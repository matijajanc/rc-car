import { NativeModules, Platform } from 'react-native';

/**
 * Thin bridge to the Android-native DriveSession module
 * (android/.../DriveSessionModule.kt), which holds two locks while a drive
 * session is active:
 *
 *  - a Wi-Fi lock (WIFI_MODE_FULL_LOW_LATENCY, or FULL_HIGH_PERF before
 *    Android 10) so the radio never drops into power-save mid-session. Field
 *    logs showed the radio dozing during driving pauses and blacking the link
 *    out for 1-1.5s+ — this kills that at the source instead of trying to
 *    out-tune it with timeouts;
 *  - FLAG_KEEP_SCREEN_ON, because a screen timeout would background the app
 *    and (by design) stop the car mid-session.
 *
 * Everything is best-effort: on iOS, in tests, or if the native module is
 * missing (e.g. an APK built before it existed), these calls silently no-op —
 * the locks are an optimisation, never a safety dependency. Safety lives in
 * the firmware's motion lease.
 */
interface DriveSessionNative {
  acquire(): void;
  release(): void;
}

function nativeModule(): DriveSessionNative | null {
  if (Platform.OS !== 'android') {
    return null;
  }
  const mod = (NativeModules as Record<string, unknown>).DriveSession;
  return mod ? (mod as DriveSessionNative) : null;
}

export function acquireDriveLocks(): void {
  try {
    nativeModule()?.acquire();
  } catch {
    // Never let lock plumbing affect driving.
  }
}

export function releaseDriveLocks(): void {
  try {
    nativeModule()?.release();
  } catch {
    // Never let lock plumbing affect driving.
  }
}

export default { acquireDriveLocks, releaseDriveLocks };
