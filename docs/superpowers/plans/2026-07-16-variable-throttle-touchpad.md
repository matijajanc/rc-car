# Variable Throttle Touchpad Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two forward/reverse drive buttons with a left-side vertical touchpad that gives proportional forward throttle (finger position = speed) and a fixed-speed reverse, killing the full-throttle wheelspin on launch.

**Architecture:** Extend the absolute `dv` drive-state frame with a forward level (`dvfc80` = forward, centre, 80%). The app maps finger position → level through an expo curve (app-side, tunable), quantizes to 5% steps, and coalesces same-direction sends; the firmware maps the level linearly onto the ESC servo angle (idle 90° → `speedFactor`°). Spring-to-neutral and the motion lease are unchanged.

**Tech Stack:** TypeScript, React Native 0.86, react-native-gesture-handler v3 (no Reanimated → gesture callbacks run on the JS thread), shared `shared/protocol.ts`, Arduino C++, Jest (app: `@react-native/jest-preset`; backend: ts-jest).

## Global Constraints

- `MOTION_LEASE_MS = 600` in `shared/protocol.ts` is unchanged; the firmware's `motionLeaseMs` MUST stay equal to it.
- `MOTOR_TEMP_CUTOFF_C = 50` (`src/utils/gauges.ts`) MUST stay equal to the firmware's `criticalTemp`.
- Forward level range is `0–100`, quantized to `5` (`DRIVE_LEVEL_STEP`). The app NEVER emits a forward frame below one step — it sends neutral instead (a resting finger holds no lease; the first push is a genuine `n→f` press that overrides the front brake).
- Level `100` MUST map to the current `speedFactor` angle so full-slider reproduces today's single-speed top end.
- Monochrome design system: colour is reserved for the three gauges; red is reserved for the stop/brake alert. The touchpad is monochrome. Do NOT restyle the Speedometer/Battery/Motor gauges.
- App installs need `npm install --legacy-peer-deps`.
- The firmware drives a physical vehicle and owns the safety cutoffs; it has no in-repo build/flash toolchain. Its task is C++ edit + reasoning only here, then a human flashes and bench-tests it. The app and firmware must ship together.
- End every git commit message with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

## File Structure

- `shared/protocol.ts` — add `DRIVE_LEVEL_{MIN,MAX,STEP}`; extend `encodeDriveState` to append a forward level. (Single source of truth for both halves.)
- `src/utils/throttle-curve.ts` — **new**, pure. `positionToLevel` (expo + quantize) and `resolveThrottle` (touch-Y + pad-height → absolute throttle). Isolated so it is unit-testable with no RN imports.
- `src/utils/drive-state.ts` — track `forwardLevel`; direction changes send immediately, same-direction level changes coalesce; zero the level on suspend/stop.
- `src/components/DriveModeButtons/components/ThrottlePad/ThrottlePad.tsx` — **new** presentational touchpad (gesture + visual). Dumb: all math comes from `throttle-curve`.
- `src/components/DriveModeButtons/components/DriveModeButtons.tsx` — swap the two throttle buttons for `ThrottlePad`; steering buttons untouched.
- `src/components/DriveModeButtons/DriveModeButtonsContainer.tsx` — pass the level through; vibrate only on a direction transition.
- `src/components/DriveModeButtons/components/assets/styles/styles.js` — touchpad styles; drop the now-unused throttle-button styles.
- `arduino/rc-car/rc-car.ino` — `applyDriveState` gains the level and maps it to the ESC angle.
- `node_server/src/simulator.ts` — simulated speed scales with the forward level.
- Tests: `__tests__/protocol.test.ts`, `node_server/test/protocol.test.ts`, `__tests__/throttle-curve.test.ts` (new), `__tests__/drive-state.test.ts`, `node_server/test/simulator.test.ts`.
- Docs: `shared/protocol.ts` comments, `CLAUDE.md`, `ANDROID_UPGRADE.md`.

---

### Task 1: Protocol — forward level in `dv`

**Files:**
- Modify: `shared/protocol.ts`
- Test: `node_server/test/protocol.test.ts`, `__tests__/protocol.test.ts`

**Interfaces:**
- Produces: `DRIVE_LEVEL_MIN = 0`, `DRIVE_LEVEL_MAX = 100`, `DRIVE_LEVEL_STEP = 5`; `encodeDriveState(throttle: ThrottleState, steer: SteerState, level?: number): string` — appends the clamped integer level only when `throttle === 'f'` and `level` is provided (so `encodeDriveState('f','c')` still returns `'dvfc'`, `encodeDriveState('f','c',80)` returns `'dvfc80'`, reverse/neutral never carry a level).

- [ ] **Step 1: Write the failing backend test**

In `node_server/test/protocol.test.ts`, inside the existing `describe('drive state (dv)', ...)` block, add:

```ts
  it('appends a forward level and clamps it to 0..100', () => {
    expect(encodeDriveState(DRIVE_THROTTLE.FORWARD, DRIVE_STEER.CENTER, 80)).toBe('dvfc80');
    expect(encodeDriveState(DRIVE_THROTTLE.FORWARD, DRIVE_STEER.LEFT, 0)).toBe('dvfl0');
    expect(encodeDriveState(DRIVE_THROTTLE.FORWARD, DRIVE_STEER.CENTER, 130)).toBe('dvfc100');
    expect(encodeDriveState(DRIVE_THROTTLE.FORWARD, DRIVE_STEER.CENTER, -5)).toBe('dvfc0');
  });

  it('never appends a level to neutral or reverse', () => {
    expect(encodeDriveState(DRIVE_THROTTLE.NEUTRAL, DRIVE_STEER.CENTER, 80)).toBe('dvnc');
    expect(encodeDriveState(DRIVE_THROTTLE.REVERSE, DRIVE_STEER.RIGHT, 80)).toBe('dvbr');
  });

  it('omitting the level keeps the bare forward frame (back-compatible)', () => {
    expect(encodeDriveState(DRIVE_THROTTLE.FORWARD, DRIVE_STEER.CENTER)).toBe('dvfc');
  });

  it('exposes the level quantization constants', () => {
    expect([DRIVE_LEVEL_MIN, DRIVE_LEVEL_MAX, DRIVE_LEVEL_STEP]).toEqual([0, 100, 5]);
  });
```

