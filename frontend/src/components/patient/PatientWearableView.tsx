"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Heart, Wind, ShieldAlert, PhoneCall, Volume2, Bot, Sparkles, MapPin } from "lucide-react";

export const PatientWearableView: React.FC<{
  heartRate: number;
  spo2: number;
  fallDetected: boolean;
  onCallHelp: () => void;
}> = ({ heartRate, spo2, fallDetected, onCallHelp }) => {
  const [soothingActive, setSoothingActive] = useState(false);

  const playSoothingChime = () => {
    setSoothingActive(true);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(
        "Hello Eleanor. You are in your room, perfectly safe and warm. Take a deep breath in through your nose... and slowly out through your mouth. Your family is right here."
      );
      utter.pitch = 1.0;
      utter.rate = 0.9;
      utter.onend = () => setSoothingActive(false);
      window.speechSynthesis.speak(utter);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 py-6 px-4">
      {/* Patient Welcome Header */}
      <GlassCard glow className="text-center p-6 border-sky-400/30">
        <div className="inline-flex p-3 rounded-2xl bg-sky-500/10 text-sky-400 mb-3 border border-sky-400/20">
          <Bot className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Good day, Eleanor</h1>
        <p className="text-sm text-sky-200/80 mt-1">Your Alzhmind smart band is safely keeping watch over you.</p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Status: Safe at Home in Living Room
        </div>
      </GlassCard>

      {/* High Contrast Vital Signs for Patient Ease */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-6 text-center border-rose-500/20">
          <Heart className="w-8 h-8 text-rose-400 mx-auto mb-2 animate-pulse" />
          <span className="text-xs text-slate-300 font-medium block">Heart Rhythm</span>
          <span className="text-4xl font-extrabold text-white mt-1 block">{heartRate}</span>
          <span className="text-xs text-rose-300 mt-1 block">Beats / Min (Calm)</span>
        </GlassCard>

        <GlassCard className="p-6 text-center border-sky-500/20">
          <Wind className="w-8 h-8 text-sky-400 mx-auto mb-2" />
          <span className="text-xs text-slate-300 font-medium block">Oxygen Level</span>
          <span className="text-4xl font-extrabold text-white mt-1 block">{spo2}%</span>
          <span className="text-xs text-sky-300 mt-1 block">Full & Healthy</span>
        </GlassCard>
      </div>

      {/* Emergency Fall Alert if Active */}
      {fallDetected && (
        <div className="p-5 rounded-2xl bg-rose-600/90 text-white shadow-2xl animate-bounce flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 shrink-0" />
            <div>
              <h4 className="font-bold text-base">Caregiver Alert Triggered</h4>
              <p className="text-xs text-rose-100">Marcus & Dr. Chen have been notified. Stay seated.</p>
            </div>
          </div>
        </div>
      )}

      {/* Big Reassurance Buttons */}
      <div className="space-y-3 pt-2">
        <button
          onClick={playSoothingChime}
          className={`w-full py-4 px-6 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-3 shadow-lg ${
            soothingActive
              ? "bg-indigo-600 text-white animate-pulse"
              : "bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95 shadow-sky-500/20"
          }`}
        >
          <Sparkles className="w-5 h-5 text-amber-300" />
          {soothingActive ? "Speaking Soothing Words..." : "Press for Gentle Guidance"}
        </button>

        <button
          onClick={onCallHelp}
          className="w-full py-4 px-6 rounded-2xl font-bold text-base bg-rose-600/80 hover:bg-rose-600 border border-rose-400/40 text-white transition-all flex items-center justify-center gap-3 shadow-lg shadow-rose-600/30"
        >
          <PhoneCall className="w-5 h-5" />
          Call Caregiver Marcus Immediately
        </button>
      </div>
    </div>
  );
};

