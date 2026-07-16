# RC Car — Android / React Native Upgrade

**Status: ✅ APPLIED.** The app was upgraded from React Native **0.54.2 (2018)** to
**0.86** with **TypeScript + hooks + React Navigation v7**, wired to the typed
[`shared/protocol.ts`](shared/protocol.ts). This document is both the record of
what was done and the reference for the remaining native-build step.

**Verified (no Android SDK needed, all green):** `npm run typecheck`, `npm run lint`,
`npm test`, and a full **Metro production bundle** — the entire JS module graph
resolves and transforms under RN 0.86.

**Native build:** compiling the APK in Docker on this **Apple Silicon (arm64)** Mac
gets through all 150 Gradle tasks (RN plugin, autolinking, every native module's
Kotlin, codegen) and fails only at `processDebugResources`, because Google ships
`aapt2` as an **x86_64-only** binary that can't run on arm64 Linux. So the native
APK is built where `aapt2` runs natively: **CI on x86 ubuntu**
([`.github/workflows/android.yml`](.github/workflows/android.yml)), a local Android
SDK, or an `--platform=linux/amd64` (emulated) container via
[`android-build.Dockerfile`](android-build.Dockerfile).

> The sections below were the migration plan; they now double as the change record.
> Versions landed slightly newer than originally targeted (RN **0.86**, React 19.2,
> SDK 36, NDK 27, Gradle 9.3.1).

The backend half of the project (the WebSocket bridge + simulator) **was**
modernised and verified here — see [`node_server/`](node_server/) and
[`CLAUDE.md`](CLAUDE.md). You can develop and test the whole app against the
simulator with zero hardware while doing this upgrade.

---

## 0. Strategy: re-scaffold, don't bump

A 0.54 → 0.85 jump spans ~30 minor releases, the New Architecture, AGP 2 → 8,
Gradle 2 → 8, `jcenter` (dead) → `mavenCentral`, Java → Kotlin native host, and
React 16 → 19. In-place bumping that is a multi-day fight. The community-standard
path — and the one this guide uses — is:

1. Generate a **fresh** RN 0.85 project (correct native scaffolding, autolinking,
   Kotlin host, Gradle/AGP, Hermes, New Architecture all set up for you).
2. **Port the JS** (`src/`, plus the migrations below) into it.
3. Re-add third-party native deps via the replacement table and let **autolinking**
   wire them (no more manual `settings.gradle` / `MainApplication` edits).

Keep this git repo; create the scaffold beside it and copy files across.

---

## 1. Prerequisites

| Tool | Version |
|---|---|
| Node | ≥ 20 (you have 24 ✓) |
| JDK | **17** (RN ≥ 0.73 requires JDK 17; not 8/11) |
| Android Studio | latest, with **Android SDK Platform 35** + Build-Tools 35 |
| Android NDK | the version RN 0.85 pins (Android Studio will prompt) |
| Watchman | `brew install watchman` (do **not** install the npm `watchman` package) |

Set `ANDROID_HOME`, add `platform-tools` and `emulator` to `PATH`, and create an
AVD (e.g. Pixel, API 35).

---

## 2. Scaffold the new project

```bash
# beside this repo
npx @react-native-community/cli@latest init rcCar --version latest --pm npm
```

This generates `android/` (Kotlin `MainActivity`/`MainApplication`, Gradle 8,
AGP 8, `mavenCentral`, New Architecture), `ios/`, `App.tsx`, `index.js`,
`tsconfig.json`, `.eslintrc`/`eslint.config`, `jest.config`, Babel, Metro.

**Android targets to confirm** in `android/build.gradle` (the scaffold sets sane
values — verify them against the Play Store requirement of `targetSdk 35`):

```gradle
buildscript {
    ext {
        buildToolsVersion = "35.0.0"
        minSdkVersion = 24          // RN 0.76+ minimum (was 16)
        compileSdkVersion = 35
        targetSdkVersion = 35       // Google Play requirement
    }
}
```

Keep your old `applicationId`:

```gradle
// android/app/build.gradle
defaultConfig { applicationId "com.rccar" }
```

