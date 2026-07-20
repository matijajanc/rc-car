/*
 * RC car firmware — Arduino Uno.
 *
 * Talks to the NodeJS bridge over serial at 19200 baud. The wire protocol is
 * the single source of truth in shared/protocol.ts:
 *   App -> car : "<2-char code><value>\n"   (newline-terminated)
 *   Car -> app : "<2-char code><value>X"    (X-terminated)
 *
 * Telemetry the car streams:  mt motor temp · sp speed · bv battery · rs front obstacle
 * Commands the car accepts:   dv drive state · st stop · sc steer trim ·
 *                             rc range-servo trim · sf speed factor · rs range sensors on/off ·
 *                             cl lights · ll long lights · bl blinkers · b4 hazards ·
 *                             lc underglow colour ("lc<r>,<b>")
 *
 * Safety model — the "motion lease". There is NO keep-alive. The app streams
 * the ABSOLUTE drive state ("dv<throttle><steer>", throttle f/n/b, steer l/c/r)
 * on every change and on a fixed cadence while any control is engaged. A
 * non-neutral throttle is honoured only for motionLeaseMs since the last dv
 * frame; after that the operator (or the link to them) is gone. If the car was
 * rolling forward it actively BRAKES to a full stop (brake-to-stop, see
 * startBrakeToStop/brakeToStop) rather than freewheeling into something, then
 * settles to neutral and waits. Forward frames carry a 0..100 level ("dvfc80")
 * mapped onto the ESC angle 90..speedFactor. Consequences:
 *   - a lost frame is corrected by the next refresh (absolute state, so a lost
 *     "release" can never leave the throttle stuck — the old edge-triggered
 *     db press/release protocol had exactly that runaway failure mode);
 *   - a dead app / dead link / dead bridge all look identical here: dv frames
 *     stop, the lease expires, the car brakes to a stop. Nothing upstream can
 *     keep the car moving on the operator's behalf, because nothing else exists
 *     that extends the lease;
 *   - a DELIBERATE stop (leaving the drive screen / backgrounding / the bridge
 *     seeing the last socket close -> 'st') and the motor-temp cutoff still
 *     coast to neutral via stopCar(); only a lost link mid-drive brakes;
 *   - a parked car (neutral throttle) needs no lease and no traffic at all.
 *
 * The 2018 accelerometer drive mode (dm/ad/as) was removed when this firmware
 * was reconciled with the React Native app, which drives via on-screen buttons.
 */

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
int speedFactor = 120;       // forward throttle servo angle (app sends 95..165)
const int steer = 9;
char cmd[16];                // serial command line buffer (replaces String inByte)

// Motion lease — see the header comment. Must match MOTION_LEASE_MS in
// shared/protocol.ts. The app refreshes an engaged control every 150ms, so the
// lease tolerates 2 consecutive lost/late frames before it expires.
const unsigned long motionLeaseMs = 400;
char throttleState = 'n';          // last commanded throttle: f / n / b
char steerState = 'c';             // last commanded steering: l / c / r
unsigned long lastDriveStateAt = 0;

// Brake-to-stop — when the motion lease expires while rolling forward (the app,
// link or bridge went away mid-drive, e.g. the car drove out of Wi-Fi range) we
// HOLD the ESC in brake until the car has actually stopped, then settle to
// neutral. A freewheeling car used to coast into things. Because holding the
// brake past standstill becomes reverse THRUST on this ESC, three independent
// release conditions guarantee we can never sit in reverse: no wheel pulse for
// brakeQuietMs (wheels at rest), the wheels turning backward, or a hard time cap.
// The quiet-window / direction-flip are the PRIMARY release and decide the real
// stop time; the cap is only a backstop for when the speed sensor lies or dies.
//
// The cap MUST be longer than a genuine stop or it truncates the brake and the
// car coasts the rest — and a full-speed stop can take ~3s. But sizing every cap
// for top speed would allow a long reverse-runaway if the sensor fails after a
// LOW-speed drop. So scale the cap with speedFactor (the max-speed setting): a
// gentle setting gets a short cap, the top setting gets brakeCapMaxMs. All of
// these are tunable and MUST be bench-tested on the car (wheels off the ground).
byte braking = 0;
unsigned long brakeStartedAt = 0;
unsigned long brakeCapMs = 0;                 // hard cap for THIS brake; set in startBrakeToStop
const unsigned long brakeQuietMs = 150;       // no wheel pulse this long => stopped
const unsigned long brakeCapMinMs = 800;      // cap at the lowest speed setting
const unsigned long brakeCapMaxMs = 3500;     // cap at brakeSpeedFactorMax (>= worst real stop)
const int brakeSpeedFactorMax = 165;          // speedFactor that maps to brakeCapMaxMs
volatile unsigned long lastPulseAt = 0;       // millis() of the last wheel pulse (set in ISR)

