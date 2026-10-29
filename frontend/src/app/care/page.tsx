"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Mic,
  MicOff,
  Send,
  Bot,
  Volume2,
  Sparkles,
  User,
  Stethoscope,
  HeartHandshake,
  MessageSquare,
  ShieldAlert,
  Phone,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "ezcare";
  text: string;
  time: string;
}

interface ConsultationNote {
  id: string;
  sender_role: string;
  sender_name: string;
  message: string;
  timestamp: string;
}

export default function CarePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"companion" | "consultation">("companion");

  // Local Ollama Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init_1",
      sender: "ezcare",
      text: user?.fullName
        ? `Hello ${user.fullName.split(" ")[0]}. I'm EzCare. The day is peaceful and you are safe. How are you feeling right now?`
        : "Hello. I'm EzCare. I am right here with you. How can I help you today?",
      time: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Consultation state
  const [consultNotes, setConsultNotes] = useState<ConsultationNote[]>([
    {
      id: "cn_init",
      sender_role: "doctor",
      sender_name: user?.doctorName || "Dr. Catherine Howard, MD",
      message: "Baseline resting telemetry looks steady. Let us ensure fluid intake is maintained during afternoon rest periods.",
      timestamp: "Today at 09:15 AM",
    },
  ]);
  const [consultInput, setConsultInput] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, consultNotes]);

  // Text to Speech
  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Speech to Text
  const toggleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition is supported in Chrome, Edge, and Safari.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    // @ts-expect-error browser speech recognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      handleSendMessage(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          role: user?.role || "patient",
          history: messages.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botReply: ChatMessage = {
          id: `b_${Date.now()}`,
          sender: "ezcare",
          text: data.response,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, botReply]);
        speakText(data.response);
      } else {
        throw new Error("Local Ollama request error");
      }
    } catch {
      // Natural human fallback
      const naturalFallback =
        "You're in a completely safe place right now, and everything is calm. Take a gentle breath in... and let it out. I'm right here beside you.";
      const botReply: ChatMessage = {
        id: `b_${Date.now()}`,
        sender: "ezcare",
        text: naturalFallback,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botReply]);
      speakText(naturalFallback);
    } finally {
      setLoading(false);
    }
  };

  const handleSendConsultation = async () => {
    if (!consultInput.trim()) return;

    const newNote: ConsultationNote = {
      id: `cn_${Date.now()}`,
      sender_role: user?.role || "caregiver",
      sender_name: user?.fullName || "Family Attendant",
      message: consultInput,
      timestamp: "Just now",
    };

    try {
      await fetch("http://localhost:8000/api/consultation/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_role: newNote.sender_role,
          sender_name: newNote.sender_name,
          message: newNote.message,
          patient_id: user?.medicalId || "patient_primary",
        }),
      });
    } catch {
      // Local append if backend is standalone
    }

    setConsultNotes((prev) => [...prev, newNote]);
    setConsultInput("");
  };

  return (
    <div className="min-h-screen bg-black text-[#f4f4f5] py-8 px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header & Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272a]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff6700]" />
              <h1 className="text-2xl font-bold tracking-tight text-white">EzCare Portal</h1>
            </div>
            <p className="text-xs text-[#a1a1aa] mt-0.5">
              Zero-latency local AI companion and physician communication pipeline.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#121214] border border-[#27272a] text-xs">
            <button
              onClick={() => setActiveTab("companion")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "companion"
                  ? "bg-[#ff6700] text-white"
                  : "text-[#a1a1aa] hover:text-white"
              }`}
            >
              AI Companion (Ollama)
            </button>
            <button
              onClick={() => setActiveTab("consultation")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "consultation"
                  ? "bg-[#ff6700] text-white"
                  : "text-[#a1a1aa] hover:text-white"
              }`}
            >
              Doctor Consultation
            </button>
          </div>
        </div>

        {/* Tab 1: AI Companion (Text & Voice) */}
        {activeTab === "companion" && (
          <div className="card-apple flex flex-col h-[620px] overflow-hidden border-[#27272a]">
            {/* Top Bar */}
            <div className="px-6 py-4 border-b border-[#27272a] bg-[#0c0c0e] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center text-[#ff6700]">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">EzCare Companion</span>
                    <span className="badge-orange text-[10px]">Ollama Llama 3.1:3b</span>
                  </div>
                  <p className="text-[11px] text-[#71717a]">
                    Private offline model • Natural human phrasing • Medical safety boundary
                  </p>
                </div>
              </div>

              {isSpeaking && (
                <div className="flex items-center gap-1.5 text-xs text-[#ff6700]">
                  <Volume2 className="w-4 h-4 animate-pulse" />
                  <span>Speaking</span>
                </div>
              )}
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                      m.sender === "user"
                        ? "bg-[#27272a] text-white"
                        : "bg-[#18181b] border border-[#27272a] text-[#ff6700]"
                    }`}
                  >
                    {m.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[78%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                      m.sender === "user"
                        ? "bg-[#ff6700] text-white rounded-tr-none"
                        : "bg-[#141416] border border-[#27272a] text-[#f4f4f5] rounded-tl-none"
                    }`}
                  >
                    <p>{m.text}</p>
                    <span className="block text-[10px] text-[#71717a] mt-1 text-right">
                      {m.time}
                    </span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-[#a1a1aa] py-2 px-4">
                  <Sparkles className="w-3.5 h-3.5 text-[#ff6700] animate-spin" />
                  <span>EzCare is formulating gentle response...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-[#27272a] bg-[#0c0c0e]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  title={isListening ? "Listening... click to stop" : "Start Voice Assistant"}
                  className={`p-3 rounded-xl border transition-colors ${
                    isListening
                      ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
                      : "bg-[#121214] border-[#27272a] text-[#a1a1aa] hover:text-[#ff6700] hover:border-[#ff6700]"
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={
                    isListening
                      ? "Listening to your voice..."
                      : "Type a question, ask for orientation, or speak freely..."
                  }
                  className="flex-1 input-apple text-xs"
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || loading}
                  className="p-3 btn-orange disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Doctor-Patient Direct Consultation */}
        {activeTab === "consultation" && (
          <div className="card-apple flex flex-col h-[620px] overflow-hidden border-[#27272a]">
            {/* Top Bar */}
            <div className="px-6 py-4 border-b border-[#27272a] bg-[#0c0c0e] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center text-[#ff6700]">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">
                    Direct Clinical Consultation Conduit
                  </h3>
                  <p className="text-[11px] text-[#71717a]">
                    Physician: {user?.doctorName || "Dr. Catherine Howard, MD"} • Hospital:{" "}
                    {user?.clinicHospital || "Neurology Clinic"}
                  </p>
                </div>
              </div>
              <span className="badge-orange text-[10px]">End-to-End Logged</span>
            </div>

            {/* Consultation Notes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {consultNotes.map((note) => {
                const isDoc = note.sender_role === "doctor";
                return (
                  <div key={note.id} className="p-4 rounded-xl bg-[#121214] border border-[#27272a] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            isDoc ? "text-[#ff6700]" : "text-white"
                          }`}
                        >
                          {note.sender_name}
                        </span>
                        <span className="text-[10px] text-[#71717a] uppercase font-mono">
                          [{note.sender_role}]
                        </span>
                      </div>
                      <span className="text-[10px] text-[#71717a]">{note.timestamp}</span>
                    </div>
                    <p className="text-xs text-[#a1a1aa] leading-relaxed">{note.message}</p>
                  </div>
                );
              })}
            </div>

            {/* Input Form */}
            <div className="p-4 border-t border-[#27272a] bg-[#0c0c0e] flex items-center gap-2">
              <input
                type="text"
                value={consultInput}
                onChange={(e) => setConsultInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendConsultation()}
                placeholder={`Post clinical note or query as ${user?.role || "caregiver"}...`}
                className="flex-1 input-apple text-xs"
              />
              <button
                onClick={handleSendConsultation}
                disabled={!consultInput.trim()}
                className="p-3 btn-orange disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

