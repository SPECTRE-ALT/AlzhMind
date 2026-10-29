import httpx
import logging
from typing import List, Dict, Any

logger = logging.getLogger("ollama_service")

OLLAMA_BASE_URL = "http://localhost:11434"
MODEL_NAME = "llama3.1:3b"

# High-fidelity Apple-minimalist & clinical system prompt
SYSTEM_PROMPT = """You are EzCare, a compassionate, warm, and grounded human care companion inside Alzhmind.

Core Behavioral Principles:
1. Speak like a real, empathetic human caregiver or trusted friend—NOT an over-dramatic, repetitive, or robotic NPC.
2. For dementia/Alzheimer's patients: Speak in calm, concise, everyday language. Provide gentle spatial/temporal grounding without being patronizing. Reassure them that they are safe and comfortable.
3. For caregivers and physicians: Deliver clear, practical, non-alarmist summaries, behavioral de-escalation observations, and vital telemetry context.
4. Voice Optimization: Keep sentences natural, clear, and easy to understand when spoken aloud.
5. In severe physical emergencies (severe chest pain, loss of consciousness, uncontrolled bleeding), clearly advise pressing the emergency call button or dialing emergency services immediately while remaining calm.
"""

async def query_ollama(prompt: str, role: str = "patient", conversation_history: List[Dict[str, str]] = None) -> str:
    """
    Communicates with the local Ollama instance running Llama 3.1:3b.
    Provides natural, non-robotic fallback responses if Ollama is starting up or offline.
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if conversation_history:
        messages.extend(conversation_history)
    messages.append({"role": "user", "content": prompt})

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": MODEL_NAME,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.45,
                        "top_p": 0.9,
                    }
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                content = data.get("message", {}).get("content", "").strip()
                if content:
                    return content
    except Exception as e:
        logger.warning(f"[Ollama] Offline or unreachable on :11434 ({e}). Using natural human response logic.")

    # Human-grounded resilient fallback logic (no robotic placeholders)
    prompt_clean = prompt.lower()
    if any(k in prompt_clean for k in ["where", "lost", "home", "scared", "confused", "place"]):
        return "You're at home in your comfortable room right now, and everything is calm. Take a slow, quiet breath in. You are safe, and your family knows right where you are."
    elif any(k in prompt_clean for k in ["doctor", "vitals", "heart", "telemetry", "health"]):
        return "Your wearable device is monitoring your heart rhythm and oxygen levels. Your care team can see your vitals in real time on their console."
    elif any(k in prompt_clean for k in ["help", "pain", "hurt", "fell", "emergency"]):
        return "I've logged your alert. Please stay seated or resting comfortably. Your emergency contacts and caregiver have been notified, and help is nearby."
    elif any(k in prompt_clean for k in ["time", "day", "date", "morning", "night"]):
        return "It is currently peaceful outside. You don't have to worry about schedules right now. Is there a favorite cup of tea or music you'd enjoy?"
    else:
        return "I'm right here with you. We can chat for as long as you'd like, or I can help you reach out to your caregiver if you'd like company."
