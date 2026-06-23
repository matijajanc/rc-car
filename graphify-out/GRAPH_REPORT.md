# Graph Report - .  (2026-06-17)

## Corpus Check
- 158 files · ~68,174 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 573 nodes · 943 edges · 42 communities (37 shown, 5 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.83)
- Token cost: 197,396 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_App Navigation & Connection|App Navigation & Connection]]
- [[_COMMUNITY_Shared UI Components & Styles|Shared UI Components & Styles]]
- [[_COMMUNITY_Backend NPM Dependencies|Backend NPM Dependencies]]
- [[_COMMUNITY_Project Docs & Architecture|Project Docs & Architecture]]
- [[_COMMUNITY_Drive Controls & Speedometer|Drive Controls & Speedometer]]
- [[_COMMUNITY_Home Screen & Icons|Home Screen & Icons]]
- [[_COMMUNITY_Battery & Motor Gauges|Battery & Motor Gauges]]
- [[_COMMUNITY_iOS Native Bootstrap|iOS Native Bootstrap]]
- [[_COMMUNITY_App Dev Dependencies|App Dev Dependencies]]
- [[_COMMUNITY_CommandTelemetry Protocol|Command/Telemetry Protocol]]
- [[_COMMUNITY_Bridge Server & Logging|Bridge Server & Logging]]
- [[_COMMUNITY_Car Simulator|Car Simulator]]
- [[_COMMUNITY_Base TypeScript Config|Base TypeScript Config]]
- [[_COMMUNITY_App Runtime Dependencies|App Runtime Dependencies]]
- [[_COMMUNITY_CarLink Interface & Serial|CarLink Interface & Serial]]
- [[_COMMUNITY_Arduino Options Screen|Arduino Options Screen]]
- [[_COMMUNITY_Driving Dashboard Screenshot|Driving Dashboard Screenshot]]
- [[_COMMUNITY_Home Menu Screenshot|Home Menu Screenshot]]
- [[_COMMUNITY_Logger Class|Logger Class]]
- [[_COMMUNITY_Serial Car Link|Serial Car Link]]
- [[_COMMUNITY_App NPM Scripts|App NPM Scripts]]
- [[_COMMUNITY_Backend Config & Entrypoint|Backend Config & Entrypoint]]
- [[_COMMUNITY_Arduino Pin Reference Screenshot|Arduino Pin Reference Screenshot]]
- [[_COMMUNITY_Connect Screen Screenshot|Connect Screen Screenshot]]
- [[_COMMUNITY_Backend TypeScript Config|Backend TypeScript Config]]
- [[_COMMUNITY_Server Test MockLink|Server Test MockLink]]
- [[_COMMUNITY_App TypeScript Config|App TypeScript Config]]
- [[_COMMUNITY_Android MainActivity|Android MainActivity]]
- [[_COMMUNITY_Android MainApplication|Android MainApplication]]
- [[_COMMUNITY_Steer Calibrate Screenshot|Steer Calibrate Screenshot]]
- [[_COMMUNITY_App Package Metadata|App Package Metadata]]
- [[_COMMUNITY_Prettier Config|Prettier Config]]
- [[_COMMUNITY_Serial Test FakePort|Serial Test FakePort]]
- [[_COMMUNITY_Metro Config|Metro Config]]

## God Nodes (most connected - your core abstractions)
1. `React` - 42 edges
2. `colors` - 30 edges
3. `CarSimulator` - 18 edges
4. `Logger` - 16 edges
5. `compilerOptions` - 16 edges
6. `SerialCarLink` - 14 edges
7. `CLAUDE.md project guidance` - 12 edges
8. `scripts` - 10 edges
9. `scripts` - 10 edges
10. `Driving Dashboard Screenshot` - 10 edges

## Surprising Connections (you probably didn't know these)
- `CI Workflow — node_server job` --references--> `startBridge()`  [INFERRED]
  .github/workflows/ci.yml → node_server/src/server.ts
- `startBridge()` --references--> `CarLink abstraction (interchangeable serial / simulator link)`  [INFERRED]
  node_server/src/server.ts → CLAUDE.md
- `CarSimulator` --references--> `Hardware-free car simulator`  [INFERRED]
  node_server/src/simulator.ts → CLAUDE.md
- `CarSimulator` --references--> `Keep-alive safety stop`  [INFERRED]
  node_server/src/simulator.ts → CLAUDE.md
