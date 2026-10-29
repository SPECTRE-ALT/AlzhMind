"""
Simulates an ESP32 wearable transmitting telemetry every 1 second to the backend.
Can inject occasional falls or heart rate spikes for testing live dashboards.
"""
import time
import math
import random
import requests

API_ENDPOINT = "http://localhost:8000/api/telemetry"

def run_simulation():
    print("[+] Starting Alzhmind ESP32 Telemetry Simulator...")
    step = 0
    while True:
        step += 1
        # Realistic undulating heart rate with small variance
        base_hr = 72 + 5 * math.sin(step * 0.1) + random.uniform(-1.5, 1.5)
        # Normal SpO2 between 97.5% and 99.5%
        spo2 = 98.2 + random.uniform(-0.4, 0.4)
        acc = 1.0 + random.uniform(-0.05, 0.05)
        fall = False

        # Random simulated event every 40 seconds (or for quick testing)
        if step % 35 == 0:
            print("[SIM EVENT] Simulating momentary high-impact fall & acceleration spike!")
            acc = 3.2
            fall = True
            base_hr += 22

        payload = {
            "device_id": "ESP32-ALZH-NODE-01",
            "patient_id": "patient_7849_carter",
            "heart_rate": round(base_hr, 1),
            "spo2": round(spo2, 1),
            "acceleration": round(acc, 2),
            "fall_detected": fall,
            "battery_level": max(20, 95 - int(step / 60)),
            "location": {
                "lat": 37.7749 + random.uniform(-0.0001, 0.0001),
                "lng": -122.4194 + random.uniform(-0.0001, 0.0001),
                "zone": "Safe Geofence (Living Room)"
            }
        }

        try:
            res = requests.post(API_ENDPOINT, json=payload, timeout=2.0)
            if res.status_code == 200:
                data = res.json()
                sev = data.get("analysis", {}).get("severity", "NORMAL")
                print(f"[{step}] Sent Telemetry -> HR: {payload['heart_rate']} BPM | SpO2: {payload['spo2']}% | Acc: {payload['acceleration']}g | Status: {sev}")
            else:
                print(f"[{step}] HTTP Response error: {res.status_code}")
        except Exception as e:
            print(f"[{step}] Telemetry dispatch offline ({e}) - waiting for backend on :8000")

        time.sleep(1.0)

if __name__ == "__main__":
    run_simulation()

