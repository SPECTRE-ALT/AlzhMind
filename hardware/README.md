# ESP32 Alzhmind IoT Wearable Firmware

For assembly instructions, wiring, library setup, and the complete ESP32 sketch, see the repository's [ASSEMBLY.md](../ASSEMBLY.md). The firmware is in [esp32_firmware.ino](esp32_firmware/esp32_firmware.ino); it uses the SparkFun MAX3010x library, which supports the MAX30102.

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

### SSD1306 I2C OLED
- `VCC` -> 3.3V (confirm the breakout supports 3.3V)
- `GND` -> GND
- `SDA` -> GPIO 21 (shared I2C bus)
- `SCL` -> GPIO 22 (shared I2C bus)

### TM1637 4-Digit Display
- `VCC` -> 3.3V (avoid 5V logic on ESP32 pins)
- `GND` -> GND
- `CLK` -> GPIO 25
- `DIO` -> GPIO 26

### Fall Detection Logic & Thresholds
- Impact acceleration vector sum: `a_total = sqrt(ax^2 + ay^2 + az^2) / 9.80665` (in g)
- Trigger condition in the current sketch: freefall (< 0.55g) followed by impact (> 2.85g) within 400ms.
- The sketch does not validate posture or confirm that a fall occurred; do not rely on it for emergency or medical alerts.
