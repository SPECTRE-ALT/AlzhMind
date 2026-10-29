import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ml_anomaly import detector
from ollama_service import query_ollama
from firebase_service import sync_telemetry_to_firestore

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("alzhmind_core")

app = FastAPI(
    title="Alzhmind IoT & Clinical AI Core",
    description="Apple-minimalist, high-performance telemetry ingest, local Ollama wrapper, and clinical messaging API.",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hardware State Storage: Null when hardware is not streaming (ZERO fake telemetry data)
latest_telemetry: Optional[Dict[str, Any]] = None
last_packet_time: Optional[datetime] = None
telemetry_history: List[Dict[str, Any]] = []

# Clinical consultation notes between Patient and Assigned Doctor
consultation_notes: List[Dict[str, Any]] = [
    {
        "id": "cn_1",
        "sender_role": "doctor",
        "sender_name": "Dr. Catherine Howard, MD",
        "patient_id": "patient_primary",
        "message": "Baseline resting telemetry looks steady. Let us ensure fluid intake is maintained during afternoon rest periods.",
        "timestamp": "Today at 09:15 AM"
    }
]

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Send current hardware status immediately
        await websocket.send_json({
            "type": "HARDWARE_STATUS",
            "is_online": self.is_hardware_alive(),
            "data": latest_telemetry
        })

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    def is_hardware_alive(self) -> bool:
        if last_packet_time is None:
            return False
        # Consider offline if no packet received in the last 6 seconds
        diff = (datetime.now(timezone.utc) - last_packet_time).total_seconds()
        return diff < 6.0

    async def broadcast(self, message: Dict[str, Any]):
        for ws in self.active_connections:
            try:
                await ws.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

# ================= Schema Definitions =================

class TelemetryPayload(BaseModel):
    device_id: str = "ESP32-ALZH-NODE-01"
    patient_id: Optional[str] = "patient_primary"
    heart_rate: float = Field(..., description="Heart rate BPM from MAX30102")
    spo2: float = Field(..., description="SpO2 percentage from MAX30102")
    acceleration: float = Field(..., description="Vector sum magnitude in g from MPU6050")
    fall_detected: bool = Field(default=False)
    battery_level: Optional[int] = 95
    timestamp: Optional[Any] = None
    location: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    prompt: str
    role: Optional[str] = "patient"
    history: Optional[List[Dict[str, str]]] = []

class ConsultationRequest(BaseModel):
    sender_role: str # patient, doctor, caregiver
    sender_name: str
    message: str
    patient_id: Optional[str] = "patient_primary"

# ================= REST Endpoints =================

@app.get("/")
def health_check():
    return {
        "status": "operational",
        "service": "Alzhmind IoT & Clinical AI Core",
        "hardware_online": manager.is_hardware_alive(),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/api/telemetry")
async def ingest_telemetry(payload: TelemetryPayload, background_tasks: BackgroundTasks):
    """
    Called by ESP32 microcontroller or test hardware emitter.
    """
    global latest_telemetry, last_packet_time

    now_utc = datetime.now(timezone.utc)
    last_packet_time = now_utc
    data_dict = payload.model_dump()
    data_dict["received_at"] = now_utc.isoformat()

    # ML Anomaly Detection Analysis
    analysis = detector.analyze(data_dict)
    data_dict["analysis"] = analysis

    latest_telemetry = data_dict
    telemetry_history.append(data_dict)
    if len(telemetry_history) > 60:
        telemetry_history.pop(0)

    # Sync to Firestore asynchronously
    background_tasks.add_task(sync_telemetry_to_firestore, data_dict, analysis)

    # Broadcast live frame to web clients
    await manager.broadcast({
        "type": "TELEMETRY_UPDATE",
        "is_online": True,
        "data": data_dict
    })

    return {"status": "ingested", "analysis": analysis}

@app.get("/api/telemetry/status")
def get_hardware_status():
    alive = manager.is_hardware_alive()
    return {
        "is_online": alive,
        "device_id": "ESP32-ALZH-NODE-01",
        "latest": latest_telemetry if alive else None,
        "history": telemetry_history[-20:] if alive else []
    }

@app.post("/api/ai/chat")
async def chat_with_ezcare(req: ChatRequest):
    """
    Ollama (Llama 3.1:3b) local AI companion endpoint.
    """
    reply = await query_ollama(prompt=req.prompt, role=req.role or "patient", conversation_history=req.history)
    return {
        "response": reply,
        "model": "llama3.1:3b (Local Ollama Engine)",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/api/consultation/notes")
def get_consultation_notes():
    return consultation_notes

@app.post("/api/consultation/notes")
async def post_consultation_note(req: ConsultationRequest):
    note = {
        "id": f"cn_{len(consultation_notes) + 1}",
        "sender_role": req.sender_role,
        "sender_name": req.sender_name,
        "patient_id": req.patient_id,
        "message": req.message,
        "timestamp": "Just now"
    }
    consultation_notes.append(note)
    await manager.broadcast({
        "type": "NEW_CONSULTATION_NOTE",
        "data": note
    })
    return {"status": "saved", "note": note}

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep socket alive & handle any command from dashboard
            text = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
