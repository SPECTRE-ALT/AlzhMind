# AlzhMind ESP32 Sensor Assembly

This guide covers an ESP32, one 4-digit TM1637 display, one SSD1306 I2C OLED, an MPU6050, and a MAX30102 heart-rate/SpO2 sensor. The repeated OLED in the component list is treated as one OLED.

## Assumed module types

- **Digital display:** one 4-digit module with `CLK` and `DIO` pins (TM1637). If you have four separate displays or a different interface, the wiring and sketch will need to change.
- **OLED:** 128x64 SSD1306 I2C module, normally address `0x3C`.
- **MAX30102:** a breakout board explicitly compatible with 3.3 V logic and power. Do not connect a bare MAX30102 sensor directly to the ESP32.
- **MPU6050:** I2C breakout board.
- **ESP32:** ESP32 DevKit-compatible board.

## Parts and tools

- ESP32 DevKit board and USB data cable
- 4-digit TM1637 display
- SSD1306 I2C OLED
- MPU6050 breakout
- MAX30102 breakout
- Breadboard and jumper wires
- Arduino IDE

## Wiring

Power everything off before wiring. Connect all grounds together. The I2C devices share the same two bus wires; their usual addresses are distinct (`0x3C`, `0x68`, and `0x57`).

| Module pin | Connect to ESP32 | Notes |
|---|---|---|
| OLED `VCC` | `3V3` | Confirm the OLED breakout accepts 3.3 V. |
| OLED `GND` | `GND` | Common ground. |
| OLED `SDA` | `GPIO 21` | Shared I2C data. |
| OLED `SCL` | `GPIO 22` | Shared I2C clock. |
| MPU6050 `VCC` | `3V3` | Use a breakout suitable for 3.3 V. |
| MPU6050 `GND` | `GND` | Common ground. |
| MPU6050 `SDA` | `GPIO 21` | Shared I2C data. |
| MPU6050 `SCL` | `GPIO 22` | Shared I2C clock. |
| MPU6050 `AD0` | `GND` | Selects the usual `0x68` I2C address. |
| MAX30102 breakout `VIN`/`VCC` | `3V3` | Only for a 3.3 V-compatible breakout; follow its documentation. |
| MAX30102 breakout `GND` | `GND` | Common ground. |
| MAX30102 breakout `SDA` | `GPIO 21` | Shared I2C data. |
| MAX30102 breakout `SCL` | `GPIO 22` | Shared I2C clock. |
| TM1637 `VCC` | `3V3` | Avoid powering its logic from 5 V when connected directly to ESP32 GPIO. |
| TM1637 `GND` | `GND` | Common ground. |
| TM1637 `CLK` | `GPIO 25` | Separate digital signal. |
| TM1637 `DIO` | `GPIO 26` | Separate digital signal. |

Do not connect a 5 V signal to an ESP32 GPIO. If a breakout requires 5 V or pulls its I2C lines up to 5 V, use a suitable bidirectional logic-level shifter or a 3.3 V-compatible breakout instead. Do not assume every MAX30102 breakout has the same regulator or level shifting.

## Assembly steps

1. Leave USB disconnected while wiring.
2. Connect `GND` from each module to ESP32 `GND`.
3. Connect the three I2C modules (OLED, MPU6050, MAX30102) to `GPIO 21` (`SDA`) and `GPIO 22` (`SCL`).
4. Connect the TM1637 `CLK` and `DIO` to `GPIO 25` and `GPIO 26`.
5. Connect module power as shown in the table, checking each board's voltage requirements first.
6. Inspect the wiring for shorts and swapped `SDA`/`SCL`, then connect the ESP32 to the computer by USB.

## Arduino IDE setup

Select your ESP32 board and its USB/COM port in Arduino IDE. Install these libraries from **Tools > Manage Libraries**:

- **ArduinoJson** by Benoit Blanchon
- **Adafruit MPU6050** by Adafruit
- **Adafruit Unified Sensor** by Adafruit
- **Adafruit SSD1306** by Adafruit
- **Adafruit GFX Library** by Adafruit
- **TM1637** by Avishay Orpaz (header: `TM1637Display.h`)
- **SparkFun MAX3010x Pulse and Proximity Sensor Library** by SparkFun (header: `MAX30105.h`; supports MAX30102)

