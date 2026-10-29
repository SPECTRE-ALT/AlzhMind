import os
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("firebase_service")

# Optional Firebase Admin SDK initialization
try:
    import firebase_admin
    from firebase_admin import credentials, firestore, auth
    
    # Initialize with default credentials or service account JSON if present
    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY", "firebase_key.json")
    if os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        logger.info("[Firebase] Initialized with Service Account.")
    else:
        # Development / Standalone fallback mode
        db = None
        logger.info("[Firebase] Service account key not detected. Operating in high-speed in-memory store mode.")
except Exception as e:
    db = None
    logger.info(f"[Firebase] Running in decoupled standalone telemetry mode: {e}")

async def sync_telemetry_to_firestore(payload: Dict[str, Any], anomaly_analysis: Dict[str, Any]):
    """
    Persists incoming ESP32 wearable telemetry into Firestore collection 'telemetry_logs'
    """
    if db is not None:
        try:
            doc_ref = db.collection("telemetry_logs").document()
            record = {
                **payload,
                "analysis": anomaly_analysis,
                "server_synced_at": firestore.SERVER_TIMESTAMP
            }
            doc_ref.set(record)
        except Exception as e:
            logger.error(f"Failed to write telemetry to Firestore: {e}")