> **Fixes the legacy `section.js` bug.** The old [android/app/build.gradle:77](android/app/build.gradle:77)
> set `entryFile: "section.js"`, which doesn't exist. The new scaffold uses
> `index` as the JS entry by default (`getJSMainModuleName() = "index"`), so this
> bug simply disappears — just don't reintroduce a custom `entryFile`.

Copy across: `app.json` name (`rcCar`), launcher icons under
`android/app/src/main/res/mipmap-*`, and your `.env` / `.env.prod`.

---

## 3. Dependencies: old → new

Install in the scaffold:

```bash
# Navigation (v1 → v7: full API change, see §4.2)
npm i @react-navigation/native @react-navigation/native-stack
npm i react-native-screens react-native-safe-area-context

# Storage (moved out of react-native core)
npm i @react-native-async-storage/async-storage

# Orientation (original is unmaintained; locker is the drop-in successor)
npm i react-native-orientation-locker

# Config, SVG, gauges, sizing, event bus
npm i react-native-config react-native-svg react-native-circular-progress
npm i react-native-size-matters react-native-event-listeners
```

| Old | New | Notes |
|---|---|---|
| `react 16.3.0-alpha.1` | `react` 19.x | comes with RN 0.85 |
| `react-native 0.54.2` | `react-native` 0.85.x | from scaffold |
| `react-navigation ^1.5.8` | `@react-navigation/native` ^7 + `@react-navigation/native-stack` ^7 | **API rewrite** (§4.2) |
| `AsyncStorage` from `react-native` | `@react-native-async-storage/async-storage` ^2 | same method names |
| `react-native-orientation ^3.1.3` | `react-native-orientation-locker` ^1.7 | **same `Orientation.lockTo*` API** |
| `react-native-config ^0.11.5` | `react-native-config` ^1.5 | same `Config.X`; re-check `dotenv.gradle` apply |
| `react-native-svg ^6.3.1` | `react-native-svg` ^15 | components stable across the bump |
| `react-native-circular-progress ^0.2.0` | `react-native-circular-progress` ^1.4 | depends on `react-native-svg` |
| `react-native-size-matters ^0.1.0` | `react-native-size-matters` ^0.4 | API stable |
| `react-native-event-listeners ^1.0.3` | `react-native-event-listeners` ^1.0.7 | works; or replace with a custom hook/Context |
| `create-react-native-app`, npm `watchman` | **remove** | obsolete / use brew |
| `babel-preset-react-native`, `jest 22` | `@react-native/babel-preset`, `@react-native/jest-preset` | scaffold provides; **in RN 0.85 the Jest preset moved to its own package** |

After installing, follow each library's README for any remaining native step
(`react-native-orientation-locker` needs an `onConfigurationChanged` override in
the Kotlin `MainActivity` and an `android:configChanges` entry in the manifest;
`react-native-screens` needs nothing on New Arch; `react-native-svg` is
autolinked).

---

## 4. JS migration (TypeScript + hooks)

### 4.1 Wire up the shared protocol

`shared/protocol.ts` already lives at the project root, so Metro bundles it with
no extra config. Replace the scattered 2-char string literals with it. Point the
app's `tsconfig.json` at it:

```jsonc
// tsconfig.json
{
  "extends": "@react-native/typescript-config",
  "compilerOptions": { "strict": true },
  "include": ["src", "shared", "App.tsx", "index.js"]
}
```

### 4.2 Entry + navigation

**`index.js`** — register with the `app.json` name (no more `section.js`):