int tempMotorT;
int rangeT;
int batVolt;
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
// Bottom Lights ("underglow"). Only red+blue channels exist (no green wire),
// so the reachable colours are the red↔blue mixes. The "normal" glow colour is
// app-configurable via lc<r>,<b>; pure red is forced on as the stop/brake alert
// (see stopCar() and frangeS()), so the app never sends it as a glow colour.
const int redLED = 5;
const int blueLED = 6;
byte glowR = 0;     // current "normal" underglow red channel
byte glowB = 255;   // current "normal" underglow blue channel (default: blue)

// Car Blinkers
byte blinkersState = 0;
const int blinkLLED = 7;
const int blinkRLED = 8;
byte blinkON = 0;
char blinkSide;
byte ledState = 0;
unsigned long currentMillis;
unsigned long previousMillis = 0;
unsigned long interval = 500;
// All 4 Blinkers
byte blinkers4State = 0;

// Stop Lights
const int stopLED = 13;

// Car Speed
volatile int rpmcount = 0;
int rpm = 0;
unsigned long lastmillis = 0;
int carSpeed = 0;
volatile char speedDirection = 'n';  // 'f'/'b' once wheels turn; 'n' until then
const int directionPin = 3;

// Range Sensors (Front)
byte rsensorsOn = 1;
const int frsServo = 10;
const int frsTrig = A3;
const int frsEcho = A2;
int currPos = 90;
unsigned long prevMill = 0;
int rInterval = 100;  // (ms)
int rDeg = 5;         // sweep step (degrees)
int frsDistance = 400;
NewPing sonarFr(frsTrig, frsEcho, frsDistance);
int servoCalib = 0;
byte rsProblem = 0;   // 1 while the front obstacle brake is engaged (for rs telemetry)

byte preventNeutral = 0;
byte preventBackward = 0;

// Range Sensors (Back)
const int bcsTrig = A5;
const int bcsEcho = A4;
int bcsDistance = 20;
NewPing sonar(bcsTrig, bcsEcho, bcsDistance);


void setup() {
  Serial.begin(19200);
  // A half-received command line during an RF glitch must not stall the loop:
  // cap how long readBytesUntil() blocks waiting for the '\n' (default is 1s).
  // A full command is ~4ms at 19200 baud, so 20ms leaves ample margin.
  Serial.setTimeout(20);
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
  pinMode(directionPin, INPUT);

  // Set Timer
  tempMotorT = timer.setInterval(3000, tempMotor);
  rangeT = timer.setInterval(35, frangeS);
  batVolt = timer.setInterval(30000, battVoltage);

  // DEFAULT STATES
  // LED
  analogWrite(redLED, 0);
  analogWrite(blueLED, 0);

  // Car Lights
  digitalWrite(lightsLED, LOW);
  digitalWrite(longLightLED, LOW);

  // Car Blinkers
  digitalWrite(blinkLLED, LOW);
  digitalWrite(blinkRLED, LOW);

  // Stop Lights
  digitalWrite(stopLED, LOW);

  // Range Sensors (Front/Back)
  rSensServo.attach(frsServo);
  rSensServo.write(90);
  digitalWrite(frsTrig, LOW);
  digitalWrite(frsEcho, LOW);
  digitalWrite(bcsTrig, LOW);
  digitalWrite(bcsEcho, LOW);

  // read RPM
  attachInterrupt(0, car_rpm, FALLING);

  // Announce a (re)boot so the app can re-send the saved settings. A brown-out
  // reset silently reverts the options (range sensors, speed factor, underglow)
  // to their power-on defaults, and the app<->server socket never drops to
  // trigger the usual on-connect replay — so without this the car would keep
  // running defaults until the next reconnect.
  sendTelemetry("rb", 1);
}

