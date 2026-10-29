# ESP32 Alzhmind IoT Wearable Firmware
## Pin Connections

### I2C Bus Configuration (ESP32)
- `SDA` -> GPIO 21
- `SCL` -> GPIO 22
- `VCC` -> 3.3V
- `GND` -> GND

### MAX30102 Optical Vitals Sensor (Heart Rate & SpO2)
- `VIN` -> 3.3V
- `GND` -> GND
- `SDA` -> GPIO 21
- `SCL` -> GPIO 22
- `INT` -> (Optional) GPIO 19 for interrupt triggers

### MPU6050 6-Axis IMU (Accelerometer & Gyroscope)
- `VCC` -> 3.3V
- `GND` -> GND
- `SDA` -> GPIO 21
- `SCL` -> GPIO 22
- `AD0` -> GND (Default I2C address: 0x68)
- `INT` -> (Optional) GPIO 18 for motion interrupt

### Fall Detection Logic & Thresholds
- Impact acceleration vector sum: `a_total = sqrt(ax^2 + ay^2 + az^2) / 9.81` (in g)
- Fall trigger condition: Freefall (< 0.5g) followed by violent impact (> 2.8g) within 350ms, followed by stationary prone posture (pitch/roll deviation > 45 deg).