- `Speed-setting code fix (sp → sf SPEED_FACTOR)` --rationale_for--> `frameCommand()`  [INFERRED]
  ANDROID_UPGRADE.md → shared/protocol.ts

## Import Cycles
- 1-file cycle: `metro.config.js -> metro.config.js`

## Hyperedges (group relationships)
- **CarLink interface and its interchangeable implementations** — concept_carlink_abstraction, simulator_carsimulator, server_startbridge [INFERRED 0.85]
- **App-to-car outgoing command flow (keep-alive/settings → transmitter → frameCommand)** — keep_alive_start, settings_sendall, transmitter_send, protocol_framecommand [INFERRED 0.85]
- **Car-to-app telemetry decode + event-bus flow** — receiver_receive, protocol_parsetelemetrystream, concept_event_bus_telemetry [INFERRED 0.85]

## Communities (42 total, 5 thin omitted)

### Community 0 - "App Navigation & Connection"
Cohesion: 0.07
Nodes (41): RootStackParamList, Stack, ArduinoContainer(), ConnectionStatus, Props, Props, SteerCalibrate(), ConnectionContainer() (+33 more)

### Community 1 - "Shared UI Components & Styles"
Cohesion: 0.07
Nodes (32): Props, Props, Props, Speed(), styles, STATUS_COLOR, STATUS_LABEL, styles (+24 more)

### Community 2 - "Backend NPM Dependencies"
Cohesion: 0.06
Nodes (35): dependencies, ws, description, devDependencies, eslint, eslint-config-prettier, @eslint/js, globals (+27 more)

### Community 3 - "Project Docs & Architecture"
Cohesion: 0.10
Nodes (27): RC Car Android / React Native Upgrade record, App(), displayName, name, CI Workflow — node_server job, CLAUDE.md project guidance, Apple-Silicon aapt2 native-build caveat, Hardware-free car simulator (+19 more)

### Community 4 - "Drive Controls & Speedometer"
Cohesion: 0.10
Nodes (14): DriveModeButton(), Props, circularSettings, Props, Speedometer(), DashboardOption(), DashboardOptionProps, InjectedProps (+6 more)

### Community 5 - "Home Screen & Icons"
Cohesion: 0.10
Nodes (13): Home(), Props, Props, ArduinoIcon(), BlinkersIcon(), RangeSensorsIcon(), SpeedIcon(), SteerCalibrateIcon() (+5 more)

### Community 6 - "Battery & Motor Gauges"
Cohesion: 0.15
Nodes (21): BatteryLevelContainer(), CIRCLES, PATHS, Segment, SEGMENTS, styles, TEXTS, CIRCLES (+13 more)

### Community 7 - "iOS Native Bootstrap"
Cohesion: 0.13
Nodes (16): Any, Bool, AppDelegate, ReactNativeDelegate, RCTBridge, RCTDefaultReactNativeFactoryDelegate, RCTReactNativeFactory, React_RCTAppDelegate (+8 more)

### Community 8 - "App Dev Dependencies"
Cohesion: 0.10
Nodes (20): devDependencies, @babel/core, @babel/preset-env, @babel/runtime, eslint, jest, prettier, @react-native/babel-preset (+12 more)

### Community 9 - "Command/Telemetry Protocol"
Cohesion: 0.17
Nodes (15): receiver receive(), COMMAND_CODES, COMMAND_NAMES, CommandCode, decodeTelemetryFrame(), encodeCommand(), frameCommand(), isString() (+7 more)

### Community 10 - "Bridge Server & Logging"
Cohesion: 0.13
Nodes (10): commandName(), ServerConfig, LEVEL_WEIGHT, LogEntry, LoggerOptions, LogLevel, Bridge, BridgeOptions (+2 more)

### Community 11 - "Car Simulator"
Cohesion: 0.14
Nodes (5): CarLink abstraction (interchangeable serial / simulator link), parseCommandStream(), CarSimulator, DEFAULTS, SimulatorOptions

### Community 12 - "Base TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, noFallthroughCasesInSwitch, noImplicitReturns (+9 more)

### Community 13 - "App Runtime Dependencies"
Cohesion: 0.13
Nodes (15): dependencies, react, react-native, @react-native-async-storage/async-storage, react-native-circular-progress, @react-native-community/slider, react-native-config, react-native-event-listeners (+7 more)