void loop() {
  // Start Timer
  timer.run();

  // Start Millis Function (Blinkers)
  currentMillis = millis();

  // Motion lease: while the throttle is non-neutral, a fresh dv frame must have
  // arrived within motionLeaseMs — otherwise the operator (or the link to them)
  // is gone. Rather than freewheel, brake to a full stop if we were rolling
  // forward. Neutral needs no lease. The unsigned subtraction is rollover-safe.
  if (throttleState != 'n' && currentMillis - lastDriveStateAt > motionLeaseMs) {
    startBrakeToStop();
  }
  // Drive the brake-to-stop control loop each iteration until the car has
  // actually stopped, then it releases itself to neutral.
  if (braking) {
    brakeToStop();
  }

  // Blinkers
  if (blinkersState == 1 && blinkON == 1) {
    if (currentMillis - previousMillis > interval) {
      previousMillis = currentMillis;
      blinkers(blinkSide);
    }
  }
  // All 4 Blinkers
  if (blinkers4State == 1) {
    if (currentMillis - previousMillis > interval) {
      previousMillis = currentMillis;
      blinkers4();
    }
  }

  // Car Speed — sampled over a 500ms window. rpm/carSpeed use empirical scaling
  // factors calibrated against the real car; change the window or factors
  // together (and re-measure) or the displayed speed will drift.
  if (currentMillis - lastmillis > 500) {
    detachInterrupt(0);
    rpm = rpmcount * 60; // Convert frequency to RPM, note: this works for one interruption per full rotation. For two interrupts per full rotation use rpmcount * 30.
    carSpeed = rpm * 0.245 * 0.06;
    sendTelemetry("sp", carSpeed);

    rpmcount = 0;
    lastmillis = currentMillis;
    attachInterrupt(0, car_rpm, FALLING);
  }

  // Move Front Servo for Range Sensor
  if (rsensorsOn == 1) {
    moveServo();
  }

  // Incoming command line ("<code><value>\n"). Read into a fixed char buffer
  // instead of a String to avoid heap churn from the drive-state refresh stream.
  if (Serial.available()) {
    int n = Serial.readBytesUntil('\n', cmd, sizeof(cmd) - 1);
    cmd[n] = '\0';
    if (n >= 2) {
      handleCommand(cmd);
    }
  }
}

