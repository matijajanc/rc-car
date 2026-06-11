# RC Car - Mobile App

This is an example project that allows you to drive an RC car with a mobile app. Yes, of course you need to have a car able to communicate through Zigbee or Wifi for this to work.

Here on this page [www.robotlec.com](http://www.robotlec.com) you can see from where this project originated from, here you can still find the old code that was rewritten now. Phonegap app was rewritten in React Native and the web server was written in .NET using the SignalR library, which was replaced with simpler NodeJs and a Websocket library, so now you don't need a Windows server anymore to run it.

Code for React Native is written in a container component pattern style. The main purpose of this pattern is that you have the business logic and presentation components separate. 
Here you can read more on [this](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0)



| Connection Screen | Home Screen | Steer Calibrate | Arduino Settings |
| --- | --- | --- | --- |
| ![alt text](https://github.com/matijajanc/rc-car/blob/master/github-images/screen1.png "Connect Screen") | ![alt text](https://github.com/matijajanc/rc-car/blob/master/github-images/screen2.png "Home Screen") | ![alt text](https://github.com/matijajanc/rc-car/blob/master/github-images/screen3.png "Steer Calibrate") | ![alt text](https://github.com/matijajanc/rc-car/blob/master/github-images/screen4.png "Arduino Settings") |
| First you need to insert an IP address depending on where the NodeJs server is running. | Here from your home screen you can set additional setting for your RC car. | For this RC car I'm using a servo motor for left/right steering, and sometimes you need to calibrate the steering so that it goes perfectly straight. | Just some Arduino info for myself which helps me to know which wire is which. |
 
| Dashboard Drive Mode |
| --- |
| ![alt text](https://github.com/matijajanc/rc-car/blob/master/github-images/dashboard_rotated.gif "Dashboard") |
| In the main driving mode, you drive with buttons. Here you have buttons for going forward/backward and from left/right, plus you have speedometer. |

## Getting Started

First you need to install React Native with dependencies, in order to do this follow instructions in this [link](https://facebook.github.io/react-native/docs/getting-started.html )

Run
```
npm install
```

Rename .env.example to .env and correct Server IP and Port

### Run app in simulator or on a physical device

Android

```
react-native run-android
```

iOS

```
react-native run-ios
```

### NodeJS server (websocket bridge + simulator)

The server is the bridge between the app and the car's Arduino. It now ships a
**car simulator**, so you can run and "drive" the whole stack with **no hardware**.

From the `node_server` sub-folder:

```
npm install
npm run dev        # hot-reload; simulator on by default (SIMULATE=true)
```

Or fully isolated in Docker, from the repo root:

```
docker compose up --build      # bridge + simulator on :8085
```

To talk to a **real car** instead of the simulator, run on the machine wired to
the Arduino with the serial port configured:

```
SIMULATE=false SERIAL_PATH=/dev/ttyUSB0 SERIAL_BAUD=19200 npm start
```

See `node_server/.env.example` for all options. The server is TypeScript, typed,
and covered by tests (`npm test`) and CI.

### Upgrading the app

The mobile app is still on React Native 0.54 (2018). A complete, step-by-step
upgrade to the latest React Native (TypeScript + hooks + React Navigation v7)
is documented in [ANDROID_UPGRADE.md](ANDROID_UPGRADE.md).