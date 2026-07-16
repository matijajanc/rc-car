# Variable throttle touchpad — design

- **Date:** 2026-07-16
- **Status:** Approved (design); ready for implementation planning
- **Builds on:** the absolute drive-state / motion-lease refactor (`feature/keep-alive-fable-refactor`)

## Problem

The car launches badly. Today the throttle is **ternary** — the `dv` drive-state frame
only carries forward / neutral / reverse (`shared/protocol.ts` `DRIVE_THROTTLE`), and the
firmware snaps the ESC straight to one preset angle on a forward press
(`driveSrv.write(speedFactor)` in `arduino/rc-car/rc-car.ino` `applyDriveState`). That
instant 90°→`speedFactor`° jump spins the wheels and makes gentle starts impossible. Speed
is only adjustable globally via the separate `sf` speed-factor setting, not per-press.

The driver wants a **variable throttle controlled by finger position**: most of the
vertical travel for forward (fine control at the low end), a small zone for reverse.

## Goals

- Forward throttle is **proportional to finger position**, with fine control at the low
  end so launches are gentle.
- A single left-side **touchpad**: top ¾ = variable forward, bottom ¼ = fixed reverse.
- Preserve the existing safety model exactly (motion lease, spring-to-neutral, all cutoffs).
- Stay well inside the serial link's throughput budget.

## Non-goals

- Variable reverse (reverse stays a single fixed speed — it is rarely used and ¼ of the
  travel would be too coarse anyway).