// Dispatch one decoded command line.
void handleCommand(const char *line) {
  // Absolute drive state ("dv<throttle><steer>"). Each frame fully describes
  // the desired throttle + steering; the app re-sends it on every change and
  // on a fixed cadence, so a lost frame is corrected by the next one.
  if (strncmp(line, "dv", 2) == 0) {
    if (line[2] != '\0' && line[3] != '\0') {
      applyDriveState(line[2], line[3], atoi(line + 4));
    }
    return;
  }

  // Stop the car (explicit: leaving the drive screen, app backgrounded, or the
  // bridge saw the last app disconnect).
  if (strncmp(line, "st", 2) == 0) {
    stopCar();
    return;
  }

  int value = atoi(line + 2); // numeric payload after the 2-char code

  //////////////
  // OPTIONS //
  /////////////

  // Steer Calibrated Angle
  if (strncmp(line, "sc", 2) == 0) {
    steerCalib = value;
    turnservo.write(90 + steerCalib);
    return;
  }

  // Range Sensor Servo Calibrate
  if (strncmp(line, "rc", 2) == 0) {
    servoCalib = value;
    rSensServo.write(90 - servoCalib);
    return;
  }

  // Car Lights
  if (strncmp(line, "cl", 2) == 0) {
    lightsState = value;
    digitalWrite(lightsLED, lightsState == 1 ? HIGH : LOW);
    return;
  }

  // Car Long Lights
  if (strncmp(line, "ll", 2) == 0) {
    longLightsState = value;
    digitalWrite(longLightLED, longLightsState == 1 ? HIGH : LOW);
    return;
  }

  // Bottom strip ("underglow") colour ("lc<r>,<b>"). The strip has only red and
  // blue channels, so the app does the colour maths and sends two raw PWM values
  // (0..255) which we apply directly. We store them so each drive-state frame
  // repaints the same colour; pure red stays reserved for the stop/brake alert.
  if (strncmp(line, "lc", 2) == 0) {
    const char *comma = strchr(line + 2, ',');
    if (comma != NULL) {
      glowR = constrain(atoi(line + 2), 0, 255);
      glowB = constrain(atoi(comma + 1), 0, 255);
      analogWrite(redLED, glowR);
      analogWrite(blueLED, glowB);
    }
    return;
  }

  // Car Blinkers (enable turn signals)
  if (strncmp(line, "bl", 2) == 0) {
    blinkersState = value;
    return;
  }

  // Car All 4 Blinkers (hazards)
  if (strncmp(line, "b4", 2) == 0) {
    blinkers4State = value;
    if (blinkers4State == 0) {
      ledState = 0;
      digitalWrite(blinkLLED, LOW);
      digitalWrite(blinkRLED, LOW);
    }
    return;
  }

  // Speed Factor (forward throttle servo angle)
  if (strncmp(line, "sf", 2) == 0) {
    speedFactor = value;
    return;
  }

  // Range Sensors on/off
  if (strncmp(line, "rs", 2) == 0) {
    rsensorsOn = value;
    if (rsensorsOn == 1) {
      timer.enable(rangeT);
    } else {
      timer.disable(rangeT);
      rSensServo.write(90 - servoCalib);
      // No longer watching the path — clear any standing obstacle warning.
      if (rsProblem) {
        rsProblem = 0;
        sendTelemetry("rs", 0);
      }
    }
    return;
  }
}

// Apply one absolute drive-state frame. Frames repeat while a control is held,
// so servo writes are idempotent re-assertions; the light/blinker effects key
// off the state TRANSITIONS so refreshes don't retrigger them.
void applyDriveState(char throttle, char steer, int level) {
  // Malformed input must never extend the motion lease.
  if ((throttle != 'f' && throttle != 'n' && throttle != 'b') ||
      (steer != 'l' && steer != 'c' && steer != 'r')) {
    return;
  }
  if (level < 0) level = 0;
  if (level > 100) level = 100;
  lastDriveStateAt = millis();
  braking = 0;  // a fresh operator frame means the link is back — it owns the ESC now
  byte throttleChanged = (throttle != throttleState) ? 1 : 0;
  byte steerChanged = (steer != steerState) ? 1 : 0;
  throttleState = throttle;
  steerState = steer;

  // Throttle
  if (throttle == 'f') {
    // Map the 0..100 forward level onto the ESC servo range: 90 (idle) up to
    // speedFactor (the app's "max speed" setting). level 100 == the old
    // single-speed behaviour. A FRESH forward press still overrides an engaged
    // front-obstacle brake; a mere level change while already forward does not.
    int angle = 90 + (int)((long)(speedFactor - 90) * level / 100);
    if (throttleChanged || preventNeutral == 0) {
      driveSrv.write(angle);
      preventNeutral = 0;
      preventBackward = 0;
    }
    digitalWrite(stopLED, LOW);
  } else if (throttle == 'b') {
    if (preventBackward != 1) {
      driveSrv.write(15);
      preventNeutral = 0;
    }
    digitalWrite(stopLED, LOW);
  } else { // 'n' — released
    if (preventNeutral != 1) {
      driveSrv.write(90);
    }
    digitalWrite(stopLED, HIGH);
  }
  // Hazards follow reversing.
  if (throttleChanged) {
    blinkers4State = (throttle == 'b') ? 1 : 0;
    if (blinkers4State == 0) {
      ledState = 0;
      digitalWrite(blinkLLED, LOW);
      digitalWrite(blinkRLED, LOW);
    }
  }

  // Steering
  if (steer == 'l') {
    turnservo.write(65 + steerCalib);
  } else if (steer == 'r') {
    turnservo.write(115 + steerCalib);
  } else {
    turnservo.write(90 + steerCalib);
  }
  if (steerChanged) {
    if (steer == 'c') {
      blinkON = 0;
      ledState = 0;
      digitalWrite(blinkLLED, LOW);
      digitalWrite(blinkRLED, LOW);
    } else if (blinkersState == 1 && blinkers4State == 0) {
      blinkON = 1;
      blinkSide = steer;
    }
  }

  // Repaint the configurable "normal" underglow. The safety stop / obstacle
  // brake force it red; the next operator frame restores the chosen colour, so
  // a car that stays red is a car that is hearing nothing.
  analogWrite(redLED, glowR);
  analogWrite(blueLED, glowB);
}

