# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A React Native mobile app for driving a physical RC car. It is the controller half of a three-tier system:

```
Mobile app (React Native)  ⇄ WebSocket ⇄  NodeJS bridge (node_server/)  ⇄ Serial port ⇄  Arduino on the car
```

The app never talks to the car directly. It opens a WebSocket to the NodeJS bridge server, which relays messages to/from the car's Arduino over a serial port. Understanding this hop is essential: anything the app "sends to the car" is a WebSocket message the bridge writes to the serial port, and anything "received from the car" is serial data the bridge broadcasts back over the WebSocket.

**Both halves are modernised.** The **backend** (`node_server/` + `shared/`): TypeScript, env-driven config, a hardware-free **car simulator**, Docker, tests, CI — all verified. The **app** (`src/`, `App.tsx`, `index.js`) was upgraded from RN 0.54 (2018) to **React Native 0.86** with **TypeScript + hooks + React Navigation v7**. The JS layer is verified (typecheck, lint, Jest, Metro bundle); the native APK is built in CI on x86 (see [ANDROID_UPGRADE.md](ANDROID_UPGRADE.md) for the migration record and the Apple-Silicon `aapt2` caveat).

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
- Commands: `dm` drive mode, `ad`/`ab`/`as` accelerometer drive/backward/steer, `db` drive buttons, `kp` keep-alive, `sc` steer calibrate, `st` stop, `sf` speed factor; Arduino options `rs` range sensors, `rc` range-sensor servo angle, `cl` car lights, `bl` blinkers, `b4` all-4 blinkers, `cm` camera, `ll` long lights.
- Telemetry: `mt` motor temperature, `sp` car speed, `bv` battery voltage, `rs` range-sensor problem.

> Resolved: `SpeedContainer` sends the speed setting as `sf<value>` (`SPEED_FACTOR`) and persists it under `setting-sf`. It previously used `sp` by mistake — a typo, since `sp` is the *incoming* speed telemetry code. See [ANDROID_UPGRADE.md](ANDROID_UPGRADE.md) §4.3.

## Architecture & conventions

### Backend (`node_server/` + `shared/`) — current, verified

**`CarLink` abstraction.** `node_server/src/server.ts` (`startBridge`) is written against the `CarLink` interface (`link.ts`), so the real serial port (`serial.ts`) and the `CarSimulator` (`simulator.ts`) are interchangeable — that's what makes the data path testable without hardware. `serialport` is imported lazily (and is an optional dependency) so simulate mode never loads native code. `index.ts` picks the link from config and wires graceful shutdown (plus a log-and-continue `uncaughtException`/`unhandledRejection` net — a driving car favours staying up, with the firmware 300ms stop as the hardware fail-safe).

**The server generates the car keep-alive** (it no longer just relays the app's). `startBridge` runs a `kp` generator + a WS ping watchdog gated on per-client liveness — see the "Keep-alive is a server-side safety mechanism" note under the App section for the full model and the fixed timings. Because that beat now writes to the link every 100ms, `SerialCarLink.write()` is a **no-op while the port is down** (unplugged/mid-reconnect) instead of throwing — otherwise it would crash the bridge under `SIMULATE=false`.

**Code lives together for tooling.** `shared/protocol.ts` sits at the repo root so both halves can import it. ESLint is scoped to `node_server/src` + `test`; `shared/` is covered by `tsc`, Prettier, and the Jest suite (it can't sit under ESLint's base path).

### App (`src/`, `App.tsx`) — React Native 0.86, TypeScript + hooks

**Container/presentation pattern.** Every feature lives in `src/components/<Feature>/`. `<Feature>Container.tsx` is the smart component (state via hooks, WebSocket send/receive, navigation, orientation lock); `components/<Feature>.{tsx,js}` is the dumb presentational component. The smart/dumb split (Dan Abramov) still holds — follow it for new features. Dumb leaf components are still plain `.js` (allowed via `allowJs`) and carry a few cosmetic unused-import lint warnings.

**Utils are TS modules** (`src/utils/*.ts`) built on the shared protocol: `transmitter.send()`, `receiver.receive()`, `settings.sendAll()`, `presence.start/stop()`, `websocket.createSocket/getSocket()`, `vibrate()`. Each also keeps a backward-compatible default export (e.g. `Transmitter.send`) so the older `.js` presentational components keep working unchanged.

**Incoming data uses an event bus, not props.** `receiver.ts` decodes telemetry with `parseTelemetryStream` (buffering partial frames) and emits `EventRegister.emit('wsReceive', {code, value})`. Dashboard widgets (Speedometer, BatteryLevel, MotorTemperature) subscribe in a `useEffect`, filter by `code`, and remove the listener in the effect's cleanup.

**Keep-alive is a server-side safety mechanism.** The car safety-stops if it misses the `kp` heartbeat for ~300ms (the firmware restarts a 300ms timer on every `kp`). That heartbeat is generated by the **bridge server** (`node_server/src/server.ts`), *not* the app — running a hard 100ms beat on the RN JS thread used to let gesture/GC/`lc`-flood stalls starve it and false-trip the car with a healthy radio link (the bug; see the diagnosis). The server emits `kp` every 100ms only while a client is **live**: transport-alive (pinged every 300ms; no pong for 700ms ⇒ transport gone — pongs are answered by the phone's native socket layer, so they survive a blocked JS thread) **and** present (any message within 2s). These timings are fixed constants in `server.ts` (`KEEP_ALIVE`), not env vars. When the app disconnects, drops Wi-Fi, or is backgrounded, the server sends an explicit `st` and stops the beat, so the car stops in ~0.7s (firmware 300ms backs it up). The app now sends only a relaxed 250ms **presence beat** (`src/utils/presence.ts`); `app-lifecycle.ts` still sends an explicit `st` on `background`. **Bench-verify on a real device** that the phone answers WS pings while the JS thread is blocked — the fast Wi-Fi-loss detection relies on it; if not, lean more on the presence timeout. Don't move the beat back onto the JS thread.

**Settings persistence.** Stored in `AsyncStorage` (`@react-native-async-storage/async-storage`) under `setting-<code>` keys; `settings.sendAll()` replays them to the car on connect (booleans → 1/0). `OnOffSetting` is the reusable persisted toggle.

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