```tsx
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

**`App.tsx`** — replaces both the old `App.js` and `src/config/routes.js`
(`StackNavigator` v1). Export the param list so screens get typed navigation:

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ConnectionContainer from './src/components/Connection/ConnectionContainer';
import HomeContainer from './src/components/Home/HomeContainer';
import SpeedContainer from './src/components/Speed/SpeedContainer';
import SteerCalibrateContainer from './src/components/SteerCalibrate/SteerCalibrateContainer';
import ArduinoContainer from './src/components/Arduino/ArduinoContainer';
import DriveModeButtonsContainer from './src/components/DriveModeButtons/DriveModeButtonsContainer';

export type RootStackParamList = {
  Connect: undefined;
  Home: undefined;
  Speed: undefined;
  SteerCalibrate: undefined;
  Arduino: undefined;
  DriveWithButtons: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Connect" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Connect" component={ConnectionContainer} />
        <Stack.Screen name="Home" component={HomeContainer} />
        <Stack.Screen name="Speed" component={SpeedContainer} />
        <Stack.Screen name="SteerCalibrate" component={SteerCalibrateContainer} />
        <Stack.Screen name="Arduino" component={ArduinoContainer} />
        <Stack.Screen name="DriveWithButtons" component={DriveModeButtonsContainer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

Navigation API changes to apply everywhere:
- `this.props.navigation.navigate('X')` → `const navigation = useNavigation<NavigationProp<RootStackParamList>>(); navigation.navigate('X')`.
- `react-navigation` v1 single import → `@react-navigation/native` + `native-stack`.
- `headerMode: 'none'` → `screenOptions={{ headerShown: false }}`.

### 4.3 Utilities → TypeScript + shared protocol

**`src/utils/websocket.ts`** (typed singleton):

```ts
import Config from 'react-native-config';

class WebSocketNodeJs {
  private socket: WebSocket | null = null;

  createSocket(ip: string): WebSocket {
    this.socket = new WebSocket(`ws://${ip}:${Config.WS_PORT}`);
    return this.socket;
  }
  get(): WebSocket | null {
    return this.socket;
  }
}

export default new WebSocketNodeJs();
```

**`src/utils/transmitter.ts`** — uses `frameCommand`, which also **fixes the
double-terminator bug** the old keep-alive had:

```ts
import { frameCommand } from '../../shared/protocol';
import WebSocketNodeJs from './websocket';

export function send(code: string, value?: string | number): void {
  const socket = WebSocketNodeJs.get();
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(frameCommand(code, value));
  }
}
```

Call sites become self-documenting, e.g.
`Transmitter.send('sp' + value)` → `send(COMMAND_CODES.SPEED_FACTOR, value)`.

> ✅ **Resolved.** The old `SpeedContainer` sent `sp<value>` for the speed
> *setting* — a typo, since `sp` is the *incoming speed telemetry* code. It now
> sends `sf<value>` (`SPEED_FACTOR`) and persists it under `setting-sf`, so
> `settings.sendAll()` replays it correctly on connect.
> [`shared/protocol.ts`](shared/protocol.ts) defines `SPEED_FACTOR = 'sf'`.

**`src/utils/keep-alive.ts`**:

```ts
import { COMMAND_CODES } from '../../shared/protocol';
import { send } from './transmitter';

let timer: ReturnType<typeof setInterval> | null = null;