// Emit one telemetry frame ("<code><value>X") without allocating a String.
void sendTelemetry(const char *code, long value) {
  Serial.print(code);
  Serial.print(value);
  Serial.print('X');
}

// Deliberate stop: coast to neutral throttle, centre the steering, and reset the
// tracked drive state. Fired by an explicit 'st' (leaving the drive screen, app
// backgrounded, the bridge seeing the last socket close) and the motor-temp
// cutoff. The lost-link case is NOT here — it brakes to a stop, see
// startBrakeToStop(); this path deliberately just coasts.
void stopCar() {
  braking = 0;
  driveSrv.write(90);
  turnservo.write(90 + steerCalib);
  throttleState = 'n';
  steerState = 'c';
  preventNeutral = 0;

  // Signals: stop lights on, blinkers off, red underglow alert. The next dv
  // frame repaints the normal glow — a car that stays red is hearing nothing.
  digitalWrite(stopLED, HIGH);
  blinkers4State = 0;
  blinkON = 0;
  ledState = 0;
  digitalWrite(blinkLLED, LOW);
  digitalWrite(blinkRLED, LOW);
  analogWrite(redLED, 255);
  analogWrite(blueLED, 0);
}

// Begin a lost-link brake-to-stop (the motion lease expired mid-drive). Straighten
// up and raise the stop/alert signals, then — only if we were rolling forward —
// hold the ESC in brake and hand off to brakeToStop(). Anything else (already
// stopped, or was reversing) just neutralises. throttleState is reset to 'n' so
// the expired lease can't re-enter this every loop.
void startBrakeToStop() {
  throttleState = 'n';
  steerState = 'c';
  turnservo.write(90 + steerCalib);

  digitalWrite(stopLED, HIGH);
  blinkers4State = 0;
  blinkON = 0;
  ledState = 0;
  digitalWrite(blinkLLED, LOW);
  digitalWrite(blinkRLED, LOW);
  analogWrite(redLED, 255);
  analogWrite(blueLED, 0);

  if (speedDirection == 'f') {
    braking = 1;
    brakeStartedAt = currentMillis;
    // Size the hard cap to the current max-speed setting: linear from
    // brakeCapMinMs at idle (speedFactor 90) to brakeCapMaxMs at brakeSpeedFactorMax.
    int sf = speedFactor;
    if (sf < 90) sf = 90;
    if (sf > brakeSpeedFactorMax) sf = brakeSpeedFactorMax;
    brakeCapMs = brakeCapMinMs +
                 (brakeCapMaxMs - brakeCapMinMs) * (unsigned long)(sf - 90) / (brakeSpeedFactorMax - 90);
    driveSrv.write(15);
  } else {
    braking = 0;
    driveSrv.write(90);
  }
}

