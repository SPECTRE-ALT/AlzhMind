"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Send, UserCircle2, Stethoscope, ShieldCheck, HeartHandshake } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export interface ConsultationMsg {
  id: string;
  sender_role: string;
  sender_name: string;
  message: string;
  timestamp: string;
}

export const DoctorConsultationPortal: React.FC<{
  messages: ConsultationMsg[];
  onSendMessage: (msg: string) => void;
}> = ({ messages, onSendMessage }) => {
  const { user } = useAuth();
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
  };

  return (
    <GlassCard className="flex flex-col h-[560px] p-0 overflow-hidden border-teal-500/20">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <HeartHandshake className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-white">Clinical Consultation Portal</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                End-to-End Secure
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Direct Doctor & Caregiver Clinical Notes</p>
          </div>
        </div>
      </div>

      {/* Message history */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m) => {
          const isMe = user?.role === m.sender_role;
          const isDoc = m.sender_role === "doctor";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  isDoc
                    ? "bg-sky-500/20 text-sky-300 border border-sky-400/30"
                    : "bg-teal-500/20 text-teal-300 border border-teal-400/30"
                }`}
              >
                {isDoc ? <Stethoscope className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs ${
                  isMe
                    ? "bg-teal-600/70 text-white rounded-tr-none shadow-md"
                    : "bg-slate-800/80 text-slate-200 border border-white/10 rounded-tl-none shadow-lg"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1 border-b border-white/10 pb-1">
                  <span className="font-semibold text-[11px] text-teal-300">{m.sender_name}</span>
                  <span className="text-[9px] text-slate-400">{m.timestamp}</span>
                </div>
                <p className="leading-relaxed">{m.message}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input controls */}
      <div className="p-3.5 border-t border-white/10 bg-slate-900/40 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={`Leave clinical update as ${user?.role.toUpperCase()}...`}
          className="flex-1 glass-input px-4 py-2.5 rounded-xl text-xs text-white placeholder-slate-400"
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="p-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white disabled:opacity-40 transition-all shadow-md shadow-teal-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </GlassCard>
  );
};

