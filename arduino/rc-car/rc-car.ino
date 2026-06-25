// Name Commands
// mt -> motor temperature
// sp -> car speed
// bt -> battery type
// bv -> battery voltage
// rs -> range sensor problem

#include <Wire.h>
#include <string.h>
// Servo Motor
#include <Servo.h>
// Timer
#include <SimpleTimer.h>
// Range Sensors
#include <NewPing.h>

Servo driveSrv;
Servo turnservo;
Servo rSensServo;
SimpleTimer timer;

const int drivePin = 11;
int speedFactor = 120;
const int steer = 9;
int driveMode = 1;
String inByte;
int connectionT;
int tempMotorT;
int rangeT;
int batVolt;
int neutralT;
//char *endChar = "X";
// Steer Calibrated Angle
int steerCalib = 0;

// LM35 Temp. Sensor
const int tempPin = A0;

// Battery Voltage
const int voltPin = A1;

// Car Lights
byte lightsState = 0;
const int lightsLED = 12;
byte longLightsState = 0;
const int longLightLED = 4;
// Bottom Lights
const int redLED = 5;
const int blueLED = 6;
//const int greenLED = 3;

// Car Blinkers
byte blinkersState = 0;
const int blinkLLED = 7;
const int blinkRLED = 8;
byte blinkON = 0;
char blinkSide;
byte ledState = 0;
unsigned long currentMillis;
long previousMillis = 0;
long interval = 500;
// All 4 Blinkers
byte blinkers4State = 0;

// Stop Lights
const int stopLED = 13;

// Car Speed
volatile int rpmcount = 0;
volatile int direction = 2;   // Neutral
int rpm = 0;
unsigned long lastmillis = 0;
int carSpeed = 0;
volatile char speedDirection;
const int directionPin = 3;

// Range Sensors (Front)
byte rsensorsOn = 1;
const int frsServo = 10;
const int frsTrig = A3;
const int frsEcho = A2;
int currPos = 90;
long prevMill = 0;
int rInterval = 100;  // (ms)
int rDeg = 5;   // (koraki v  )
int frsDistance = 400;
NewPing sonarFr(frsTrig, frsEcho, frsDistance);
int servoCalib = 0;

byte preventNeutral = 0;
byte preventBackward = 0;

// Range Sensors (Back)
const int bcsTrig = A5;
const int bcsEcho = A4;
int bcsDistance = 20;
NewPing sonar(bcsTrig, bcsEcho, bcsDistance);


void setup() {
  Serial.begin(19200);
  // Drive 
  driveSrv.attach(drivePin);
  driveSrv.write(90);
  // Steer 
  turnservo.attach(steer);
  turnservo.write(90);

  // PINS CONFIG
  pinMode(steer, OUTPUT);
  pinMode(tempPin, INPUT);
  pinMode(voltPin, INPUT);
  pinMode(lightsLED, OUTPUT);
  pinMode(longLightLED, OUTPUT);
  pinMode(blinkLLED, OUTPUT);
  pinMode(blinkRLED, OUTPUT);
  pinMode(stopLED, OUTPUT);
  pinMode(frsTrig, OUTPUT);
  pinMode(frsEcho, INPUT);
  pinMode(bcsTrig, OUTPUT);
  pinMode(bcsEcho, INPUT);
  pinMode(redLED, OUTPUT);
  pinMode(blueLED, OUTPUT);
  //pinMode(greenLED, OUTPUT);
  pinMode(directionPin, INPUT);
    
  // Set Timer
  connectionT = timer.setInterval(300, stopCar);
  tempMotorT = timer.setInterval(3000, tempMotor);
  rangeT = timer.setInterval(35, frangeS);
  batVolt = timer.setInterval(30000, battVoltage);

  // DEFAULT STATES  
  // LED
  analogWrite(redLED, 0);
  analogWrite(blueLED, 0);
  //analogWrite(greenLED, 0);

  // Car Lights
  digitalWrite(lightsLED, 0);
  digitalWrite(longLightLED, 0);

  // Car Blinkers
  digitalWrite(blinkLLED, 0);
  digitalWrite(blinkRLED, 0);

  // Stop Lights
  digitalWrite(stopLED, 0);

  // Range Sensors (Front/Back)
  rSensServo.attach(frsServo);
  rSensServo.write(90);
  digitalWrite(frsTrig, 0);
  digitalWrite(frsEcho, 0);
  digitalWrite(bcsTrig, 0);
  digitalWrite(bcsEcho, 0);

  // read RPM
  attachInterrupt(0, car_rpm, FALLING);
}

