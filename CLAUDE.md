# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A React Native mobile app for driving a physical RC car. It is the controller half of a three-tier system:

```
Mobile app (React Native)  ⇄ WebSocket ⇄  NodeJS bridge (node_server/)  ⇄ Serial port ⇄  Arduino on the car
```

The app never talks to the car directly. It opens a WebSocket to the NodeJS bridge server, which relays messages to/from the car's Arduino over a serial port. Understanding this hop is essential: anything the app "sends to the car" is a WebSocket message the bridge writes to the serial port, and anything "received from the car" is serial data the bridge broadcasts back over the WebSocket.

**Two halves at different stages.** The **backend** (`node_server/` + `shared/`) has been modernised: TypeScript, env-driven config, a hardware-free **car simulator**, Docker, tests, and CI — all verified. The **app** (`src/`, `App.js`, `index.js`) is still the original **React Native 0.54.2 (2018)** code; its modernisation (RN 0.85, TypeScript, hooks) is specified, ready-to-apply, in [ANDROID_UPGRADE.md](ANDROID_UPGRADE.md). When working on the app, read that first.

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

**App** (run from repo root) — still RN 0.54; see [ANDROID_UPGRADE.md](ANDROID_UPGRADE.md) before changing:
- `npm install`, `npm start` (Metro), `npm test` (Jest `react-native` preset)
- `npm run android-dev` / `android-prod` / `build-android-prod`

CI (`.github/workflows/ci.yml`) runs typecheck + lint + format check + tests for the backend on Node 20 & 22.

## Environment config

**App:** `react-native-config` loads variables from a `.env` file selected at **build time** via the `ENVFILE=` env var (see the `android-*` scripts). Variables: `WS_SERVER_IP`, `WS_PORT`. `.env` is the dev config; `.env.prod` is production. Access in code via `import Config from 'react-native-config'` → `Config.WS_SERVER_IP`. Changing a `.env` value requires a rebuild, not just a Metro reload.

**Backend:** env-driven at runtime (see `node_server/.env.example` and `node_server/src/config.ts`): `WS_PORT` (8085), `WS_HOST` (0.0.0.0), `SIMULATE` (**true** by default — virtual car, no hardware), and for real hardware `SERIAL_PATH` + `SERIAL_BAUD` (19200). Set `SIMULATE=false` only on the machine wired to the car.

## Local development without hardware

The bridge ships a **car simulator** (`node_server/src/simulator.ts`) that streams realistic telemetry (`sp`/`bv`/`mt`) and reacts to commands, so the whole stack runs with no Arduino, serial cable, or even a phone. `SIMULATE=true` is the default. `docker compose up --build` runs it in an isolated container. It even mimics the car's keep-alive safety stop: stop sending `kp` and the simulated speed drops to 0.

## The command protocol (core domain knowledge)

The protocol is now codified in one dependency-free module — **[`shared/protocol.ts`](shared/protocol.ts)** — the single source of truth, consumed by the backend today and by the app after the upgrade. It replaces the comment-only spec that used to live in `transmitter.js`/`receiver.js`. Change protocol behaviour there, and the Jest suite (`node_server/test/protocol.test.ts`) guards it.

App↔car messages are short ASCII strings: a **2-character code** followed by a value. The two directions use **different terminators**, which is easy to get wrong:

- **Outgoing (app → car):** terminated with `COMMAND_TERMINATOR` = `'\n'`. Built with `frameCommand(code, value)`.
- **Incoming (car → app):** terminated with `TELEMETRY_TERMINATOR` = `'X'`. Parsed with `parseTelemetryStream()` (buffers partial frames) or `decodeTelemetryFrame()`.

Codes are exported as `COMMAND_CODES` and `TELEMETRY_CODES`:
- Commands: `dm` drive mode, `ad`/`ab`/`as` accelerometer drive/backward/steer, `db` drive buttons, `kp` keep-alive, `sc` steer calibrate, `st` stop, `sf` speed factor; Arduino options `rs` range sensors, `rc` range-sensor servo angle, `cl` car lights, `bl` blinkers, `b4` all-4 blinkers, `cm` camera, `ll` long lights.
- Telemetry: `mt` motor temperature, `sp` car speed, `bv` battery voltage, `rs` range-sensor problem.

