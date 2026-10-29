# Alzhmind: IoT Wearable Safety & Cognitive Care Bridge

**Alzhmind** is a medical-grade IoT wearable safety ecosystem and cognitive care bridge engineered specifically for Alzheimer's and dementia patients, their primary caregivers, and attending physicians.

---

## 🌟 System Architecture & Highlights

1. **Liquid Glass Minimalist Design System:**
   - Deep slate midnight palette with multi-stop radial lighting (`#060911`, `#090d16`, `#1e3a8a`).
   - Frosted glassmorphic cards (`backdrop-filter: blur(16px)` with translucent borders and soft status glows).
   - High-contrast, calming UI tailored to relieve cognitive friction and sundowning anxiety.

2. **Hardware & Sensor Fusion (ESP32):**
   - **MAX30102:** Continuous optical photoplethysmography (PPG) measuring heart rate (BPM) and blood oxygen saturation ($SpO_2\%$).
   - **MPU6050 6-Axis IMU:** Vector acceleration magnitude monitoring, instantaneous free-fall detection ($<0.55g$), violent impact registration ($>2.85g$), and postural tilt checks.

3. **Machine Learning Anomaly Engine:**
   - Real-time rolling window assessment of vitals.
   - Heuristic panic/agitation index scoring combining pulse rate deviation and fine involuntary tremor variance.
   - Hypoxia risk detection ($SpO_2 < 93\%$) and acute tachycardia/bradycardia alerts.

4. **EzCare Zero-Latency Local LLM & Voice Assistant:**
   - Powered locally by **Ollama (`llama3.1:3b`)** for 100% private, zero-latency cognitive reassurance.
   - Web Speech API integration for interactive Speech-to-Text (STT) and calming Text-to-Speech (TTS).
   - Resilient fallback engine ensuring instant grounding cues even when offline.

5. **RBAC & Secure Clinical Consultation:**
   - Dual interface modes: **Doctor/Caregiver Advanced Telemetry Dashboard** and simplified **Patient Wearable Feed**.
   - Bi-directional secure clinical portal between attending neurologists and caregivers.

---

## 📁 Project Directory Structure

```
d:\AlzhMind\
├── backend\
│   ├── main.py                 # FastAPI microservice & WebSocket broadcast relay
│   ├── ml_anomaly.py           # ML physiological anomaly & agitation scoring engine
│   ├── ollama_service.py       # Ollama (Llama 3.1:3b) local AI companion integration
│   ├── firebase_service.py     # Firebase Admin SDK & Firestore logging integration
│   ├── simulator.py            # Real-time ESP32 IoT sensor telemetry simulator
│   └── requirements.txt        # Python backend dependencies
│
├── frontend\
│   ├── src\
│   │   ├── app\
│   │   │   ├── globals.css     # Liquid Glass Tailwind CSS rules & frosted filters
│   │   │   ├── layout.tsx      # Root layout wrapped with AuthProvider
│   │   │   └── page.tsx        # Responsive multi-role Alzhmind dashboard
│   │   ├── components\
│   │   │   ├── anomaly\
│   │   │   │   └── MLAnomalyPanel.tsx        # Panic score, safety matrix, & geofencing
│   │   │   ├── auth\
│   │   │   │   └── AuthModal.tsx             # RBAC role selection & Firebase sign-in
│   │   │   ├── chat\
│   │   │   │   └── EzCareChatbot.tsx         # Voice + Text Ollama Llama 3.1:3b UI
│   │   │   ├── patient\
│   │   │   │   └── PatientWearableView.tsx   # Calming high-contrast patient band UI
│   │   │   ├── portal\
│   │   │   │   └── DoctorConsultationPortal.tsx # Physician & caregiver chat notes
│   │   │   ├── ui\
│   │   │   │   └── GlassCard.tsx             # Reusable frosted glassmorphic card
│   │   │   └── vitals\
│   │   │       └── VitalsChart.tsx           # Real-time optical pulse & SpO2 wave chart
│   │   ├── context\
│   │   │   └── AuthContext.tsx               # Client authentication & RBAC state
│   │   └── lib\
│   │       └── firebase.ts                   # Firebase Web SDK client initialization
│   ├── package.json
│   └── tsconfig.json
│
└── hardware\
    ├── README.md               # Hardware pinouts, wiring guide & fall detection physics
    └── esp32_firmware\
        └── esp32_firmware.ino  # Modular C++/Arduino code for ESP32 + MAX30102 + MPU6050
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup
In a terminal, start the FastAPI telemetry ingest server:
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*API docs will be live at `http://localhost:8000/docs`.*

### 2. Frontend Dashboard Setup
In a second terminal, launch the Next.js React frontend:
```bash
cd frontend
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Hardware Simulation (Optional)
If testing without a physical ESP32 device connected, run the high-precision sensor simulator:
```bash
cd backend
python simulator.py
```
This streams live 1Hz telemetry to the backend, rendering real-time waveform updates on the web dashboard.

### 4. Local Ollama LLM (Llama 3.1:3b)
Ensure Ollama is installed and run:
```bash
ollama run llama3.1:3b
```
EzCare will automatically connect to `http://localhost:11434`. (If Ollama is not yet downloaded, Alzhmind's resilient fallback engine handles patient prompts seamlessly).

