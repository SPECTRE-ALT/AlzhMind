"use client";

import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShieldAlert, AlertTriangle, CheckCircle, Zap, MapPin, BatteryCharging } from "lucide-react";

export interface AnomalyItem {
  type: string;
  message: string;
  severity: "NORMAL" | "WARNING" | "CRITICAL";
}

export const MLAnomalyPanel: React.FC<{
  severity: string;
  panicScore: number;
  anomalies: AnomalyItem[];
  fallDetected: boolean;
  batteryLevel: number;
  location: { lat: number; lng: number; zone: string };
  onTriggerSim: (type: "FALL" | "PANIC") => void;
}> = ({
  severity,
  panicScore,
  anomalies,
  fallDetected,
  batteryLevel,
  location,
  onTriggerSim,
}) => {
  const isCritical = severity === "CRITICAL" || fallDetected;
  const isWarning = severity === "WARNING" && !isCritical;

  return (
    <div className="space-y-4">
      {/* Fall & Critical Alert Banner */}
      {isCritical && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/50 backdrop-blur-xl animate-pulse flex items-start gap-3.5 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
          <div className="p-2.5 rounded-xl bg-rose-500 text-white shrink-0 mt-0.5">
            <ShieldAlert className="w-6 h-6 animate-bounce" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                Immediate Clinical Attention Required!
              </h3>
              <span className="text-[10px] bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded-full border border-rose-400/40 font-mono">
                CRITICAL EVENT
              </span>
            </div>
            <p className="text-xs text-rose-200 mt-1 leading-relaxed">
              {fallDetected
                ? "Rapid deceleration & prone posture registered by ESP32 MPU6050. Emergency medical response team notified."
                : anomalies[0]?.message || "Severe physiological anomaly detected."}
            </p>
          </div>
        </div>
      )}

      {/* Safety Matrix Card */}
      <GlassCard className="border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Cognitive Agitation & Safety Engine
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">ML Heuristic Model v2.4</span>
        </div>

        {/* Panic / Agitation Meter */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400">Panic & Wandering Agitation Index</span>
            <span
              className={`font-bold ${
                panicScore > 75
                  ? "text-rose-400"
                  : panicScore > 40
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {panicScore} / 100
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                panicScore > 75
                  ? "bg-gradient-to-r from-amber-500 to-rose-500"
                  : panicScore > 40
                  ? "bg-amber-400"
                  : "bg-emerald-400"
              }`}
              style={{ width: `${Math.min(100, panicScore)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Calculated via continuous HRV variance & subtle IMU involuntary tremor index.
          </p>
        </div>

        {/* Geofence & Location */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5 flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 block">Spatial Geofence</span>
              <span className="font-medium text-slate-200">{location.zone}</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5 flex items-start gap-2.5">
            <BatteryCharging className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 block">Wearable Battery</span>
              <span className="font-medium text-slate-200">{batteryLevel}% (Li-Po 3.7V)</span>
            </div>
          </div>
        </div>

        {/* Demo Simulation Injection Buttons */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Hardware Demo Injection:</span>
          <div className="flex gap-2">
            <button
              onClick={() => onTriggerSim("FALL")}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-all"
            >
              Simulate Fall
            </button>
            <button
              onClick={() => onTriggerSim("PANIC")}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
            >
              Simulate Panic
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