void loop() {
  // Start Timer
  timer.run();

  // Start Millis Function (Blinkers)
  currentMillis = millis();

  // Blinkers
  if (blinkersState == 1 && blinkON == 1) {
    if(currentMillis - previousMillis > interval) {
      previousMillis = currentMillis;  
      blinkers(blinkSide);
    }
  }
  // All 4 Blinkers
  if (blinkers4State == 1) {
    if(currentMillis - previousMillis > interval) {
      previousMillis = currentMillis;
      blinkers4();
    }
  }

  // Car Speed
  if (currentMillis - lastmillis > 500) { //Uptade every one second, this will be equal to reading frecuency (Hz).
    detachInterrupt(0);
    rpm = rpmcount * 60; // Convert frequency to RPM, note: this works for one interruption per full rotation. For two interrupts per full rotation use rpmcount * 30.
    carSpeed = rpm * 0.245 * 0.06;
    Serial.print(String("sp") + carSpeed + String("X"));

    rpmcount = 0;
    lastmillis = currentMillis;
    attachInterrupt(0, car_rpm, FALLING);
  }

  // Move Front Servo for Range Sensor
  if(rsensorsOn == 1) {
    moveServo();
  }


  if(Serial.available()) {
        
    inByte = Serial.readStringUntil('\n');

    // Keep Alive
    if(inByte.startsWith("kp")) {
      // Restart Timer
      timer.restartTimer(connectionT);
      analogWrite(redLED, 0);
      analogWrite(blueLED, 255);
    }

    // Stop the Car On Exit DriveMode 2 (Accelerometers)
    if(inByte.startsWith("st")) {
      stopCar();
    }


    /////////////////
    // DRIVE MODE //
    //////////////// 
    if(inByte.startsWith("dm")) {
      String dm = inByte.substring(2);
      driveMode = conToInt(dm);
    }
    
    // Drive with Buttons
    if(driveMode == 1) {

      if(inByte.startsWith("db")) {
      
        String comm = inByte.substring(2);

        // Forward
        if(comm == "w") {
          driveSrv.write(speedFactor);

          preventNeutral = 0;
          preventBackward = 0;
          // Stop Lights
          digitalWrite(stopLED, 0);
        }
        // Reverse
        if(comm == "s" && preventBackward != 1) {
          driveSrv.write(15);

          preventNeutral = 0;
          // All 4 Blinkers
          blinkers4State = 1;

          // Stop Lights
          digitalWrite(stopLED, 0);
        }
        // Stop 
        if(comm == "x" && preventNeutral != 1) {
          driveSrv.write(90);

          // All 4 Blinkers (Off)
          blinkers4State = 0;
          ledState = 0;
          digitalWrite(blinkLLED, 0);
          digitalWrite(blinkRLED, 0);

          // Stop Lights
          digitalWrite(stopLED, 1);
        }
        // Left
        if(comm == "a") {
          turnservo.write(65 + steerCalib);

          // Blinkers
          if(blinkersState == 1 && blinkers4State == 0) {
            blinkON = 1;
            blinkSide = 'l';
          }
        }
        // Right
        else if(comm == "d") {
          turnservo.write(115 + steerCalib);

          // Blinkers
          if(blinkersState == 1 && blinkers4State == 0) {
            blinkON = 1;
            blinkSide = 'r';
          }
        }
        // Aligned
        else if(comm == "g") {
          turnservo.write(90 + steerCalib);

          // Blinkers (Off)
          blinkON = 0;
          ledState = 0;
          digitalWrite(blinkLLED, 0);
          digitalWrite(blinkRLED, 0);
        }

      } 
    }

    // Drive with Accelerometers
    else if (driveMode == 2) {

      String st = inByte.substring(2);
      int steerAng = conToInt(st);

      // Forward & Backward
      if(inByte.startsWith("ad")) {
        driveSrv.write(steerAng);
      }
      // Left/Right
      else if(inByte.startsWith("as")) {
        turnservo.write(90 + steerAng + steerCalib);
      }
    }

    //////////////
    // OPTIONS //
    /////////////
    
    // Steer Calibrated Angle
    if(inByte.startsWith("sc")) {
      String sc = inByte.substring(2);
      steerCalib = conToInt(sc);
      turnservo.write(90 + steerCalib);
    }

    // Range Sensor Servo Calibrate
    if(inByte.startsWith("rc")) {
      String rc = inByte.substring(2);
      servoCalib = conToInt(rc);
      rSensServo.write(90 - servoCalib);
    }

    // Car Lights
    if(inByte.startsWith("cl")) {
      String cl = inByte.substring(2);
      lightsState = conToInt(cl);

      if(lightsState == 1) {
        digitalWrite(lightsLED, 1);
      } else {
        digitalWrite(lightsLED, 0);
      }
    }

    // Car Long Lights
    if(inByte.startsWith("ll")) {
      String ll = inByte.substring(2);
      longLightsState = conToInt(ll);

      if (longLightsState == 1) {
        digitalWrite(longLightLED, 1);
      } else {
        digitalWrite(longLightLED, 0);
      }
    }

    // Car Blinkers
    if(inByte.startsWith("bl")) {
      String bl = inByte.substring(2);
      blinkersState = conToInt(bl);
    }

    // Car All 4 Blinkers
    if (inByte.startsWith("b4")) {
      String b4 = inByte.substring(2);
      blinkers4State = conToInt(b4);
      if (blinkers4State == 0) {
        ledState = 0;
        digitalWrite(blinkLLED, 0);
        digitalWrite(blinkRLED, 0);
      }
    }

    // Speed Factor
    if (inByte.startsWith("sf")) {
      String sf = inByte.substring(2);
      speedFactor = conToInt(sf);
    }

    // Range Sensors
    if(inByte.startsWith("rs")) {
      String rs = inByte.substring(2);
      rsensorsOn = conToInt(rs);

      if(rsensorsOn == 1) {
        timer.enable(rangeT);
      } else {
        timer.disable(rangeT);
        rSensServo.write(90 - servoCalib);
      }
    }


    // Clear the data in the serial buffer
    //Serial.flush();
  }
}