Add `DRIVE_LEVEL_MIN, DRIVE_LEVEL_MAX, DRIVE_LEVEL_STEP` to that file's existing import from `../../shared/protocol`.

- [ ] **Step 2: Run it to verify it fails**

Run: `cd node_server && npx jest test/protocol.test.ts -t "forward level"`
Expected: FAIL — `encodeDriveState` currently ignores a third argument (returns `dvfc`, not `dvfc80`), and the constants are `undefined`.

- [ ] **Step 3: Implement in `shared/protocol.ts`**

Add the constants immediately after the `DRIVE_STEER` block (around line 81):

```ts
/**
 * Forward throttle magnitude carried by a 'dv' frame ("dvfc80" = forward,
 * centre, 80%). Only the FORWARD throttle carries a level; neutral and reverse
 * never do. The app quantizes to DRIVE_LEVEL_STEP and never emits a forward
 * frame below one step (it sends neutral instead — see src/utils/drive-state.ts).
 * The firmware maps 0..100 linearly onto the ESC angle 90 (idle) .. speedFactor.
 */
export const DRIVE_LEVEL_MIN = 0;
export const DRIVE_LEVEL_MAX = 100;
export const DRIVE_LEVEL_STEP = 5;
```

Replace `encodeDriveState` (currently lines 100-103) with:

```ts
/** Build the body of a drive-state command, e.g. ('f','c',80) -> 'dvfc80'. The
 * level is appended only for a FORWARD throttle and is clamped to 0..100; a
 * missing level (or any non-forward throttle) yields the bare frame, e.g.
 * ('n','l') -> 'dvnl'. */
export function encodeDriveState(throttle: ThrottleState, steer: SteerState, level?: number): string {
  const base = `${COMMAND_CODES.DRIVE_STATE}${throttle}${steer}`;
  if (throttle === DRIVE_THROTTLE.FORWARD && level !== undefined) {
    const clamped = Math.max(DRIVE_LEVEL_MIN, Math.min(DRIVE_LEVEL_MAX, Math.round(level)));
    return `${base}${clamped}`;
  }
  return base;
}
```

- [ ] **Step 4: Run the backend test to verify it passes**

Run: `cd node_server && npx jest test/protocol.test.ts`
Expected: PASS (all existing cases plus the four new ones).

- [ ] **Step 5: Mirror the app-side protocol test**

In `__tests__/protocol.test.ts`, add:

```ts
  it('appends a forward level only to forward frames', () => {
    expect(frameCommand(encodeDriveState(DRIVE_THROTTLE.FORWARD, DRIVE_STEER.CENTER, 80))).toBe(
      'dvfc80\n',
    );
    expect(frameCommand(encodeDriveState(DRIVE_THROTTLE.REVERSE, DRIVE_STEER.CENTER, 80))).toBe(
      'dvbc\n',
    );
  });
```

- [ ] **Step 6: Run the app protocol test + typecheck**

Run: `npx jest __tests__/protocol.test.ts` then `npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 7: Commit**

```bash
git add shared/protocol.ts node_server/test/protocol.test.ts __tests__/protocol.test.ts
git commit -m "feat(protocol): carry a forward throttle level in the dv frame

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Throttle curve + zone resolver (pure)

**Files:**
- Create: `src/utils/throttle-curve.ts`
- Test: `__tests__/throttle-curve.test.ts`

**Interfaces:**
- Consumes: `DRIVE_LEVEL_{MIN,MAX,STEP}`, `DRIVE_THROTTLE`, `ThrottleState` from `../../shared/protocol` (Task 1).
- Produces: `FORWARD_FRACTION = 0.75`, `DEADBAND_FRACTION = 0.03`, `THROTTLE_GAMMA = 1.6`; `positionToLevel(pos: number, gamma?: number): number` (0..100, multiple of 5); `resolveThrottle(y: number, height: number): { throttle: ThrottleState; level: number }`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/throttle-curve.test.ts`:

```ts
import { DRIVE_THROTTLE } from '../shared/protocol';
import {
  positionToLevel,
  resolveThrottle,
  FORWARD_FRACTION,
  DEADBAND_FRACTION,
} from '../src/utils/throttle-curve';

describe('positionToLevel', () => {
  it('maps the endpoints exactly', () => {
    expect(positionToLevel(0)).toBe(0);
    expect(positionToLevel(1)).toBe(100);
  });

  it('clamps out-of-range positions', () => {
    expect(positionToLevel(-1)).toBe(0);
    expect(positionToLevel(2)).toBe(100);
  });

  it('always returns a multiple of the 5% step', () => {
    for (let p = 0; p <= 1.0001; p += 0.05) {
      expect(positionToLevel(p) % 5).toBe(0);
    }
  });

  it('is monotonic non-decreasing', () => {
    let prev = -1;
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const lvl = positionToLevel(p);
      expect(lvl).toBeGreaterThanOrEqual(prev);
      prev = lvl;
    }
  });

  it('is sub-linear at the low end (gentle launch)', () => {
    // Expo curve: half travel yields well under half throttle.
    expect(positionToLevel(0.5)).toBeGreaterThan(0);
    expect(positionToLevel(0.5)).toBeLessThan(50);
  });
});

