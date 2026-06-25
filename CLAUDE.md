# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A React Native mobile app for driving a physical RC car. It is the controller half of a three-tier system:

```
Mobile app (React Native)  ⇄ WebSocket ⇄  NodeJS bridge (node_server/)  ⇄ Serial port ⇄  Arduino on the car
```

The app never talks to the car directly. It opens a WebSocket to the NodeJS bridge server, which relays messages to/from the car's Arduino over a serial port. Understanding this hop is essential: anything the app "sends to the car" is a WebSocket message the bridge writes to the serial port, and anything "received from the car" is serial data the bridge broadcasts back over the WebSocket.

**Both halves are modernised.** The **backend** (`node_server/` + `shared/`): TypeScript, env-driven config, a hardware-free **car simulator**, Docker, tests, CI — all verified. The **app** (`src/`, `App.tsx`, `index.js`) was upgraded from RN 0.54 (2018) to **React Native 0.86** with **TypeScript + hooks + React Navigation v7**. The JS layer is verified (typecheck, lint, Jest, Metro bundle); the native APK is built in CI on x86 (see [ANDROID_UPGRADE.md](ANDROID_UPGRADE.md) for the migration record and the Apple-Silicon `aapt2` caveat).

**The third tier — the car firmware — is now in-repo** at [`arduino/rc-car/rc-car.ino`](arduino/rc-car/rc-car.ino) (Arduino Uno, `SimpleTimer`/`Servo`/`NewPing`). It was reconciled with `shared/protocol.ts`: dead accelerometer/camera codes removed, telemetry framing switched off the Arduino `String` class, and the front-obstacle `rs` telemetry implemented. **There is no toolchain in this repo to compile or flash it** — changes are C++-compile-checked at most, and must be flashed and bench-tested on the car (it drives a physical vehicle; the keep-alive stop, motor-temp cutoff and obstacle brake are real safety mechanisms).

## Commands

