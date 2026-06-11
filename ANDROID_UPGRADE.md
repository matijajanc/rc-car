# RC Car — Android / React Native Upgrade Guide

**Goal:** bring the app from React Native **0.54.2 (2018)** to **0.85 (latest)** on a
modern Android toolchain, while migrating the JS to **TypeScript + hooks** and
wiring it to the new typed [`shared/protocol.ts`](shared/protocol.ts).

> **Why this is a guide and not a finished diff.** This repository was modernised
> on a machine with **no Java, no Android SDK, and no emulator**, so the native
> Android build cannot be compiled or run here — shipping unverified native code
> would be dishonest. Equally important: **hooks require React ≥ 16.8, but this
> project ships React 16.3-alpha, and Metro 0.54 cannot resolve `.ts`/`.tsx`.**
> So the TypeScript + hooks migration is *physically coupled* to the RN upgrade —
> it can only run once React/Metro are upgraded. This document carries that
> migration as concrete, ready-to-apply code so you can execute and verify it on
> a machine with the Android toolchain.

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

> ⚠️ **Verify against the firmware.** The old `SpeedContainer` sent `sp<value>`
> for the speed *setting*, but `sp` is also the *incoming speed telemetry* code,
> and the documented command for speed factor is `sf`. Confirm which the Arduino
> expects before standardising — don't blindly switch `sp`→`sf` or you may change
> car behaviour. [`shared/protocol.ts`](shared/protocol.ts) defines `SPEED_FACTOR = 'sf'`
> per the legacy comments; adjust if the firmware says otherwise.

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
- [ ] Migrate `src/utils/*` to TS + `shared/protocol` (and **verify `sp` vs `sf`**)
- [ ] Convert all containers to function components + hooks
- [ ] Rename presentational components to `.tsx`, type their props
- [ ] App `tsconfig` includes `shared`; `tsc --noEmit` clean
- [ ] ESLint + Prettier clean; port the Jest smoke test
- [ ] `react-native run-android` boots; dashboard shows simulator telemetry
- [ ] Build a signed release (`./gradlew assembleRelease`) with a real keystore
```