describe('resolveThrottle', () => {
  const H = 300; // px; neutral line at 0.75*H = 225, deadband +/- 9

  it('top of the pad is full forward', () => {
    expect(resolveThrottle(0, H)).toEqual({ throttle: DRIVE_THROTTLE.FORWARD, level: 100 });
  });

  it('the neutral band around the boundary is neutral', () => {
    expect(resolveThrottle(FORWARD_FRACTION * H, H).throttle).toBe(DRIVE_THROTTLE.NEUTRAL);
  });

  it('below the reverse boundary is fixed reverse', () => {
    expect(resolveThrottle(H, H)).toEqual({ throttle: DRIVE_THROTTLE.REVERSE, level: 0 });
  });

  it('a point inside the forward zone is proportional forward', () => {
    const res = resolveThrottle(150, H); // pos = (225-150)/225 = 0.333...
    expect(res.throttle).toBe(DRIVE_THROTTLE.FORWARD);
    expect(res.level).toBeGreaterThan(0);
    expect(res.level).toBeLessThan(100);
  });

  it('a zero height is treated as neutral', () => {
    expect(resolveThrottle(10, 0).throttle).toBe(DRIVE_THROTTLE.NEUTRAL);
  });

  it('exposes the layout fractions used by the pad visual', () => {
    expect([FORWARD_FRACTION, DEADBAND_FRACTION]).toEqual([0.75, 0.03]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest __tests__/throttle-curve.test.ts`
Expected: FAIL — module `src/utils/throttle-curve` does not exist.

- [ ] **Step 3: Implement `src/utils/throttle-curve.ts`**

```ts
/**
 * Pure throttle math for the drive touchpad (no React Native imports, so it is
 * unit-testable). Turns a finger position into an absolute throttle command.
 */
import {
  DRIVE_LEVEL_MAX,
  DRIVE_LEVEL_MIN,
  DRIVE_LEVEL_STEP,
  DRIVE_THROTTLE,
} from '../../shared/protocol';
import type { ThrottleState } from '../../shared/protocol';

/** Top fraction of the pad used for (variable) forward; the rest is reverse. */
export const FORWARD_FRACTION = 0.75;
/** Neutral deadband straddling the boundary, as a fraction of pad height. */
export const DEADBAND_FRACTION = 0.03;
/**
 * Expo exponent (>1 = extra-fine control at the low end, which is what makes
 * launches gentle). Bench-tunable; positionToLevel is the only consumer.
 */
export const THROTTLE_GAMMA = 1.6;

/** Map a forward-zone position in [0,1] to a quantized throttle level [0,100]. */
export function positionToLevel(pos: number, gamma: number = THROTTLE_GAMMA): number {
  const clamped = Math.min(1, Math.max(0, pos));
  const curved = Math.pow(clamped, gamma) * DRIVE_LEVEL_MAX;
  const stepped = Math.round(curved / DRIVE_LEVEL_STEP) * DRIVE_LEVEL_STEP;
  return Math.min(DRIVE_LEVEL_MAX, Math.max(DRIVE_LEVEL_MIN, stepped));
}

export interface ThrottleResolution {
  throttle: ThrottleState;
  /** Forward level 0..100; 0 for neutral and reverse. */
  level: number;
}

/**
 * Resolve a touch Y (points; 0 = top of the pad) and the pad height into an
 * absolute throttle: top FORWARD_FRACTION = variable forward, the bottom =
 * fixed reverse, with a DEADBAND_FRACTION neutral band at the boundary.
 */
export function resolveThrottle(y: number, height: number): ThrottleResolution {
  if (height <= 0) {
    return { throttle: DRIVE_THROTTLE.NEUTRAL, level: 0 };
  }
  const cy = Math.min(height, Math.max(0, y));
  const neutralY = FORWARD_FRACTION * height;
  const dead = DEADBAND_FRACTION * height;
  if (cy < neutralY - dead) {
    return { throttle: DRIVE_THROTTLE.FORWARD, level: positionToLevel((neutralY - cy) / neutralY) };
  }
  if (cy > neutralY + dead) {
    return { throttle: DRIVE_THROTTLE.REVERSE, level: 0 };
  }
  return { throttle: DRIVE_THROTTLE.NEUTRAL, level: 0 };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest __tests__/throttle-curve.test.ts` then `npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add src/utils/throttle-curve.ts __tests__/throttle-curve.test.ts
git commit -m "feat(app): pure throttle curve + touchpad zone resolver

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Drive-state sender — level + coalescing

**Files:**
- Modify: `src/utils/drive-state.ts`
- Test: `__tests__/drive-state.test.ts`

**Interfaces:**
- Consumes: `encodeDriveState`, `DRIVE_LEVEL_{MIN,MAX,STEP}` (Task 1).
- Produces: `setThrottle(next: ThrottleState, level?: number): void` (forward below one step is coerced to neutral; direction changes send immediately, same-direction level changes coalesce to `SEND_MIN_INTERVAL_MS = 60`). `setSteer`, `startDriveSession`, `stopDriveSession` signatures unchanged.

- [ ] **Step 1: Update the existing tests to the new forward frames and add the new behaviours**

In `__tests__/drive-state.test.ts`: (a) add `DRIVE_THROTTLE`/`DRIVE_STEER` are already imported; import nothing new. (b) Replace the two tests below and append four new ones.

Replace `it('sends a state change immediately, then refreshes it every 150ms while engaged', ...)` with:

```ts
  it('sends a forward level immediately, then refreshes it every 150ms while engaged', () => {
    startDriveSession();
    mockSend.mockClear();

    setThrottle(DRIVE_THROTTLE.FORWARD, 80);
    expect(sentFrames()).toEqual(['dvfc80']); // immediate (direction change)

    jest.advanceTimersByTime(460); // heartbeats at 150/300/450 re-assert
    expect(sentFrames()).toEqual(['dvfc80', 'dvfc80', 'dvfc80', 'dvfc80']);
  });
```

Replace `it('combines throttle and steering into one absolute state', ...)` with:

```ts
  it('combines throttle+level and steering into one absolute state', () => {
    startDriveSession();
    mockSend.mockClear();
    setThrottle(DRIVE_THROTTLE.FORWARD, 80);
    setSteer(DRIVE_STEER.LEFT);
    expect(sentFrames()).toEqual(['dvfc80', 'dvfl80']);
  });
```

Update `it('backgrounding zeroes the state, sends one stop, and stops streaming', ...)`: change the two `setThrottle(DRIVE_THROTTLE.FORWARD)` calls to `setThrottle(DRIVE_THROTTLE.FORWARD, 80)`.

Update `it('drops to the slow idle tick once everything is released', ...)`: change `setThrottle(DRIVE_THROTTLE.FORWARD);` to `setThrottle(DRIVE_THROTTLE.FORWARD, 80);` (the release to neutral and assertions are unchanged).

Append these new tests inside the `describe`:

```ts
  it('coalesces rapid same-direction level changes', () => {
    startDriveSession();
    mockSend.mockClear();

    setThrottle(DRIVE_THROTTLE.FORWARD, 10); // immediate (direction change)
    jest.advanceTimersByTime(20);
    setThrottle(DRIVE_THROTTLE.FORWARD, 35); // +20ms < 60ms -> coalesced
    jest.advanceTimersByTime(20);
    setThrottle(DRIVE_THROTTLE.FORWARD, 55); // +40ms < 60ms -> coalesced
    expect(sentFrames()).toEqual(['dvfc10']);

    jest.advanceTimersByTime(40); // t=80ms, still before the 150ms heartbeat
    setThrottle(DRIVE_THROTTLE.FORWARD, 60); // >=60ms since last send -> sends
    expect(sentFrames()).toEqual(['dvfc10', 'dvfc60']);
  });

  it('the 150ms heartbeat re-asserts the latest coalesced level', () => {
    startDriveSession();
    mockSend.mockClear();

    setThrottle(DRIVE_THROTTLE.FORWARD, 10); // immediate
    jest.advanceTimersByTime(20);
    setThrottle(DRIVE_THROTTLE.FORWARD, 35); // coalesced (dropped)
    jest.advanceTimersByTime(130); // t=150ms -> heartbeat asserts current state
    expect(sentFrames()).toEqual(['dvfc10', 'dvfc35']);
  });

  it('a release to neutral is sent immediately, even inside the coalescing window', () => {
    startDriveSession();
    setThrottle(DRIVE_THROTTLE.FORWARD, 50);
    mockSend.mockClear();
    setThrottle(DRIVE_THROTTLE.NEUTRAL); // direction change -> immediate
    expect(sentFrames()).toEqual(['dvnc']);
  });

  it('treats a forward level below one step as neutral', () => {
    startDriveSession();
    setThrottle(DRIVE_THROTTLE.FORWARD, 40); // dvfc40
    mockSend.mockClear();
    setThrottle(DRIVE_THROTTLE.FORWARD, 2); // below DRIVE_LEVEL_STEP -> coasts to neutral
    expect(sentFrames()).toEqual(['dvnc']);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest __tests__/drive-state.test.ts`
Expected: FAIL — `setThrottle` ignores the level argument (sends `dvfc`, not `dvfc80`), and there is no coalescing.

- [ ] **Step 3: Rewrite `src/utils/drive-state.ts`**

Replace the whole file with:

```ts
import { AppState } from 'react-native';
import type { AppStateStatus, NativeEventSubscription } from 'react-native';
import {
  COMMAND_CODES,
  DRIVE_LEVEL_MAX,
  DRIVE_LEVEL_MIN,
  DRIVE_LEVEL_STEP,
  DRIVE_STATE_ACTIVE_REFRESH_MS,
  DRIVE_STATE_IDLE_REFRESH_MS,
  DRIVE_STEER,
  DRIVE_THROTTLE,
  encodeDriveState,
} from '../../shared/protocol';
import type { SteerState, ThrottleState } from '../../shared/protocol';
import { send } from './transmitter';
import { acquireDriveLocks, releaseDriveLocks } from './drive-locks';

/**
 * The app side of the "motion lease" — the drive session. Streams the ABSOLUTE
 * drive state (throttle f/n/b + forward level 0..100 + steering l/c/r) as a `dv`
 * frame: immediately on a direction change, coalesced (>= SEND_MIN_INTERVAL_MS)
 * on same-direction level changes, re-asserted every 150ms while engaged, and
 * once a second while idle. The firmware honours a non-neutral throttle only for
 * ~600ms since the last frame, so a lost frame self-corrects on the next one.
 *
 * A resting finger sends neutral (a forward level below one step is coerced to
 * neutral), so it holds no lease and the first real push is an n->f press.
 */

// Same-direction forward level changes send at most this often; a skipped one is
// re-asserted by the 150ms heartbeat. Direction changes always send immediately.
const SEND_MIN_INTERVAL_MS = 60;

let throttle: ThrottleState = DRIVE_THROTTLE.NEUTRAL;
let steer: SteerState = DRIVE_STEER.CENTER;
let forwardLevel = 0; // 0..100, meaningful only while throttle is FORWARD
let ticker: ReturnType<typeof setInterval> | null = null;
let appStateSub: NativeEventSubscription | null = null;
let lastSentAt = 0;
let suspended = false;

function engaged(): boolean {
  return throttle !== DRIVE_THROTTLE.NEUTRAL || steer !== DRIVE_STEER.CENTER;
}

function transmit(): void {
  lastSentAt = Date.now();
  send(encodeDriveState(throttle, steer, throttle === DRIVE_THROTTLE.FORWARD ? forwardLevel : undefined));
}

/** Same-direction level change: send now only if the min interval has elapsed;
 * otherwise the heartbeat re-asserts the latest state within one refresh. */
function transmitCoalesced(): void {
  if (Date.now() - lastSentAt >= SEND_MIN_INTERVAL_MS) {
    transmit();
  }
}

/** One ticker beat: re-assert the state at the cadence the situation needs. */
function tick(): void {
  if (suspended) {
    return;
  }
  const cadence = engaged() ? DRIVE_STATE_ACTIVE_REFRESH_MS : DRIVE_STATE_IDLE_REFRESH_MS;
  if (Date.now() - lastSentAt >= cadence) {
    transmit();
  }
}

function handleAppState(state: AppStateStatus): void {
  if (state === 'background') {
    throttle = DRIVE_THROTTLE.NEUTRAL;
    steer = DRIVE_STEER.CENTER;
    forwardLevel = 0;
    send(COMMAND_CODES.STOP);
    suspended = true;
    return;
  }
  if (state === 'active') {
    suspended = false;
  }
}

/**
 * Update the desired throttle (+ forward level 0..100). Forward below one
 * quantization step is coerced to neutral. Direction changes send immediately;
 * same-direction level changes are coalesced. Input while suspended is dropped.
 */
export function setThrottle(next: ThrottleState, level = 0): void {
  if (suspended) {
    return;
  }
  let t = next;
  let lvl = 0;
  if (t === DRIVE_THROTTLE.FORWARD) {
    lvl = Math.max(DRIVE_LEVEL_MIN, Math.min(DRIVE_LEVEL_MAX, Math.round(level)));
    if (lvl < DRIVE_LEVEL_STEP) {
      t = DRIVE_THROTTLE.NEUTRAL;
      lvl = 0;
    }
  }
  if (t === throttle && lvl === forwardLevel) {
    return;
  }
  const directionChanged = t !== throttle;
  throttle = t;
  forwardLevel = lvl;
  if (directionChanged) {
    transmit();
  } else {
    transmitCoalesced();
  }
}

/** Update the desired steering. Sends immediately when it changes. */
export function setSteer(next: SteerState): void {
  if (suspended || next === steer) {
    return;
  }
  steer = next;
  transmit();
}

/** Begin a drive session: assert neutral, start the ticker, watch backgrounding,
 * hold the native locks. Idempotent. */
export function startDriveSession(): void {
  if (ticker) {
    return;
  }
  throttle = DRIVE_THROTTLE.NEUTRAL;
  steer = DRIVE_STEER.CENTER;
  forwardLevel = 0;
  suspended = false;
  transmit();
  ticker = setInterval(tick, DRIVE_STATE_ACTIVE_REFRESH_MS);
  appStateSub = AppState.addEventListener('change', handleAppState);
  acquireDriveLocks();
}

/** End the drive session: stop the ticker, release the locks, and send one stop. */
export function stopDriveSession(): void {
  if (!ticker) {
    return;
  }
  clearInterval(ticker);
  ticker = null;
  appStateSub?.remove();
  appStateSub = null;
  throttle = DRIVE_THROTTLE.NEUTRAL;
  steer = DRIVE_STEER.CENTER;
  forwardLevel = 0;
  send(COMMAND_CODES.STOP);
  releaseDriveLocks();
}

export default { setThrottle, setSteer, startDriveSession, stopDriveSession };
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest __tests__/drive-state.test.ts` then `npm run typecheck`
Expected: PASS (all existing + new); typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add src/utils/drive-state.ts __tests__/drive-state.test.ts
git commit -m "feat(app): stream a forward throttle level with coalesced sends

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: ThrottlePad component + styles

**Files:**
- Create: `src/components/DriveModeButtons/components/ThrottlePad/ThrottlePad.tsx`
- Modify: `src/components/DriveModeButtons/components/assets/styles/styles.js`

**Interfaces:**
- Consumes: `resolveThrottle`, `FORWARD_FRACTION` (Task 2); `DRIVE_THROTTLE`, `ThrottleState` (protocol).
- Produces: `ThrottlePad` — default export, props `{ onThrottle: (throttle: ThrottleState, level?: number) => void }`. Reports `onThrottle` on gesture begin/update and neutral on finalize.

Note: no automated test — this is presentational glue; all math is covered by Task 2. It is verified in the app run (Task 9). Gesture callbacks call JS directly (no `runOnJS`), matching the existing `DriveButton` (Reanimated is not a dependency).

- [ ] **Step 1: Add the styles**

In `src/components/DriveModeButtons/components/assets/styles/styles.js`, delete the `upDownBox` and `bottomSpace` entries (only the throttle buttons used them; steering keeps `button`/`buttonActive`/`btnLeft`). Add these entries to the `StyleSheet.create({...})` object:

```js
  throttlePad: {
    position: 'absolute',
    // Same 40px inset as the old throttle buttons — clears the landscape
    // edge-swipe (back) gesture zone.
    left: 40,
    top: 15,
    bottom: 15,
    width: 96,
    zIndex: 2,
  },
  throttleInner: {
    flex: 1,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  // Top 3/4 = variable forward; the fill grows up from the neutral line.
  forwardZone: {
    flex: 3,
    justifyContent: 'flex-end',
  },
  forwardFill: {
    width: '100%',
    backgroundColor: colors.accentGlow,
    borderTopWidth: 2,
    borderTopColor: colors.accent,
  },
  neutralLine: {
    height: 2,
    backgroundColor: colors.accentBorder,
  },
  // Bottom 1/4 = fixed reverse.
  reverseZone: {
    flex: 1,
  },
  reverseFill: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  padReadout: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
  },
  padReadoutActive: {
    color: colors.accent,
  },
```

- [ ] **Step 2: Create the component**

Create `src/components/DriveModeButtons/components/ThrottlePad/ThrottlePad.tsx`:

```tsx
import React, { useMemo, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { DRIVE_THROTTLE } from '../../../../../shared/protocol';
import type { ThrottleState } from '../../../../../shared/protocol';
import { resolveThrottle } from '../../../../utils/throttle-curve';
import styles from '../assets/styles/styles';

interface Props {
  onThrottle: (throttle: ThrottleState, level?: number) => void;
}

interface PadState {
  throttle: ThrottleState;
  level: number;
}

/**
 * Vertical throttle touchpad. The finger's Y position sets an absolute throttle:
 * top 3/4 = variable forward, bottom 1/4 = fixed reverse, boundary = neutral.
 * Releasing coasts to neutral (spring-loaded), so the car moves only while held.
 *
 * Built on react-native-gesture-handler Pan (like DriveButton) so it recognises
 * the gesture on the native thread and coexists with a held steer button.
 * minDistance(0) activates immediately; onBegin gives the touch-down position,
 * onUpdate tracks movement, onFinalize (paired with onBegin) reports release.
 */
const ThrottlePad = ({ onThrottle }: Props): React.JSX.Element => {
  const heightRef = useRef(0);
  const [pad, setPad] = useState<PadState>({ throttle: DRIVE_THROTTLE.NEUTRAL, level: 0 });

  const apply = (y: number): void => {
    const res = resolveThrottle(y, heightRef.current);
    onThrottle(res.throttle, res.level);
    setPad(res);
  };
  const release = (): void => {
    onThrottle(DRIVE_THROTTLE.NEUTRAL, 0);
    setPad({ throttle: DRIVE_THROTTLE.NEUTRAL, level: 0 });
  };

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .shouldCancelWhenOutside(false)
        .onBegin((e) => apply(e.y))
        .onUpdate((e) => apply(e.y))
        .onFinalize(() => release()),
    [],
  );

  const onLayout = (e: LayoutChangeEvent): void => {
    heightRef.current = e.nativeEvent.layout.height;
  };

  const forward = pad.throttle === DRIVE_THROTTLE.FORWARD;
  const reverse = pad.throttle === DRIVE_THROTTLE.REVERSE;
  const label = forward ? `Forward · ${pad.level}%` : reverse ? 'Reverse' : 'Idle · 0%';

  return (
    <View style={styles.throttlePad}>
      <GestureDetector gesture={gesture}>
        <View style={styles.throttleInner} onLayout={onLayout}>
          <View style={styles.forwardZone}>
            {forward && <View style={[styles.forwardFill, { height: `${pad.level}%` }]} />}
          </View>
          <View style={styles.neutralLine} />
          <View style={styles.reverseZone}>{reverse && <View style={styles.reverseFill} />}</View>
          <Text style={[styles.padReadout, (forward || reverse) && styles.padReadoutActive]}>
            {label}
          </Text>
        </View>
      </GestureDetector>
    </View>
  );
};

export default ThrottlePad;
```

- [ ] **Step 3: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: typecheck clean; no new lint errors in the two files.

- [ ] **Step 4: Commit**

```bash
git add src/components/DriveModeButtons/components/ThrottlePad/ThrottlePad.tsx src/components/DriveModeButtons/components/assets/styles/styles.js
git commit -m "feat(app): throttle touchpad component + styles

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Wire the touchpad into the dashboard

**Files:**
- Modify: `src/components/DriveModeButtons/components/DriveModeButtons.tsx`
- Modify: `src/components/DriveModeButtons/DriveModeButtonsContainer.tsx`

**Interfaces:**
- Consumes: `ThrottlePad` (Task 4); `setThrottle` (Task 3).
- Produces: `DriveModeButtons` prop `onThrottle: (throttle: ThrottleState, level?: number) => void`.

- [ ] **Step 1: Swap the throttle buttons for the pad in `DriveModeButtons.tsx`**

Replace the `import` of `DriveButton`/`ArrowIcon` region and the `upDownBox` block. Specifically:

Change the props interface + imports at the top so `DRIVE_THROTTLE` is dropped (no longer referenced here) and `ThrottlePad` is imported:

```tsx
import React from 'react';
import { View, StatusBar } from 'react-native';
import { DRIVE_STEER } from '../../../../shared/protocol';
import type { SteerState, ThrottleState } from '../../../../shared/protocol';
import styles from './assets/styles/styles';
import SpeedometerContainer from '../../Speedometer/SpeedometerContainer';
import BatteryLevelContainer from '../../BatteryLevel/BatteryLevelContainer';
import MotorTemperatureContainer from '../../MotorTemperature/MotorTemperatureContainer';
import DriveButton from './DriveButton/DriveButton';
import ArrowIcon from './DriveButton/Arrow-icon';
import ThrottlePad from './ThrottlePad/ThrottlePad';
import CarAlert from './CarAlert';

interface Props {
  /** Reports the desired throttle; forward carries a 0..100 level. */
  onThrottle: (throttle: ThrottleState, level?: number) => void;
  onSteer: (steer: SteerState) => void;
  navigate: (route: string) => void;
}
```

Replace the `<View style={styles.upDownBox}> ... </View>` block (the two throttle `DriveButton`s) with:

```tsx
    <ThrottlePad onThrottle={onThrottle} />
```

Leave the `leftRightBox` steering `DriveButton`s and the center gauges exactly as they are.

- [ ] **Step 2: Pass the level through + vibrate on direction change in `DriveModeButtonsContainer.tsx`**

Replace the file body with:

```tsx
import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Orientation from 'react-native-orientation-locker';
import { DRIVE_STEER, DRIVE_THROTTLE } from '../../../shared/protocol';
import type { SteerState, ThrottleState } from '../../../shared/protocol';
import {
  setSteer,
  setThrottle,
  startDriveSession,
  stopDriveSession,
} from '../../utils/drive-state';
import { vibrate } from '../../utils/vibrate';
import Container from '../Common/Container/ContainerComponent';
import DriveModeButtons from './components/DriveModeButtons';
import type { RootStackParamList } from '../../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DriveModeButtonsContainer(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  // Last throttle DIRECTION, so we buzz once on entering forward/reverse rather
  // than on every level change during a continuous drag.
  const prevThrottle = useRef<ThrottleState>(DRIVE_THROTTLE.NEUTRAL);

  useEffect(() => {
    Orientation.lockToLandscape();
    startDriveSession();
    return () => {
      stopDriveSession();
      Orientation.lockToPortrait();
    };
  }, []);

  const onThrottle = (t: ThrottleState, level = 0): void => {
    setThrottle(t, level);
    if (t !== prevThrottle.current && t !== DRIVE_THROTTLE.NEUTRAL) {
      vibrate();
    }
    prevThrottle.current = t;
  };

  const onSteer = (s: SteerState): void => {
    setSteer(s);
    if (s !== DRIVE_STEER.CENTER) {
      vibrate();
    }
  };

  return (
    <Container>
      <DriveModeButtons
        onThrottle={onThrottle}
        onSteer={onSteer}
        navigate={(route: string) => navigation.navigate(route as never)}
      />
    </Container>
  );
}
```

- [ ] **Step 3: Typecheck, lint, and run the app test suite**

Run: `npm run typecheck && npm run lint && npm test`
Expected: typecheck clean; no new lint errors; all Jest suites pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/DriveModeButtons/components/DriveModeButtons.tsx src/components/DriveModeButtons/DriveModeButtonsContainer.tsx
git commit -m "feat(app): drive with the throttle touchpad instead of buttons

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Firmware — map the level onto the ESC angle

**Files:**
- Modify: `arduino/rc-car/rc-car.ino`

**Interfaces:**
- Consumes: the `dvfc80` wire format (Task 1).
- Produces: nothing consumed by other tasks (device firmware).

Note: there is no in-repo compiler/flasher. This task is an edit + careful reasoning; verification is the on-hardware bench test in Step 5. Do NOT claim it works from code alone.

- [ ] **Step 1: Parse the level in `handleCommand`**

Replace the `dv` branch (currently around lines 269-274):

```cpp
  if (strncmp(line, "dv", 2) == 0) {
    if (line[2] != '\0' && line[3] != '\0') {
      applyDriveState(line[2], line[3], atoi(line + 4));
    }
    return;
  }
```

(`atoi(line + 4)` is 0 for a bare `dvnc`/`dvbc`/`dvfc`, and the forward level otherwise.)

- [ ] **Step 2: Give `applyDriveState` the level and map it to the ESC angle**

Change the signature and the forward branch. Replace the function header line:

```cpp
void applyDriveState(char throttle, char steer, int level) {
```

Immediately after the existing validation `return;` guard (the `if ((throttle != 'f' ...` block), add the clamp:

```cpp
  if (level < 0) level = 0;
  if (level > 100) level = 100;
```

Replace the forward branch (currently `if (throttle == 'f') { ... driveSrv.write(speedFactor); ... }`) with:

```cpp
  if (throttle == 'f') {
    // Map the 0..100 forward level onto the ESC servo range: 90 (idle) up to
    // speedFactor (the app's "max speed" setting). level 100 == the old
    // single-speed behaviour. A FRESH forward press still overrides an engaged
    // front-obstacle brake; a mere level change while already forward does not.
    int angle = 90 + (int)((long)(speedFactor - 90) * level / 100);
    if (throttleChanged || preventNeutral == 0) {
      driveSrv.write(angle);
      preventNeutral = 0;
      preventBackward = 0;
    }
    digitalWrite(stopLED, LOW);
  } else if (throttle == 'b') {
```

Leave the reverse (`else if (throttle == 'b')`) and neutral (`else`) branches, the hazards/steering/underglow code, and everything else unchanged.

- [ ] **Step 3: Update the firmware header comment**

In the top banner comment, change the safety-model line that reads `("dv<throttle><steer>", throttle f/n/b, steer l/c/r)` to note the forward level, e.g. append: ` Forward frames carry a 0..100 level ("dvfc80") mapped onto the ESC angle 90..speedFactor.` Keep the rest of the comment intact.

- [ ] **Step 4: Sanity-check the arithmetic (no toolchain — reason it through)**

Confirm by hand: with `speedFactor = 120`, `level 0 → 90`, `level 50 → 90 + 30*50/100 = 105`, `level 100 → 120`. With `speedFactor = 165`, `level 100 → 165`. The `(long)` cast prevents overflow (max intermediate `75 * 100 = 7500`, well within range). There is no automated test to run.

- [ ] **Step 5: Commit (firmware bench test is a separate, human, on-hardware step)**

```bash
git add arduino/rc-car/rc-car.ino
git commit -m "feat(arduino): map the dv forward level onto the ESC angle

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

**On-hardware bench checklist (human, after flashing — the car drives; do it wheels-up first):**
- Gentle launch: a slow finger creep produces a slow crawl, no wheelspin.
- Full slider == prior top speed at the same Speed (`sf`) setting.
- A lower Speed setting makes even full slider gentle.
- Reverse (bottom zone) still works at the fixed slow speed.
- Release coasts to neutral; leaving the drive screen / backgrounding stops the car.
- Every cutoff still stops the car: motion-lease expiry (stop refreshing), motor-temp cutoff, front-obstacle brake, back-obstacle reverse block.
- A fresh forward press overrides an engaged front-obstacle brake.

---

### Task 7: Simulator — proportional speed from the level

**Files:**
- Modify: `node_server/src/simulator.ts`
- Test: `node_server/test/simulator.test.ts`

**Interfaces:**
- Consumes: the `dvfc80` wire format (Task 1).
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Update the simulator tests to the level frames + add a proportional-speed test**

In `node_server/test/simulator.test.ts`:

In `describe('simulator command logging', ...)`, change the three `sim.write('dvfc\n')` lines to `sim.write('dvfc80\n')` and the two assertions from `'<- dvfc'` / `'<- dvfc'` to `'<- dvfc80'` (the `dvnc` release assertion is unchanged).

In `describe('simulator motion lease', ...)`, change every `sim.write('dvfc\n')` to `sim.write('dvfc80\n')` (the `dvzz` garbage frame and all assertions stay as they are).

Append a new describe block at the end of the file:

```ts
describe('simulator proportional speed', () => {
  const quiet = {
    batteryIntervalMs: 1e7,
    tempIntervalMs: 1e7,
    rangeProblemIntervalMs: 0,
    logger: () => {},
  };
  afterEach(() => jest.useRealTimers());

  const steadySpeed = (frame: string, level: number): number => {
    jest.useFakeTimers();
    const frames: string[] = [];
    const sim = new CarSimulator({ ...quiet, speedIntervalMs: 100 });
    sim.onData((c) => frames.push(c));
    void sim.open();
    for (let i = 0; i < 12; i += 1) {
      sim.write(frame);
      jest.advanceTimersByTime(100);
    }
    const last = frames.filter((f) => f.startsWith('sp')).pop() ?? 'sp0X';
    void sim.close();
    return Number(last.replace('sp', '').replace('X', ''));
  };

  it('holds a higher steady speed at a higher forward level', () => {
    const low = steadySpeed('dvfc20\n', 20);
    const high = steadySpeed('dvfc100\n', 100);
    expect(high).toBeGreaterThan(low);
  });
});
```

- [ ] **Step 2: Run the tests to verify the new one fails**

Run: `cd node_server && npx jest test/simulator.test.ts -t "proportional"`
Expected: FAIL — the simulator ignores the level, so low and high steady speeds are equal.

- [ ] **Step 3: Implement the proportional model in `node_server/src/simulator.ts`**

Add a field beside `private throttle` (around line 72):

```ts
  private forwardLevel = 0;
```

In `handleCommand`, replace the `DRIVE_STATE` case body with:

```ts
      case COMMAND_CODES.DRIVE_STATE: {
        // "dv<throttle><steer>[level]" — accept only well-formed frames, like
        // the firmware (garbage must never extend the motion lease).
        const throttle = command[2];
        if (
          throttle === DRIVE_THROTTLE.FORWARD ||
          throttle === DRIVE_THROTTLE.NEUTRAL ||
          throttle === DRIVE_THROTTLE.REVERSE
        ) {
          this.throttle = throttle;
          this.forwardLevel =
            throttle === DRIVE_THROTTLE.FORWARD
              ? Math.max(0, Math.min(100, parseInt(command.slice(4), 10) || 0))
              : 0;
          this.lastDriveStateAt = this.now();
        }
        break;
      }
```

In the `STOP` case, add `this.forwardLevel = 0;` alongside the existing resets.

Replace the vehicle-model block in `emitSpeed` (the `if (this.throttle === DRIVE_THROTTLE.FORWARD) { ... } else if ... else ...`) with:

```ts
    // Crude vehicle model: ramp toward a target speed set by the throttle. The
    // forward target scales with the 0..100 level (0 km/h .. ~45 km/h).
    if (this.throttle === DRIVE_THROTTLE.FORWARD) {
      const target = Math.round((this.forwardLevel / 100) * 45);
      this.speed =
        this.speed < target
          ? Math.min(target, this.speed + 8)
          : Math.max(target, this.speed - 8);
    } else if (this.throttle === DRIVE_THROTTLE.REVERSE) {
      this.speed = Math.min(15, this.speed + 5);
    } else {
      this.speed = Math.max(0, this.speed - 15);
    }
```

- [ ] **Step 4: Run the simulator + full backend suite**

Run: `cd node_server && npx jest test/simulator.test.ts && npm test && npm run typecheck`
Expected: PASS (updated + new tests); typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add node_server/src/simulator.ts node_server/test/simulator.test.ts
git commit -m "feat(sim): scale virtual car speed with the forward level

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Documentation

**Files:**
- Modify: `shared/protocol.ts` (DRIVE_STATE doc comment)
- Modify: `CLAUDE.md`
- Modify: `ANDROID_UPGRADE.md`

**Interfaces:** none (docs only).

- [ ] **Step 1: Update the `DRIVE_STATE` comment in `shared/protocol.ts`**

In the `DRIVE_STATE` doc comment (around lines 30-42), add a sentence noting the forward level: `Forward frames also carry a 0..100 magnitude ("dvfc80"); neutral and reverse never do. See DRIVE_LEVEL_* and {@link encodeDriveState}.` Keep the motion-lease description intact.

- [ ] **Step 2: Update `CLAUDE.md`**

In the protocol section, change the `dv` bullet to describe the forward level, e.g.:
`dv drive state (absolute "<throttle><steer>[level]", e.g. dvfc80 = forward at 80% + straight; forward carries a 0..100 magnitude, neutral/reverse do not — see DRIVE_LEVEL_* and "Motion lease")`.

In the drive-controls / motion-lease paragraph, note that the two forward/reverse buttons were replaced by a left-side throttle touchpad (`ThrottlePad`) giving proportional forward and fixed reverse; the finger position maps through an app-side expo curve (`src/utils/throttle-curve.ts`), quantized to 5% steps, with same-direction sends coalesced (`SEND_MIN_INTERVAL_MS`). Steering is still the two RNGH buttons. Note that the firmware maps the level linearly onto the ESC angle (90 → `speedFactor`), so the Speed (`sf`) screen is now the max-speed ceiling.

- [ ] **Step 3: Update `ANDROID_UPGRADE.md`**

Add a short note (a new subsection or a line in the drive-controls section) recording the `dv` forward-level extension and the throttle touchpad replacing the throttle buttons, cross-referencing this plan and the design spec.

- [ ] **Step 4: Verify the docs build nothing but read correctly**

Run: `npm run typecheck` (confirms the `shared/protocol.ts` comment edit didn't break anything).
Expected: PASS. Re-read each edited section to confirm accuracy.

- [ ] **Step 5: Commit**

```bash
git add shared/protocol.ts CLAUDE.md ANDROID_UPGRADE.md
git commit -m "docs: variable throttle touchpad + dv forward level

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: End-to-end verification (JS stack, no hardware)

**Files:** none (verification only).

- [ ] **Step 1: Full app gate**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass; no new lint errors.

- [ ] **Step 2: Full backend gate**

Run: `cd node_server && npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 3: Drive the real app against the simulator**

Follow the project `verify`/`run` skill (or `redesign-preview-workflow` for a native-free UI check). Start the bridge in simulate mode (`cd node_server && npm run dev`), run the app, open the drive screen, and confirm: dragging the touchpad shows proportional forward + live fill, the boundary is neutral, the bottom quarter is reverse, release coasts to neutral, and the simulated speedometer tracks the level. Capture the observation in the completion notes.

- [ ] **Step 4: Hand off the firmware bench test**

Remind the user that Task 6's on-hardware bench checklist still has to be run on the car after flashing, and that the app and firmware must ship together.

---

## Self-Review

**Spec coverage:**
- Variable forward, position=speed → Tasks 1 (level), 2 (curve/resolver), 4 (pad), 6 (firmware map). ✓
- Fixed reverse → Task 2 (reverse zone, level 0), 6 (unchanged reverse branch). ✓
- Spring-loaded to neutral → Task 4 (`onFinalize`→neutral), 3 (release/suspend zeroes level). ✓
- Touchpad (not thumb) → Task 4. ✓
- `sf` = max-speed ceiling → Task 6 (angle map to `speedFactor`), 8 (docs); Speed screen copy already says "MAX SPEED", so no UI change needed (noted). ✓
- Expo curve app-side → Task 2 (`positionToLevel`, `THROTTLE_GAMMA`). ✓
- Level 0–100 step 5 → Task 1 constants; enforced in Tasks 2, 3. ✓
- Level 0/deadband = neutral → Task 2 (deadband), Task 3 (forward-below-step coercion). ✓
- Coalesced sends ≤ ~60ms + 150ms heartbeat → Task 3. ✓
- Simulator proportional → Task 7. ✓
- Safety invariants (lease timing unchanged, malformed clamped, cutoffs force neutral, fresh-press overrides brake) → Tasks 1/3 (clamp, immediate release), 6 (firmware preserves brake-override + clamp + unchanged lease). ✓
- Tests: protocol, curve, drive-state, simulator → Tasks 1, 2, 3, 7. ✓
- Firmware flashed + bench-tested; ships with app → Task 6 checklist, Task 9 Step 4. ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code; the firmware task honestly has no automated test (device code) and states so. ✓

**Type consistency:** `encodeDriveState(throttle, steer, level?)`, `positionToLevel(pos, gamma?)`, `resolveThrottle(y, height)`, `setThrottle(next, level?)`, `onThrottle(throttle, level?)`, `ThrottlePad {onThrottle}` are used identically across Tasks 1–5. `DRIVE_LEVEL_{MIN,MAX,STEP}` names match everywhere. ✓