**Backend — bridge server + simulator** (run from `node_server/`, this is the modern, tested part):
- `npm install` — install dependencies (`serialport` is optional; simulate mode never needs it)
- `npm run dev` — run with hot reload (`tsx watch`), simulator on by default
- `npm start` — run once (`tsx`)
- `npm test` — Jest (ts-jest); protocol unit tests + WebSocket integration tests
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` / `npm run format` — ESLint / Prettier
- Single test: `npx jest test/protocol.test.ts` or `npx jest -t "telemetry"`

**Backend via Docker** (run from repo root) — fully isolated, no hardware:
- `docker compose up --build` — bridge + simulator on `:8085`

**App** (run from repo root) — React Native 0.86, TypeScript:
- `npm install --legacy-peer-deps` (a couple of legacy libs need it), `npm start` (Metro)
- `npm run typecheck` (`tsc --noEmit`), `npm run lint`, `npm test` (Jest, `@react-native/jest-preset`)
- `npm run android-dev` / `android-prod` / `build-android-prod` (need a local Android SDK)

CI: `.github/workflows/ci.yml` runs typecheck + lint + format + tests for the backend (Node 20 & 22); `.github/workflows/android.yml` builds the debug APK on x86 ubuntu (where `aapt2` runs natively).

## Environment config

**App:** `react-native-config` loads variables from a `.env` file selected at **build time** via the `ENVFILE=` env var (see the `android-*` scripts). Variables: `WS_SERVER_IP`, `WS_PORT`. `.env` is the dev config; `.env.prod` is production. Access in code via `import Config from 'react-native-config'` → `Config.WS_SERVER_IP`. Changing a `.env` value requires a rebuild, not just a Metro reload.

**Backend:** env-driven at runtime (see `node_server/.env.example` and `node_server/src/config.ts`): `WS_PORT` (8085), `WS_HOST` (0.0.0.0), `SIMULATE` (**true** by default — virtual car, no hardware), and for real hardware `SERIAL_PATH` + `SERIAL_BAUD` (19200). Set `SIMULATE=false` only on the machine wired to the car.

## Local development without hardware

The bridge ships a **car simulator** (`node_server/src/simulator.ts`) that streams realistic telemetry (`sp`/`bv`/`mt`) and reacts to commands, so the whole stack runs with no Arduino, serial cable, or even a phone. `SIMULATE=true` is the default. `docker compose up --build` runs it in an isolated container. It even mimics the car's keep-alive safety stop: stop sending `kp` and the simulated speed drops to 0.

## Observability / logs

Both legs are logged with timestamps via a small dependency-free structured logger (`node_server/src/logger.ts`): the **app↔server** leg (ws client connect/disconnect/errors) and the **server↔car** leg (serial open/close/errors + a `telemetry_gap` warning when the car stops sending). Logs go to the console (pretty) and to daily-rotated JSON-lines files (`LOG_DIR`, `LOG_LEVEL`). The server also serves `GET /health` and `GET /logs?limit&level` on the WebSocket port (LAN-only, unauthenticated). On the app side, `src/utils/diagnostics.ts` keeps a connection-event log in AsyncStorage, shown on the **Diagnostics** screen reached by tapping the top-left **connection dot** (grey/orange/green/red).

## The command protocol (core domain knowledge)

The protocol is codified in one dependency-free module — **[`shared/protocol.ts`](shared/protocol.ts)** — the single source of truth, consumed by both the backend and the app. It replaces the comment-only spec that used to live in `transmitter.js`/`receiver.js`. Change protocol behaviour there, and the Jest suites (`node_server/test/protocol.test.ts` and `__tests__/protocol.test.ts`) guard it.

App↔car messages are short ASCII strings: a **2-character code** followed by a value. The two directions use **different terminators**, which is easy to get wrong:

- **Outgoing (app → car):** terminated with `COMMAND_TERMINATOR` = `'\n'`. Built with `frameCommand(code, value)`.
- **Incoming (car → app):** terminated with `TELEMETRY_TERMINATOR` = `'X'`. Parsed with `parseTelemetryStream()` (buffers partial frames) or `decodeTelemetryFrame()`.

Codes are exported as `COMMAND_CODES` and `TELEMETRY_CODES`:
- Commands: `db` drive buttons, `kp` keep-alive, `sc` steer calibrate, `st` stop, `sf` speed factor; Arduino options `rs` range sensors on/off, `rc` range-sensor servo trim, `cl` car lights, `bl` blinkers, `b4` all-4 blinkers, `ll` long lights.
- Telemetry: `mt` motor temperature, `sp` car speed, `bv` battery voltage, `rs` front-obstacle (the firmware emits `rs1`/`rs0` edge-triggered when the front brake engages/clears).

> Reconciled with the firmware (`feature/arduino`): the 2018 accelerometer drive mode (`dm`/`ad`/`as`) and the never-implemented `cm` camera + phantom `ab` codes were removed from the protocol, the firmware, and the simulator — the app drives only via the on-screen buttons (`db`). `rc` (range-servo trim) gained an app screen (see Range Calibrate below); it had been firmware-only.

> Resolved: `SpeedContainer` sends the speed setting as `sf<value>` (`SPEED_FACTOR`) and persists it under `setting-sf`. It previously used `sp` by mistake — a typo, since `sp` is the *incoming* speed telemetry code. See [ANDROID_UPGRADE.md](ANDROID_UPGRADE.md) §4.3.

## Architecture & conventions

### Backend (`node_server/` + `shared/`) — current, verified

**`CarLink` abstraction.** `node_server/src/server.ts` (`startBridge`) is written against the `CarLink` interface (`link.ts`), so the real serial port (`serial.ts`) and the `CarSimulator` (`simulator.ts`) are interchangeable — that's what makes the data path testable without hardware. `serialport` is imported lazily (and is an optional dependency) so simulate mode never loads native code. `index.ts` picks the link from config and wires graceful shutdown.

**Code lives together for tooling.** `shared/protocol.ts` sits at the repo root so both halves can import it. ESLint is scoped to `node_server/src` + `test`; `shared/` is covered by `tsc`, Prettier, and the Jest suite (it can't sit under ESLint's base path).

### App (`src/`, `App.tsx`) — React Native 0.86, TypeScript + hooks

**Container/presentation pattern.** Every feature lives in `src/components/<Feature>/`. `<Feature>Container.tsx` is the smart component (state via hooks, WebSocket send/receive, navigation, orientation lock); `components/<Feature>.{tsx,js}` is the dumb presentational component. The smart/dumb split (Dan Abramov) still holds — follow it for new features. Dumb leaf components are still plain `.js` (allowed via `allowJs`) and carry a few cosmetic unused-import lint warnings.

**Utils are TS modules** (`src/utils/*.ts`) built on the shared protocol: `transmitter.send()`, `receiver.receive()`, `settings.sendAll()`, `keep-alive.start/stop()`, `websocket.createSocket/getSocket()`, `vibrate()`. Each also keeps a backward-compatible default export (e.g. `Transmitter.send`) so the older `.js` presentational components keep working unchanged.

**Incoming data uses an event bus, not props.** `receiver.ts` decodes telemetry with `parseTelemetryStream` (buffering partial frames) and emits `EventRegister.emit('wsReceive', {code, value})`. Dashboard widgets (Speedometer, BatteryLevel, MotorTemperature) subscribe in a `useEffect`, filter by `code`, and remove the listener in the effect's cleanup.

**Keep-alive is a safety mechanism.** `keep-alive.start()` sends `kp` every 100ms after connect; the car stops itself if it misses the signal 3× in a row. Do not throttle it without understanding the safety implication.

**Settings persistence.** Stored in `AsyncStorage` (`@react-native-async-storage/async-storage`) under `setting-<code>` keys; `settings.sendAll()` replays them to the car on connect (booleans → 1/0). `OnOffSetting` is the reusable persisted toggle.

**Calibration screens (`sc`, `rc`).** `SteerCalibrate` (steering trim, `sc`) and `RangeCalibrate` (front range-sensor servo trim, `rc`) are the same ±15° stepper pattern: a `Container` persists `setting-sc`/`setting-rc` and sends `sc<n>`/`rc<n>`, the presentational screen reuses the shared `CalibrateButton`. Add a new trim the same way.

**Navigation.** `@react-navigation/native` v7 native-stack in `App.tsx`, `headerShown: false`, initial route `Connect`; route names are typed via the exported `RootStackParamList`. Screens read navigation from `useNavigation<NativeStackNavigationProp<RootStackParamList>>()`.

**Orientation locking.** Each container locks orientation in a `useEffect` via `react-native-orientation-locker` — portrait for menus, landscape for the driving dashboard (`DriveModeButtonsContainer`).

**Drive controls — multi-touch.** The four drive buttons (`DriveButton`) use `react-native-gesture-handler`, **not** `Pressable`/`Touchable`. RN's JS responder system only lets one Touchable be held at a time, so throttle + steer together was silently dropped (the second `onPressIn` never fired); RNGH recognises each button's gesture independently on the native thread, so several can be held at once. Press fires on `onBegin`, release on `onFinalize` (RNGH guarantees they pair, so the throttle can't stick on). `GestureHandlerRootView` wraps the app in `App.tsx`, and `index.js` imports `react-native-gesture-handler` first. See [ANDROID_UPGRADE.md](ANDROID_UPGRADE.md) §8.

**Gauges.** Battery/Motor keep the **original segmented radial-arc SVG design**, re-implemented declaratively for react-native-svg v15 — each segment computes its `fill`/`opacity` in render (the legacy `extractBrush` + `setNativeProps` ref-fill was removed in v15). Speedometer uses `AnimatedCircularProgress` (unchanged from 2018).

## Gotchas

- **Connect-without-server fallback:** in `ConnectionContainer`, tapping Connect 10 times navigates to Home even with no server (see `fallback()`), so the UI can be opened standalone.
- **Serial port is now env-driven.** The old `COM4`/19200 hardcoding is gone — set `SERIAL_PATH`/`SERIAL_BAUD` (and `SIMULATE=false`) on the machine wired to the car. The commented-out `setInterval` simulation from the old `server.js` is now the first-class `CarSimulator`.
- **Unauthenticated LAN tool.** The WebSocket has no auth (it never did) and binds `0.0.0.0` so a phone on the same Wi-Fi can reach it. Fine for a LAN dev tool; never expose the host to the public internet.
- **Android build on Apple Silicon:** building the APK in Docker on an arm64 Mac fails at `processDebugResources` because Google ships `aapt2` as an x86_64-only binary. Use the CI workflow (x86 ubuntu), a local Android SDK, or an `--platform=linux/amd64` (emulated) container. The JS layer is fully verifiable anywhere (`npm run typecheck` + Metro bundle).
- **`npm install` needs `--legacy-peer-deps`** because a few legacy libs (`react-native-circular-progress`, `react-native-event-listeners`) declare stale peer ranges.