### Community 14 - "CarLink Interface & Serial"
Cohesion: 0.19
Nodes (6): CarLink, Emitter, PortFactory, SerialOptions, SerialPortConstructor, SerialPortLike

### Community 15 - "Arduino Options Screen"
Cohesion: 0.25
Nodes (5): Props, PinItem, Props, ArduinoSection, Props

### Community 16 - "Driving Dashboard Screenshot"
Cohesion: 0.27
Nodes (11): Driving Dashboard Screenshot, BatteryLevel, Blinkers, Connection, DriveModeButtons, Landscape Orientation Lock, Lights, Monochrome Dark Theme (+3 more)

### Community 17 - "Home Menu Screenshot"
Cohesion: 0.33
Nodes (11): RC Car Home Menu Screen, Arduino Uno R3 Options, Blinkers, Connection, DriveModeButtons, Home, Monochrome Dark Theme, OnOffSetting Toggle (+3 more)

### Community 20 - "App NPM Scripts"
Cohesion: 0.20
Nodes (10): scripts, android, android-dev, android-prod, build-android-prod, ios, lint, start (+2 more)

### Community 21 - "Backend Config & Entrypoint"
Cohesion: 0.38
Nodes (8): defaultSerialPath(), envBool(), envInt(), envLogLevel(), loadConfig(), main(), wantsVerbose(), startBridge()

### Community 22 - "Arduino Pin Reference Screenshot"
Cohesion: 0.25
Nodes (9): Arduino Uno R3 Pin Reference Screen, Analog Pins Assignment List, Arduino Uno R3 Board Diagram, Battery Voltage Input, BatteryLevel, Digital Pins Section, Ultrasonic Distance Sensors (Echo/Trig), Engine Temperature Sensor (LM35) (+1 more)

### Community 23 - "Connect Screen Screenshot"
Cohesion: 0.36
Nodes (8): Connect Screen (screenshot), ROBOTLEC App Branding, Connect Button, Connection, Monochrome Dark Theme, Open Without Connecting Fallback, Portrait Orientation Menu, Server IP Input

### Community 24 - "Backend TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, module, moduleResolution, noEmit, types, extends, include

### Community 26 - "App TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, allowJs, checkJs, types, exclude, extends, include

### Community 27 - "Android MainActivity"
Cohesion: 0.29
Nodes (4): MainActivity, ReactActivity, ReactActivityDelegate, String

### Community 28 - "Android MainApplication"
Cohesion: 0.33
Nodes (4): Application, MainApplication, ReactApplication, ReactHost

### Community 29 - "Steer Calibrate Screenshot"
Cohesion: 0.53
Nodes (6): Steer Calibrate Screen (screenshot), Back Navigation Header, Connection, Monochrome Dark Theme, Steer Trim Stepper Control, SteerCalibrate

### Community 30 - "App Package Metadata"
Cohesion: 0.33
Nodes (5): engines, node, name, private, version

### Community 31 - "Prettier Config"
Cohesion: 0.33
Nodes (5): printWidth, semi, singleQuote, tabWidth, trailingComma

## Knowledge Gaps
- **209 isolated node(s):** `printWidth`, `singleQuote`, `trailingComma`, `semi`, `tabWidth` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `React` connect `App Navigation & Connection` to `Shared UI Components & Styles`, `Drive Controls & Speedometer`, `Home Screen & Icons`, `Battery & Motor Gauges`, `iOS Native Bootstrap`, `App Runtime Dependencies`, `Arduino Options Screen`?**
  _High betweenness centrality (0.271) - this node is a cross-community bridge._
- **Why does `dependencies` connect `App Runtime Dependencies` to `App Package Metadata`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `react` connect `App Runtime Dependencies` to `App Navigation & Connection`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `CarSimulator` (e.g. with `Hardware-free car simulator` and `CarLink abstraction (interchangeable serial / simulator link)`) actually correct?**
  _`CarSimulator` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `printWidth`, `singleQuote`, `trailingComma` to the rest of the system?**
  _212 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Navigation & Connection` be split into smaller, more focused modules?**
  _Cohesion score 0.0701484895033282 - nodes in this community are weakly interconnected._
- **Should `Shared UI Components & Styles` be split into smaller, more focused modules?**
  _Cohesion score 0.06721215663354763 - nodes in this community are weakly interconnected._