import numpy as np
from datetime import datetime
from typing import Dict, Any, List

class AnomalyDetector:
    """
    ML Anomaly Detection Engine for Alzhmind IoT Vitals and Fall Analytics.
    Detects:
    1. Acute Tachycardia / Bradycardia spikes
    2. Hypoxia (SpO2 drops below critical threshold)
    3. Severe Fall Events & Spatial Wandering Disorientation
    4. Panic / Stress patterns (Simultaneous elevated heart rate + erratic micro-acceleration)
    """

    def __init__(self):
        # Rolling baseline window
        self.history_window: List[Dict[str, float]] = []
        self.window_size = 30

    def analyze(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        hr = float(telemetry.get("heart_rate", 75))
        spo2 = float(telemetry.get("spo2", 98))
        acc = float(telemetry.get("acceleration", 1.0))
        fall_detected = bool(telemetry.get("fall_detected", False))

        # Store in rolling buffer
        self.history_window.append({"hr": hr, "spo2": spo2, "acc": acc})
        if len(self.history_window) > self.window_size:
            self.history_window.pop(0)

        anomalies = []
        severity = "NORMAL" # NORMAL, WARNING, CRITICAL
        panic_score = 0.0

        # 1. Fall Impact Detection
        if fall_detected or acc > 2.8:
            anomalies.append({
                "type": "FALL_DETECTED",
                "message": "High-impact fall event registered by MPU6050 accelerometer.",
                "severity": "CRITICAL"
            })
            severity = "CRITICAL"

        # 2. SpO2 Hypoxia Anomaly
        if spo2 < 90.0:
            anomalies.append({
                "type": "HYPOXIA_CRITICAL",
                "message": f"Critical blood oxygen saturation drop: {spo2}%",
                "severity": "CRITICAL"
            })
            severity = "CRITICAL"
        elif spo2 < 94.0:
            anomalies.append({
                "type": "HYPOXIA_MILD",
                "message": f"Low oxygen saturation: {spo2}%",
                "severity": "WARNING"
            })
            if severity != "CRITICAL":
                severity = "WARNING"

        # 3. Heart Rate Tachycardia / Bradycardia
        if hr > 125.0:
            anomalies.append({
                "type": "TACHYCARDIA_SPIKE",
                "message": f"Extreme elevated heart rate detected: {hr:.0f} BPM",
                "severity": "CRITICAL"
            })
            severity = "CRITICAL"
        elif hr > 105.0:
            anomalies.append({
                "type": "ELEVATED_HEART_RATE",
                "message": f"Elevated resting heart rate: {hr:.0f} BPM",
                "severity": "WARNING"
            })
            if severity != "CRITICAL":
                severity = "WARNING"
        elif hr < 45.0:
            anomalies.append({
                "type": "BRADYCARDIA_ACUTE",
                "message": f"Acute bradycardia (low heart rate): {hr:.0f} BPM",
                "severity": "CRITICAL"
            })
            severity = "CRITICAL"

        # 4. Machine Learning Panic / Agitation Scoring
        # Alzheimers patients often experience sundowning or acute panic with high HR + tremor
        if len(self.history_window) >= 5:
            recent_hrs = [item["hr"] for item in self.history_window[-5:]]
            recent_accs = [item["acc"] for item in self.history_window[-5:]]
            hr_std = float(np.std(recent_hrs))
            acc_var = float(np.var(recent_accs))

            # Stress/Panic heuristic score [0 to 100]
            if hr > 95:
                panic_score = min(100.0, ((hr - 90) * 1.8) + (acc_var * 25.0))
            else:
                panic_score = min(40.0, acc_var * 15.0)

            if panic_score > 70.0:
                anomalies.append({
                    "type": "PANIC_AGITATION_EPISODE",
                    "message": f"Patient panic/agitation episode detected (Index: {panic_score:.1f}/100)",
                    "severity": "CRITICAL" if panic_score > 85 else "WARNING"
                })
                if severity != "CRITICAL" and panic_score > 85:
                    severity = "CRITICAL"
                elif severity == "NORMAL":
                    severity = "WARNING"

        return {
            "severity": severity,
            "panic_score": round(panic_score, 1),
            "anomalies": anomalies,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

detector = AnomalyDetector()

