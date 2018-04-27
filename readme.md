# RC Car - Mobile App

This is a presentational project how it is possible to drive an RC car with a mobile app. Yes, of course you need to have a car able to communicate through Zigbee or Wifi for this to work.

Here on this page <www.robotlec.com> you can see  for what kind of project it goes, there you can still find an old code that was now rewritten. Phonegap app was rewritten in React Native and web server written in .NET using SignalR library was replaced with simpler NodeJs and Websocket library, so now you don’t need a Windows server no more to run it.

Code for React Native is written in container component pattern style. The main purpose of this pattern is that you separate business logic and presentation components. 
More you can read on this [link](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0)

![alt text](http://tvojnet.si/drive_mode.gif "Drive Mode")

## Getting Started

First you need to install React Native with dependencies, how to do this follow instructions on this [link](https://facebook.github.io/react-native/docs/getting-started.html )

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