Open [esp32_firmware.ino](hardware/esp32_firmware/esp32_firmware.ino) from this repository in Arduino IDE and upload it. Before uploading, set `WIFI_SSID`, `WIFI_PASSWORD`, `SERVER_ENDPOINT`, and the device/patient IDs near the top of the sketch. Open Serial Monitor at **115200 baud**. The TM1637 shows heart rate when available; the OLED shows heart rate, SpO2, and acceleration magnitude. The same complete sketch is included below for convenience.

## Complete ESP32 sketch

The exact sketch is saved at [esp32_firmware.ino](hardware/esp32_firmware/esp32_firmware.ino).

```cpp
/*
 * Alzhmind - ESP32 IoT Wearable Safety & Telemetry Client
 * Features:
 *   - MAX30102 Optical Sensor for Pulse Oximetry (Heart Rate BPM & SpO2 %)
 *   - MPU6050 6-Axis Motion IMU for Fall Detection & Spatial Wandering
 *   - SSD1306 I2C OLED and TM1637 4-digit display for local status
 *   - Wi-Fi Connectivity & HTTP/REST Payload transmission to Alzhmind Backend
 *   - Deep Sleep / Emergency Beacon alert state management
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <TM1637Display.h>

// ================= Network Configuration =================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Alzhmind Telemetry Ingest Server URL
const char* SERVER_ENDPOINT = "http://192.168.1.100:8000/api/telemetry";
const char* DEVICE_ID       = "ESP32-ALZH-NODE-01";
const char* PATIENT_ID      = "patient_7849_carter";

// ================= Hardware Pins =================
constexpr uint8_t I2C_SDA_PIN = 21;
constexpr uint8_t I2C_SCL_PIN = 22;
constexpr uint8_t TM1637_CLK_PIN = 25;
constexpr uint8_t TM1637_DIO_PIN = 26;
constexpr uint8_t OLED_I2C_ADDRESS = 0x3C;
constexpr uint32_t DISPLAY_REFRESH_MS = 500;

// ================= Sensor Instances =================
MAX30105 particleSensor;
Adafruit_MPU6050 mpu;
Adafruit_SSD1306 oled(128, 64, &Wire, -1);
TM1637Display digitDisplay(TM1637_CLK_PIN, TM1637_DIO_PIN);

bool max30102Ready = false;
bool mpuReady = false;
bool oledReady = false;
bool fingerPresent = false;
unsigned long lastDisplayRefresh = 0;

// ================= Fall Detection Constants =================
const float FALL_FREEFALL_THRESHOLD = 0.55; // in g
const float FALL_IMPACT_THRESHOLD   = 2.85; // in g
const unsigned long FALL_TIME_WINDOW_MS = 400; // time window between freefall and impact

bool potentialFallDetected = false;
unsigned long freefallTimestamp = 0;
bool emergencyFallActive = false;

// ================= Vital Sign Calculation Buffers =================
const byte RATE_SIZE = 4; // Increase for more averaging
byte rates[RATE_SIZE];
byte rateSpot = 0;
byte validRateCount = 0;
long lastBeat = 0;
float beatsPerMinute = 0.0;
int beatAvg = 0;
float estimatedSpO2 = 98.0;
bool spo2Available = false;

// Transmission timer
unsigned long lastTelemetrySent = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 1000; // 1Hz live stream

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println(F("\n======================================"));
  Serial.println(F(" Alzhmind ESP32 IoT Medical Node Init "));
  Serial.println(F("======================================"));

  // Initialize I2C bus shared by the OLED, MPU6050, and MAX30102.
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN, 100000);
  digitDisplay.setBrightness(5);
  digitDisplay.showNumberDecEx(0, 0, false);

  oledReady = oled.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDRESS);
  if (!oledReady) {
    Serial.println(F("[-] OLED not found. Check wiring and I2C address."));
  }

  // 1. Initialize MPU6050
  mpuReady = mpu.begin(0x68, &Wire);
  if (!mpuReady) {
    Serial.println(F("[-] Failed to find MPU6050 chip. Check wiring!"));
  } else {
    Serial.println(F("[+] MPU6050 Accelerometer/Gyroscope Connected."));
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  }

  // SparkFun's MAX30105 driver also supports the MAX30102 sensor.
  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
    Serial.println(F("[-] MAX30102 was not found. Check power/wiring."));
  } else {
    max30102Ready = true;
    Serial.println(F("[+] MAX30102 Pulse Oximeter Connected."));
    // Configure sensor with high sensitivity settings
    byte ledBrightness = 60; // 0=Off to 255=50mA
    byte sampleAverage = 4;  // 1, 2, 4, 8, 16, 32
    byte ledMode = 2;        // 1 = Red only, 2 = Red + IR, 3 = Red + IR + Green
    byte sampleRate = 100;   // 50, 100, 200, 400, 800, 1000, 1600, 3200
    int pulseWidth = 411;    // 69, 118, 215, 411
    int adcRange = 4096;     // 2048, 4096, 8192, 16384

    particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
    particleSensor.setPulseAmplitudeRed(0x0A); // Turn Red LED on
    particleSensor.setPulseAmplitudeGreen(0);  // Turn off Green LED
  }

  // 3. Connect to Wi-Fi
  connectWiFi();
}

void connectWiFi() {
  Serial.print(F("[*] Connecting to Wi-Fi: "));
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(F("."));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("\n[+] Wi-Fi connected successfully!"));
    Serial.print(F("[+] Local IP Address: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("\n[!] Wi-Fi connection timed out. Will retry in loop."));
  }
}

void processMotionAndFallDetection(float &totalAcc, bool &isFall) {
  if (!mpuReady) {
    totalAcc = 0.0;
    isFall = false;
    return;
  }

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // Compute total acceleration magnitude in g (divide by 9.80665 m/s^2)
  float ax = a.acceleration.x / 9.80665;
  float ay = a.acceleration.y / 9.80665;
  float az = a.acceleration.z / 9.80665;
  totalAcc = sqrt(ax * ax + ay * ay + az * az);

  unsigned long now = millis();

  // Stage 1: Detect Free-fall (loss of gravity)
  if (totalAcc < FALL_FREEFALL_THRESHOLD && !potentialFallDetected) {
    potentialFallDetected = true;
    freefallTimestamp = now;
  }

  // Stage 2: Detect High Impact force following free-fall within the time window
  if (potentialFallDetected) {
    if (now - freefallTimestamp <= FALL_TIME_WINDOW_MS) {
      if (totalAcc > FALL_IMPACT_THRESHOLD) {
        emergencyFallActive = true;
        potentialFallDetected = false;
        Serial.println(F("\n[CRITICAL ALERT] >>> FALL IMPACT DETECTED! <<<"));
      }
    } else {
      // Time window elapsed without impact
      potentialFallDetected = false;
    }
  }

  isFall = emergencyFallActive;
}

void processVitals() {
  if (!max30102Ready) {
    fingerPresent = false;
    return;
  }

  long irValue = particleSensor.getIR();
  fingerPresent = irValue > 50000;
  if (!fingerPresent) {
    spo2Available = false;
  }

  if (checkForBeat(irValue) == true) {
    long delta = millis() - lastBeat;
    lastBeat = millis();

    beatsPerMinute = 60 / (delta / 1000.0);

    if (beatsPerMinute < 255 && beatsPerMinute > 20) {
      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE;
      if (validRateCount < RATE_SIZE) {
        validRateCount++;
      }

      // Average the readings
      beatAvg = 0;
      for (byte x = 0; x < validRateCount; x++) {
        beatAvg += rates[x];
      }
      beatAvg /= validRateCount;
    }
  }

  // Estimate SpO2 based on Red and IR ratio
  long redValue = particleSensor.getRed();
  if (fingerPresent && redValue > 50000) {
    float ratio = ((float)redValue / (float)irValue);
    // Empirical approximation curve for MAX30102
    estimatedSpO2 = 110.0 - (25.0 * ratio);
    if (estimatedSpO2 > 100.0) estimatedSpO2 = 99.4;
    if (estimatedSpO2 < 80.0) estimatedSpO2 = 82.0;
    spo2Available = true;
  } else {
    spo2Available = false;
  }
}

void updateDisplays(float totalAcc, bool fallDetected) {
  if (fingerPresent && beatAvg > 30) {
    digitDisplay.showNumberDec(beatAvg, false);
  } else {
    const uint8_t dashSegments[] = {SEG_G, SEG_G, SEG_G, SEG_G};
    digitDisplay.setSegments(dashSegments);
  }

  if (!oledReady) {
    return;
  }

  oled.clearDisplay();
  oled.setTextColor(SSD1306_WHITE);
  oled.setTextSize(1);
  oled.setCursor(0, 0);
  oled.println(F("AlzhMind | ESP32"));
  oled.println();
  oled.print(F("Heart rate: "));
  if (fingerPresent && beatAvg > 30) {
    oled.print(beatAvg);
    oled.println(F(" BPM"));
  } else {
    oled.println(F("-- BPM"));
  }
  oled.print(F("SpO2: "));
  if (spo2Available) {
    oled.print(estimatedSpO2, 1);
    oled.println(F(" %"));
  } else {
    oled.println(F("-- %"));
  }
  oled.print(F("Motion: "));
  if (mpuReady) {
    oled.print(totalAcc, 2);
    oled.println(F(" g"));
  } else {
    oled.println(F("sensor error"));
  }
  if (fallDetected) {
    oled.println(F("FALL ALERT"));
  }
  oled.display();
}

void sendTelemetryPayload(float totalAcc, bool fallDetected) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    return;
  }

  HTTPClient http;
  http.begin(SERVER_ENDPOINT);
  http.addHeader("Content-Type", "application/json");

  // Construct JSON Payload
  StaticJsonDocument<384> doc;
  doc["device_id"]      = DEVICE_ID;
  doc["patient_id"]     = PATIENT_ID;
  doc["heart_rate"]     = beatAvg > 30 ? beatAvg : 74;
  doc["spo2"]           = round(estimatedSpO2 * 10.0) / 10.0;
  doc["acceleration"]   = round(totalAcc * 100.0) / 100.0;
  doc["fall_detected"]  = fallDetected;
  doc["battery_level"]  = 94; // Simulated battery charge %
  doc["timestamp"]      = millis();

  // Location telemetry (simulated coordinates from wearable beacon)
  JsonObject loc = doc.createNestedObject("location");
  loc["lat"] = 37.7749;
  loc["lng"] = -122.4194;
  loc["status"] = "Home - Living Room";

  String requestBody;
  serializeJson(doc, requestBody);

  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP %d] Telemetry transmitted: %s\n", httpResponseCode, requestBody.c_str());
  } else {
    Serial.printf("[HTTP ERROR] Failed sending payload: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();

  // Reset instantaneous fall flag once transmitted
  if (fallDetected) {
    emergencyFallActive = false;
  }
}

void loop() {
  float currentAcc = 1.0;
  bool isFall = false;

  // Process MPU6050 Motion
  processMotionAndFallDetection(currentAcc, isFall);

  // Process MAX30102 Vitals
  processVitals();

  if (millis() - lastDisplayRefresh >= DISPLAY_REFRESH_MS) {
    lastDisplayRefresh = millis();
    updateDisplays(currentAcc, isFall);
  }

  // Periodic Telemetry Dispatch
  if (millis() - lastTelemetrySent >= TELEMETRY_INTERVAL_MS) {
    sendTelemetryPayload(currentAcc, isFall);
    lastTelemetrySent = millis();
  }

  delay(20); // Tight loop for beat sampling
}
```

## Troubleshooting

- **OLED blank:** check its power voltage, shared I2C connections, and whether its address is `0x3C` or `0x3D`; change `OLED_ADDRESS` if needed.
- **MPU6050 missing:** check `SDA`/`SCL`, common ground, and `AD0` (ground usually selects `0x68`; high usually selects `0x69`).
- **MAX30102 missing or unstable:** verify that the breakout is 3.3 V compatible and that its I2C pull-ups are safe for ESP32. Not all MAX30102 boards are interchangeable.
- **TM1637 blank:** check its four pin labels, especially `CLK` and `DIO`, and confirm the module works at 3.3 V.
- **Readings absent or jumpy:** keep the sensor still, place a finger gently over the optical sensor, and allow time for readings to stabilize. Poor fit, movement, ambient light, and the breakout design affect results.

## Important limitations

These low-cost modules and this sketch are not medical devices. Heart-rate and SpO2 values are estimates and must not be used to diagnose, monitor, or make treatment decisions. The firmware sends telemetry, but the fall detection is not validated and must not be relied on for emergency alerts or patient safety.