// Stop The Car
void stopCar() {
  if(carSpeed > 0 && speedDirection == 'f') {
    driveSrv.write(15);
    turnservo.write(90 + steerCalib);
    preventNeutral = 1;
  } else {
    driveSrv.write(90);
    turnservo.write(90 + steerCalib);
    preventNeutral = 0;
  }

  analogWrite(redLED, 255);
  analogWrite(blueLED, 0);
}

// Car Speed (read RPM)
void car_rpm() {
  rpmcount++;
  car_dir();

  /*if(direction == 0 && speedDirection == 'f') {  // OK
    speedDirection = 'f';
  } else if(direction == 0 && speedDirection == 'b') {  // OK
    speedDirection = 'b';
  } else if(direction == 1 && speedDirection == 'b') {  // OK
    speedDirection = 'f';
  } else {  // OK
    speedDirection = 'f';
  }
  direction = 1;*/
}
// Car Direction
void car_dir() {
  volatile int readDirection = digitalRead(directionPin);
  if(readDirection == 1) {
    speedDirection = 'b';
  } else {
    speedDirection = 'f';
  }

  /*if(direction == 1 && speedDirection == 'f') {  // OK
    speedDirection = 'f';
  } else if(direction == 1 && speedDirection == 'b') {  // OK
    speedDirection = 'b';
  } else if(direction == 0 && speedDirection == 'f') {  // OK
    speedDirection = 'b';
  } else {  // OK
    speedDirection = 'b';
  }
  direction = 0;*/
}