> Known discrepancy to verify against the firmware: the legacy app sends `sp<value>` for the speed *setting*, but `sp` is also the incoming speed telemetry code and the documented speed-factor command is `sf`. See the warning in [ANDROID_UPGRADE.md](ANDROID_UPGRADE.md) §4.3.

## Architecture & conventions

### Backend (`node_server/` + `shared/`) — current, verified

**`CarLink` abstraction.** `node_server/src/server.ts` (`startBridge`) is written against the `CarLink` interface (`link.ts`), so the real serial port (`serial.ts`) and the `CarSimulator` (`simulator.ts`) are interchangeable — that's what makes the data path testable without hardware. `serialport` is imported lazily (and is an optional dependency) so simulate mode never loads native code. `index.ts` picks the link from config and wires graceful shutdown.

**Code lives together for tooling.** `shared/protocol.ts` sits at the repo root so both halves can import it. ESLint is scoped to `node_server/src` + `test`; `shared/` is covered by `tsc`, Prettier, and the Jest suite (it can't sit under ESLint's base path).

### App (`src/`) — current RN 0.54 code (see ANDROID_UPGRADE.md for the modern target)

**Container/presentation pattern.** Every feature lives in `src/components/<Feature>/`. `<Feature>Container.js` is the smart component (state, WebSocket send/receive, navigation, orientation lock); `components/<Feature>.js` is the dumb presentational component receiving props/callbacks. The README cites Dan Abramov's smart/dumb components article — follow it for new features.

**Singletons.** `WebSocketNodeJs` (`src/utils/websocket.js`), `KeepAlive` (`keep-alive.js`), and `Settings` (`settings.js`) are exported as instantiated singletons (`export default (new X)`). The WebSocket singleton holds the one socket, set once on connect; everything else does `WebSocketNodeJs.get()`.

**Incoming data uses an event bus, not props.** `Receiver` emits `EventRegister.emit('wsReceive', {option, value})` (from `react-native-event-listeners`). Display containers (Speedometer, BatteryLevel, MotorTemperature) subscribe via `EventRegister.addEventListener('wsReceive', ...)` and filter by `option` code. Remember to remove the listener in `componentWillUnmount`.

**Keep-alive is a safety mechanism.** `KeepAlive.start()` sends `kp` every 100ms after connect. The car stops itself if it misses the signal 3× in a row. Do not break or throttle this loop without understanding the safety implication.

**Settings persistence.** On/off and value settings are stored in `AsyncStorage` under `setting-<code>` keys (e.g. `setting-sp`, `setting-rs`). On connect, `Settings.send()` replays all stored settings to the car (booleans serialized as `1`/`0`). The `OnOffSetting` common component is the reusable persisted toggle.

**Navigation.** `react-navigation` `StackNavigator` in `src/config/routes.js`, `headerMode: 'none'`, initial route `Connect`. Routes: Connect → Home → {Speed, SteerCalibrate, Arduino, DriveWithButtons}.

**Orientation locking.** Each container locks orientation in `componentDidMount` via `react-native-orientation` — portrait for menus, landscape for the driving dashboard (`DriveModeButtonsContainer`).

## Gotchas

- **Connect-without-server fallback:** in `ConnectionContainer`, tapping Connect 10 times navigates to Home even with no server (see `fallback()`), so the UI can be opened standalone.
- **Serial port is now env-driven.** The old `COM4`/19200 hardcoding is gone — set `SERIAL_PATH`/`SERIAL_BAUD` (and `SIMULATE=false`) on the machine wired to the car. The commented-out `setInterval` simulation from the old `server.js` is now the first-class `CarSimulator`.
- **Unauthenticated LAN tool.** The WebSocket has no auth (it never did) and binds `0.0.0.0` so a phone on the same Wi-Fi can reach it. Fine for a LAN dev tool; never expose the host to the public internet.
- **The app stack is deliberately frozen at RN 0.54** until the upgrade. Don't "modernise piecemeal" — hooks need React ≥16.8 and Metro 0.54 can't load `.ts`, so partial changes break the app. Do the whole migration via [ANDROID_UPGRADE.md](ANDROID_UPGRADE.md).
