"use client";

import React, { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Mic, MicOff, Send, Bot, Volume2, Sparkles, User, ShieldAlert } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ezcare";
  text: string;
  time: string;
}

export const EzCareChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      sender: "ezcare",
      text: "Hello Eleanor, I'm EzCare. The sun is shining gently outside, and your vitals are steady. How are you feeling right now?",
      time: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.05;
      utterance.rate = 0.95; // Soothing and measured cadence
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    // @ts-expect-error SpeechRecognition webkit fallback
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInput(speechToText);
      setIsListening(false);
      handleSendMessage(speechToText);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Query local Ollama backend wrapper
      const res = await fetch("http://localhost:8000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend,
          role: "patient",
          history: messages.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: Message = {
          id: `bot_${Date.now()}`,
          sender: "ezcare",
          text: data.response,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, botMsg]);
        speakText(data.response);
      } else {
        throw new Error("Local Ollama request failed");
      }
    } catch (e) {
      // Gentle offline fallback
      const fallbackReply =
        "You are in a safe place, and your caregiver is looking after you. Take a slow breath in and relax your shoulders. I'm right here beside you.";
      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: "ezcare",
        text: fallbackReply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      speakText(fallbackReply);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard glow className="flex flex-col h-[560px] p-0 overflow-hidden relative border-sky-500/20">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-white">EzCare Assistant</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                Ollama Llama 3.1:3b
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Zero-Latency Cognitive Voice & Text Companion</p>
          </div>
        </div>

        {isSpeaking && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs">
            <Volume2 className="w-3.5 h-3.5 animate-bounce" />
            Speaking
          </div>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                m.sender === "user"
                  ? "bg-sky-500/30 text-sky-300"
                  : "bg-indigo-600/30 text-indigo-300 border border-indigo-400/30"
              }`}
            >
              {m.sender === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-sky-400" />}
            </div>

            <div
              className={`max-w-[78%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                m.sender === "user"
                  ? "bg-sky-600/70 text-white rounded-tr-none shadow-md"
                  : "bg-slate-800/80 text-slate-200 border border-white/10 rounded-tl-none shadow-lg backdrop-blur-md"
              }`}
            >
              <p>{m.text}</p>
              <span className="block text-[9px] text-slate-400/70 mt-1 text-right">{m.time}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-sky-300/80 italic py-1 px-3">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            EzCare is formulating gentle response...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Interactive Voice & Text Input */}
      <div className="p-3.5 border-t border-white/10 bg-slate-900/40">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleVoiceInput}
            title={isListening ? "Listening... click to cancel" : "Start Voice Assistant"}
            className={`p-3 rounded-xl border transition-all ${
              isListening
                ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                : "glass-input text-slate-300 hover:text-sky-400 hover:border-sky-400/40"
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder={isListening ? "Listening to your voice..." : "Ask EzCare or request reassurance..."}
            className="flex-1 glass-input px-4 py-2.5 rounded-xl text-xs text-white placeholder-slate-400"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white disabled:opacity-40 transition-all shadow-md shadow-sky-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