export function start(): void {
  if (timer) return;
  timer = setInterval(() => send(COMMAND_CODES.KEEP_ALIVE), 100);
}
export function stop(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
```

**`src/utils/receiver.ts`** — uses the protocol decoder + a stream buffer so a
frame split across two socket messages is reassembled:

```ts
import { parseTelemetryStream } from '../../shared/protocol';
import { EventRegister } from 'react-native-event-listeners';
import WebSocketNodeJs from './websocket';

export function receive(): void {
  const socket = WebSocketNodeJs.get();
  if (!socket) return;
  let rest = '';
  socket.onmessage = (event: WebSocketMessageEvent) => {
    const { items, rest: tail } = parseTelemetryStream(rest + String(event.data));
    rest = tail;
    for (const frame of items) {
      EventRegister.emit('wsReceive', frame); // { code, value }
    }
  };
}
```

**`src/utils/settings.ts`** — `@react-native-async-storage/async-storage` +
`formatSettingValue`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatSettingValue } from '../../shared/protocol';
import { send } from './transmitter';

export async function sendAll(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    send(key.replace('setting-', ''), formatSettingValue(value));
  }
}
```

### 4.4 Class components → function components + hooks

The mechanical mapping for every container:

| Class pattern | Hook equivalent |
|---|---|
| `this.state` / `this.setState` | `useState` |
| `componentDidMount` (orientation lock) | `useEffect(() => { Orientation.lockToPortrait(); }, [])` |
| `componentWillMount` (read AsyncStorage / subscribe) | `useEffect(() => { ... }, [])` |
| `componentWillUnmount` | the cleanup function returned from `useEffect` |
| `this.props.navigation` | `useNavigation<NavigationProp<RootStackParamList>>()` |

**Example — `SpeedometerContainer.tsx`** (the `EventRegister` → `useEffect`
subscription, with the cleanup the original lacked a hook for):

```tsx
import React, { useEffect, useState } from 'react';
import { EventRegister } from 'react-native-event-listeners';
import { TELEMETRY_CODES, Telemetry } from '../../../shared/protocol';
import Speedometer from './components/Speedometer';

export default function SpeedometerContainer({ navigate }: { navigate: (v: string) => void }) {
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    const id = EventRegister.addEventListener('wsReceive', (data: Telemetry) => {
      if (data.code === TELEMETRY_CODES.SPEED) {
        setSpeed(Number(data.value));
      }
    });
    return () => {
      EventRegister.removeEventListener(id as string);
    };
  }, []);

  return <Speedometer speed={speed} navigate={navigate} />;
}
```

**Example — `ConnectionContainer.tsx`** (orientation lock + connect flow + the
WebSocket-less fallback, all in hooks):

```tsx
import React, { useEffect, useState } from 'react';
import Orientation from 'react-native-orientation-locker';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Config from 'react-native-config';
import WebSocketNodeJs from '../../utils/websocket';
import { start as startKeepAlive } from '../../utils/keep-alive';
import { sendAll } from '../../utils/settings';
import { receive } from '../../utils/receiver';
import Connection from './components/Connection';
import { RootStackParamList } from '../../../App';

export default function ConnectionContainer() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [domain, setDomain] = useState(Config.WS_SERVER_IP ?? '');

  useEffect(() => {
    Orientation.lockToPortrait();
  }, []);

  const connect = () => {
    if (!domain) return;
    const socket = WebSocketNodeJs.createSocket(domain);
    socket.onopen = () => {
      startKeepAlive();
      void sendAll();
      receive();
      navigation.navigate('Home');
    };
    socket.onerror = () => navigation.navigate('Home'); // open the app without a server
  };

  return <Connection callback={setDomain} domain={domain} connect={connect} />;
}
```

Apply the same transformation to `HomeContainer`, `SpeedContainer`,
`SteerCalibrateContainer`, `ArduinoContainer`, `DriveModeButtonsContainer`,
`BatteryLevelContainer`, `MotorTemperatureContainer`, and `OnOffSetting`. The
presentational components (`components/*.js`) mostly just need renaming to
`.tsx` and typing their props.

---

## 5. Tooling for the app

- **TypeScript / ESLint / Prettier:** the scaffold ships `@react-native/eslint-config`
  and a `tsconfig`. Reuse this repo's [`.prettierrc.json`](.prettierrc.json) for a
  single formatting style across server + app.
- **Jest:** RN 0.85 moved the preset to `@react-native/jest-preset` — set
  `preset: '@react-native/jest-preset'` in the app's Jest config. Port
  `__tests__/App.js` to render `<App />` inside `NavigationContainer`.
- **CI:** extend [`.github/workflows/ci.yml`](.github/workflows/ci.yml) with an
  `app` job (`npm ci`, `tsc --noEmit`, `eslint`, `jest`). A full Android build in
  CI is optional and heavy; gate it behind a manual/tag trigger.

---

## 6. Verification (the part that needs the Android toolchain)

```bash
# 1. Backend: start the simulator (no hardware) — see CLAUDE.md
cd node_server && SIMULATE=true npm start          # or: docker compose up --build

# 2. App
npx react-native start --reset-cache               # Metro
npx react-native run-android                        # build + install on the AVD
```

Then, in the app:
1. Enter the dev machine's LAN IP on the Connect screen (the simulator binds `0.0.0.0:8085`).
2. Confirm the dashboard shows live **speed / battery / motor-temp** (the simulator streams them).
3. Press the drive buttons → the server log prints the received commands, and speed rises (keep-alive keeps it alive; stop sending → safety-stop to 0).

Run `npx react-native doctor` to catch toolchain gaps before building.

---

## 7. Migration checklist

- [ ] Install JDK 17, Android SDK 35, create an AVD
- [ ] Scaffold RN 0.85, copy `applicationId`, app name, icons, `.env*`
- [ ] Confirm `minSdk 24 / compileSdk 35 / targetSdk 35`
- [ ] Install replacement deps (§3) and run autolinking
- [ ] `react-native-orientation-locker`: `MainActivity.onConfigurationChanged` + manifest `configChanges`
- [ ] Port `index.js`, `App.tsx` (navigation v7), delete `src/config/routes.js`
- [ ] Migrate `src/utils/*` to TS + `shared/protocol` (**`sp`→`sf` resolved**, see §4.3)
- [ ] Convert all containers to function components + hooks
- [ ] Rename presentational components to `.tsx`, type their props
- [ ] App `tsconfig` includes `shared`; `tsc --noEmit` clean
- [ ] ESLint + Prettier clean; port the Jest smoke test
- [ ] `react-native run-android` boots; dashboard shows simulator telemetry
- [ ] Build a signed release (`./gradlew assembleRelease`) with a real keystore
```

---

## 8. Post-upgrade fix: simultaneous throttle + steer (gesture-handler)

Real-car testing surfaced a control bug the simulator can't reproduce: holding
the throttle and pressing a steer button **at the same time** did nothing — the
second press was swallowed.

**Cause — not the server or the Arduino, the app's touch layer.** The four drive
buttons were `Pressable`s, and React Native's JS gesture responder system grants
the "responder" role to a single view at a time. Once the throttle button became
the responder on the first touch, a second finger on a steer button could not
claim its own responder, so its `onPressIn` never fired and the steer command
(`dba`/`dbd`) was never sent. The bridge forwards every WebSocket message
verbatim (`link.write(raw)` in `server.ts`), so the second command provably
never left the phone — app-side, not the wire or the car.

**Fix — `react-native-gesture-handler` 3.x** (new runtime dependency). RNGH
recognises each gesture independently on the native thread, so multiple buttons
can be held at once and a press registers even while the JS thread is busy
animating the gauges. Changes:
- `index.js`: `import 'react-native-gesture-handler';` as the first import.
- `App.tsx`: wrap the tree in `<GestureHandlerRootView style={{ flex: 1 }}>`.
- `DriveButton.tsx`: replace `Pressable` with a `GestureDetector` running
  `Gesture.LongPress().minDuration(0)`; press on `onBegin`, release on
  `onFinalize` (RNGH guarantees they pair, so the throttle can't stick on).
  Reanimated is **not** installed, so the gesture callbacks run on the JS thread
  and call `send()` directly — no `runOnJS` needed.

**Verify on-device** (Jest/the simulator can't exercise native multi-touch): run
the bridge with `LOG_LEVEL=debug npm run dev -- --verbose`, hold gas, then press
steer — the log should now show both `dbw`/`dbs` **and** `dba`/`dbd` arriving
together (before the fix, only the throttle codes appeared). Autolinking pulls in
the native module, so this needs an **APK rebuild** (same Apple-Silicon `aapt2`
caveat as the rest of the native build — build via CI/x86 or a local SDK).

---

## 9. Variable-throttle touchpad (2026)

The two forward/reverse drive buttons were replaced by a left-side vertical
throttle touchpad (`ThrottlePad`): top three-quarters for variable forward
(0..100%), bottom quarter for fixed reverse, boundary neutral, spring-return.
The `dv` drive-state wire frame now carries a third component — a forward level
magnitude ('dvfc80' = forward, centre, 80%; neutral/'dvnc' and reverse/'dvbc'
never carry a level). See `shared/protocol.ts` (DRIVE_LEVEL_MIN/MAX/STEP and
`encodeDriveState`), `src/utils/throttle-curve.ts` (app-side expo mapping), and
CLAUDE.md §drive-controls. The firmware maps 0..100 linearly onto the ESC angle
(90° idle to `speedFactor`°), so the Speed (`sf`) setting is now the max-speed
ceiling.