// Hold the ESC in brake until the car has actually stopped, then settle to
// neutral. Releases as soon as ANY of: no wheel pulse for brakeQuietMs (the
// wheels are at rest — this naturally scales with speed, so a fast car brakes
// hard and a crawl releases early), the wheels start turning backward, or the
// speed-scaled brakeCapMs hard cap (backstop so a silent speed sensor can never
// leave us commanding reverse). lastPulseAt is read with interrupts off — it is
// a 4-byte value the wheel ISR also writes, so a plain read could tear.
void brakeToStop() {
  noInterrupts();
  unsigned long pulseAt = lastPulseAt;
  interrupts();

  byte stopped = (currentMillis - pulseAt > brakeQuietMs) ||
                 (speedDirection == 'b') ||
                 (currentMillis - brakeStartedAt > brakeCapMs);
  if (stopped) {
    driveSrv.write(90);
    braking = 0;
  } else {
    driveSrv.write(15);
  }
}

// Car Speed (read RPM)
void car_rpm() {
  rpmcount++;
  lastPulseAt = millis();  // for the brake-to-stop quiet-window
  car_dir();
}

// Car Direction
void car_dir() {
  if (digitalRead(directionPin) == HIGH) {
    speedDirection = 'b';
  } else {
    speedDirection = 'f';
  }
}

// Motor Temperature
void tempMotor() {
  // LM35
  int tempC = (5.0 * analogRead(tempPin) * 100.0) / 1024;
  sendTelemetry("mt", tempC);

  // Critical Temperature
  int criticalTemp = 50;
  if (tempC >= criticalTemp) {
    stopCar();
  }
}

// Battery Voltage
void battVoltage() {
  // MAX (16.8V) => 675 => 3.3V
  //     (15.8V) => 614 => 3V
  //     1V => 60 units, 16mV => 1 unit
  int battData = analogRead(voltPin);
  sendTelemetry("bv", battData);
}

// Car Blinkers
void blinkers(char side) {
  // Left
  if (side == 'l') {
    ledState = (ledState == 0) ? 1 : 0;
    digitalWrite(blinkLLED, ledState);
  }
  // Right
  else if (side == 'r') {
    ledState = (ledState == 0) ? 1 : 0;
    digitalWrite(blinkRLED, ledState);
  }
}

// Car All 4 Blinkers
void blinkers4() {
  ledState = (ledState == 0) ? 1 : 0;
  digitalWrite(blinkLLED, ledState);
  digitalWrite(blinkRLED, ledState);
}

// Front + Back Range Sensors
void frangeS() {
  // Front sensor — brake if something is close while moving forward.
  unsigned int frsRange = sonarFr.ping_cm();
  byte obstacle = (frsRange != 0 && frsRange < speedFactor * 2.4) ? 1 : 0;

  if (obstacle) {
    // Brake
    if (speedDirection == 'f') {
      driveSrv.write(15);
      preventNeutral = 1;

      // Stop Lights
      digitalWrite(stopLED, HIGH);
    }
    // To Neutral
    else if (speedDirection == 'b' && preventNeutral == 1) {
      driveSrv.write(90);
      preventNeutral = 0;
    }
    analogWrite(redLED, 255);
    analogWrite(blueLED, 0);
  }

  // Tell the app when the obstacle state changes (edge-triggered so the link
  // is not flooded): rs1 the moment we brake, rs0 once the path is clear.
  if (obstacle != rsProblem) {
    rsProblem = obstacle;
    sendTelemetry("rs", rsProblem);
  }

  // Back sensor — block reverse while something is close behind.
  unsigned int bcsRange = sonar.ping_cm();
  if (bcsRange != 0 && bcsRange < bcsDistance) {
    preventBackward = 1;  // prevent going backward if the obstacle is too close
  }
}

// Servo - Front Range Sensor (sweep)
void moveServo() {
  if (currentMillis - prevMill > rInterval) {
    prevMill = currentMillis;
    currPos = (currPos - rDeg);
    rSensServo.write(currPos - servoCalib);
    if (currPos == 75) {
      rDeg = -5;
    } else if (currPos == 105) {
      rDeg = 5;
    }
  }
}