- Latching / cruise-control behaviour (rejected: it removes the "car moves only while a
  finger is down" guarantee).
- Any change to steering, the gauges, or the dashboard center/right layout.
- A firmware build/flash toolchain in-repo (still out of scope — see Testing).

## Decisions (all confirmed with the user)

1. **Variable forward, fixed reverse, spring-loaded.** Finger position sets forward speed;
   releasing coasts to neutral (matches every RC trigger and the current buttons).
2. **Touchpad, not a draggable thumb.** Touch anywhere in the strip; finger Y sets the
   level. A spring-loaded control must be "touch-anywhere-and-go".
3. **`sf` becomes the max-speed ceiling.** The top of the strip maps to the current `sf`
   value, so a lower Speed setting makes even full-throttle gentle. Same `sf` command and
   `setting-sf` persistence; the Speed screen is relabelled "max speed".
4. **Expo curve lives app-side.** Finger position → level uses a gentle expo curve in JS
   (tunable without reflashing). Firmware stays a mechanical linear level→angle map.
5. **Level range `0–100`, quantized to 5% steps** (20 discrete levels).

## Wire protocol (`shared/protocol.ts`)

Forward gains a magnitude. The frame stays positional so the firmware's fixed-index parse
barely changes:

```
dvfc80   forward, centre, 80%
dvfl35   forward, left,   35%
dvnc     neutral (no level)
dvbc     reverse, centre  (fixed speed — no level)
dvbr     reverse, right   (fixed speed)
```

- `line[2]` = throttle (`f`/`n`/`b`), `line[3]` = steer (`l`/`c`/`r`) — **unchanged positions**.
- `line[4..]` = level, integer `0–100`, present **only** when throttle is `f`. Absent/ignored
  otherwise.
- New exports: `encodeDriveState(throttle, steer, level?)` (level appended only for forward),
  and constants `DRIVE_LEVEL_MIN = 0`, `DRIVE_LEVEL_MAX = 100`, `DRIVE_LEVEL_STEP = 5`.
- `MOTION_LEASE_MS`, `DRIVE_STATE_ACTIVE_REFRESH_MS`, `DRIVE_STATE_IDLE_REFRESH_MS` are
  **unchanged** — the level does not touch lease timing.

## Firmware (`arduino/rc-car/rc-car.ino`)

`applyDriveState(char throttle, char steer, int level)`:

- Validate throttle ∈ {f,n,b} and steer ∈ {l,c,r} **first** (as today) — a malformed frame
  must never extend the motion lease. Then `level = constrain(level, 0, 100)`.
- Forward angle map (linear): `angle = 90 + (level / 100.0) * (speedFactor - 90)`.
  - level 0 → 90 (idle), level 100 → `speedFactor` (so full-throttle == today's behaviour).
  - Optional bench-tuning knob `MIN_FORWARD_ANGLE` (default 0): if the ESC won't creep at
    low levels, offset so `level > 0` guarantees motion. Left at 0 unless bench testing
    shows it's needed.
- Reverse: unchanged (`driveSrv.write(15)`). Neutral: unchanged (`write(90)`).
- **Fresh-press-overrides-brake rule preserved:** an `n`/`b`→`f` transition still overrides
  an engaged front-obstacle brake (`preventNeutral`), exactly like today. A mere level
  change while already forward does **not** fight the brake's 35 ms reassertion loop.
- Command parse: `atoi(line + 4)` for the level when throttle is `f`; `handleCommand`
  passes it to `applyDriveState`.

## App UI

- **New presentational component** `src/components/DriveModeButtons/components/ThrottlePad/`
  — a vertical touchpad built on `react-native-gesture-handler` (same reason the buttons
  use RNGH: it recognises the gesture on the native thread and coexists with the steer
  buttons held simultaneously). A pan/long-press gesture reports the live Y fraction on
  begin/update and reports release on finalize (RNGH guarantees begin/finalize pair, so the
  throttle can never stick on).
- Visual: top ¾ forward zone, bottom ¼ reverse zone, a bright neutral line at the ¾ mark, a
  live fill from the neutral line, and a small deadband band at the boundary. Monochrome per
  the design system (colour stays reserved for the gauges; red stays reserved for
  stop/brake). Direction + % shown as a readout.
- Layout (`.../assets/styles/styles.js`): the strip replaces `upDownBox`, keeps the `left: 40`
  inset (clears the landscape edge-swipe zone), spans most of the height. `leftRightBox`
  (steering) and the center gauges (`mainBox`, `carDataBox`) are unchanged.
- `DriveModeButtons.tsx` swaps the two forward/reverse `DriveButton`s for the `ThrottlePad`;
  steer buttons stay.

## App send logic (`src/utils/drive-state.ts`)

- Track `forwardLevel` (0–100) alongside `throttle`/`steer`.
- **Position → level** via a helper (`src/utils/throttle-curve.ts`): normalize the forward
  fraction to `[0,1]`, apply expo `pow(pos, GAMMA)` (tunable `GAMMA ≈ 1.6`), quantize to
  `DRIVE_LEVEL_STEP`.
- **Level 0 / the deadband is sent as neutral (`n`), not forward-at-0%.** Forward (`f`) is
  transmitted only for level ≥ `DRIVE_LEVEL_STEP`. This keeps two properties: resting at the
  bottom of the forward zone truly idles (no lease engaged), and the first push up is a
  genuine `n`→`f` transition — the "fresh press overrides the front brake" case. Firmware
  still maps a (defensive, clamped) forward level 0 → angle 90, but the app never emits it.
- `encodeDriveState(throttle, steer, forwardLevel)` on transmit.
- **Coalesced sending:** send immediately on a meaningful change (direction, steer, or
  quantized level), but no more often than `SEND_MIN_INTERVAL_MS ≈ 60`; a trailing flush
  (the existing 150 ms active ticker, or a short timer) emits the latest state. The 150 ms
  heartbeat and 1 s idle tick are unchanged.
- Background / unmount / disconnect zero `forwardLevel` too (in addition to throttle/steer),
  then send the explicit stop — the existing `handleAppState` / `stopDriveSession` paths.

## Simulator + tests

- `node_server/src/simulator.ts`: derive simulated speed from the forward **level** (not just
  on/off), so the virtual car accelerates proportionally.
- Protocol tests (`__tests__/protocol.test.ts`, `node_server/test/protocol.test.ts`):
  `encodeDriveState` with/without level, round-trip, level clamping, reverse/neutral carry no
  level.
- Drive-state tests: expo+quantize mapping, deadband → 0, coalescing to `SEND_MIN_INTERVAL_MS`,
  spring-return to neutral on release, background zeroes the level.
- Curve helper tests: monotonic, `pos=0→0`, `pos=1→100`, quantization to 5% steps.

## Throughput analysis (answers the original worry)

- Frame `dvfc80\n` ≈ 7 bytes. Worst case ≈ 1 send / 60 ms during a fast sweep + 6.7/s
  heartbeat ≈ **~16 frames/s ≈ 110 B/s** — under **6%** of the 19,200-baud (~1,920 B/s)
  serial link, and matched to the Arduino loop's command-drain rate.
- The Node bridge (`node_server/src/server.ts`) is a dumb relay (`writeToCar(raw)` per
  message, microseconds each); it is not and never was the constraint. The real limit is the
  serial link + Arduino loop, which the coalescing keeps well clear of.

## Safety invariants (must all still hold)

- **Absolute state, unchanged lease timing.** Every `dv` frame fully describes throttle +
  level + steer; a lost frame is corrected by the next. `MOTION_LEASE_MS` unchanged.
- **Malformed/out-of-range level is inert.** Throttle/steer validated first; level clamped;
  a bad frame never extends the lease.
- **Spring to neutral everywhere.** Release, background, screen unmount, and last-socket
  disconnect all drive to neutral and zero the level.
- **All cutoffs still force neutral regardless of level:** motion-lease expiry, `st`,
  motor-temp cutoff (`criticalTemp`, must stay matched to `MOTOR_TEMP_CUTOFF_C`), front
  obstacle brake, back-obstacle reverse block.
- **Fresh forward press still overrides the front brake** (n/b→f transition); refresh at the
  same or changed level does not.

## Testing / rollout

- JS layer fully verifiable off-hardware: `npm run typecheck`, `npm run lint`, `npm test`,
  Metro bundle; backend `npm test` incl. the simulator.
- **Firmware is safety-critical and has no in-repo build/flash toolchain.** The `.ino` change
  is C++ compile-checked at most, then **must be flashed and bench-tested on the physical
  car**: verify level→speed feel, gentle launch, that full-slider == prior top speed at the
  same `sf`, reverse unchanged, and that every cutoff (lease expiry, temp, front/back
  obstacle) still stops the car. Tune `GAMMA` (app) and, only if needed, `MIN_FORWARD_ANGLE`
  (firmware) on the bench.

## Affected files

- `shared/protocol.ts` — `encodeDriveState` signature, `DRIVE_LEVEL_*` constants, docs.
- `arduino/rc-car/rc-car.ino` — `applyDriveState` level param + linear map, command parse.
- `src/utils/drive-state.ts` — `forwardLevel`, coalesced send, zero-on-suspend.
- `src/utils/throttle-curve.ts` — **new** position→level expo+quantize helper.
- `src/components/DriveModeButtons/components/ThrottlePad/` — **new** touchpad component.
- `src/components/DriveModeButtons/components/DriveModeButtons.tsx` — swap buttons for pad.
- `src/components/DriveModeButtons/DriveModeButtonsContainer.tsx` — wire pad callbacks.
- `src/components/DriveModeButtons/components/assets/styles/styles.js` — strip layout.
- Speed screen (`SpeedContainer` + presentational) — relabel to "max speed" (copy only).
- `node_server/src/simulator.ts` — proportional speed from level.
- `__tests__/protocol.test.ts`, `node_server/test/protocol.test.ts`, drive-state + curve tests.
- `CLAUDE.md`, `ANDROID_UPGRADE.md` — document the `dv` level extension.
