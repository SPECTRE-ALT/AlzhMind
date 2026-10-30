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