// Motor Temperature
void tempMotor() {
  // LM35
  int tempC = (5.0 * analogRead(tempPin) * 100.0) / 1024;
  Serial.print(String("mt") + tempC + String("X"));

  // Critical Temperature
  int criticalTemp = 50;
  if (tempC >= criticalTemp) {
    stopCar();
  }
}

// Battery Voltage
void battVoltage() {
  // MAX (16,8V) => 675 => 3,3V
    // (15,8V) => 614 => 3V
    // 1V => 60 enot
    // 16mV => 1 enota

  int battData = analogRead(voltPin);
  Serial.print(String("bv") + battData + String("X"));
}

// Car Blinkers
void blinkers(char side) {
  // Left
  if(side == 'l') {
    if (ledState == 0) {
      ledState = 1;
    } else {
      ledState = 0;
    }
    digitalWrite(blinkLLED, ledState);
  } 
  // Right
  else if (side == 'r') {
    if (ledState == 0) {
      ledState = 1;
    } else {
      ledState = 0;
    }
    digitalWrite(blinkRLED, ledState);
  }
}

// Car All 4 Blinkers
void blinkers4() {
  if (ledState == 0) {
    ledState = 1;
  } else {
    ledState = 0;
  }
  digitalWrite(blinkLLED, ledState);
  digitalWrite(blinkRLED, ledState);
}

// Front Range Sensors
void frangeS() {
  // Range Sensor (Front)
  // Wait 50ms between pings (about 20 pings/sec). 29ms should be the shortest delay between pings.
  unsigned int frsRange = sonarFr.ping_cm();  

  // 1. verzija => ko bo smer OK
  //if(frsRange != 0 && frsRange < obstacleDist) {
  //if(frsRange != 0 && frsRange < carSpeed*10) {
  if(frsRange != 0 && frsRange < speedFactor*2.4) {
    // Brake
    if(speedDirection == 'f') {
      driveSrv.write(15);
      preventNeutral = 1;

      // Stop Lights
      digitalWrite(stopLED, 1);
    }
    // To Neutral
    else if(speedDirection = 'b' && preventNeutral == 1) {
      driveSrv.write(90);
      preventNeutral = 0;
    }
    analogWrite(redLED, 255);
    analogWrite(blueLED, 0);
  }

  // 2. verzija => Casovno
  /*if(frsRange != 0 && frsRange < carSpeed*10) {
    // Brake
    if(speedDirection == 'f') {
      driveSrv.write(15);
      preventNeutral = 1;
      neutralT = timer.setTimer(carSpeed*100, toNeutral, 1);

      // Stop Lights
      digitalWrite(stopLED, 1);
    }
    analogWrite(redLED, 255);
    analogWrite(blueLED, 0);
  }*/


  // Range Sensor (Back)
  unsigned int bcsRange = sonar.ping_cm();
  if(bcsRange != 0 && bcsRange < bcsDistance) {
    preventBackward = 1;  // prevent to go Backward if the obstacle is too close
  }
}
/*void toNeutral() {
  driveSrv.write(90);
  speedDirection = 'n'; // zakomentirat, ko bo smer OK
}*/
// Servo - Front Range Sensor 
void moveServo() {
  if(currentMillis - prevMill > rInterval) {
    prevMill = currentMillis;
    currPos = (currPos - (rDeg));
    rSensServo.write(currPos - servoCalib);
    if(currPos == 75) {
      rDeg = -5;
    } else if(currPos == 105) {
      rDeg = 5;
    }
  }
}

// Convert to INT
int conToInt(String data) {
  char carray[data.length() + 1];
  data.toCharArray(carray, sizeof(carray));
  return atoi(carray);
}
