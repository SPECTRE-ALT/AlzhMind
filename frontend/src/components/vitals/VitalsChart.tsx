"use client";

import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Activity, Heart, Wind, AlertCircle } from "lucide-react";

export interface TelemetryPoint {
  time: string;
  heart_rate: number;
  spo2: number;
  acceleration: number;
}

export const VitalsChart: React.FC<{
  data: TelemetryPoint[];
  currentHR: number;
  currentSpO2: number;
  currentAcc: number;
}> = ({ data, currentHR, currentSpO2, currentAcc }) => {
  return (
    <div className="space-y-4">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Heart Rate */}
        <GlassCard glow className="relative overflow-hidden border-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Heart Rate (MAX30102)</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Heart className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white">{currentHR}</span>
            <span className="text-xs text-rose-300 font-medium">BPM</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Normal: 60 - 100</span>
            <span className={currentHR > 100 || currentHR < 55 ? "text-amber-400 font-semibold" : "text-emerald-400"}>
              {currentHR > 100 ? "Tachycardia" : currentHR < 55 ? "Bradycardia" : "Optimal Rhythm"}
            </span>
          </div>
        </GlassCard>

        {/* SpO2 */}
        <GlassCard glow className="relative overflow-hidden border-sky-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Blood Oxygen (SpO2)</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Wind className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white">{currentSpO2}%</span>
            <span className="text-xs text-sky-300 font-medium">Saturation</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Normal: &gt; 95%</span>
            <span className={currentSpO2 < 93 ? "text-rose-400 font-semibold" : "text-emerald-400"}>
              {currentSpO2 < 93 ? "Hypoxia Risk" : "Well Oxygenated"}
            </span>
          </div>
        </GlassCard>

        {/* Acceleration & Motion */}
        <GlassCard glow className="relative overflow-hidden border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">6-Axis Motion (MPU6050)</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white">{currentAcc}</span>
            <span className="text-xs text-indigo-300 font-medium">g (accel)</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Impact threshold: 2.85g</span>
            <span className={currentAcc > 2.5 ? "text-rose-400 font-semibold animate-pulse" : "text-indigo-300"}>
              {currentAcc > 2.5 ? "Impact Registered" : "Gentle Gait"}
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Live Stream Waveform Chart */}
      <GlassCard className="p-5 border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Real-Time High-Precision Optical Pulse Waveform
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">Live 1Hz Stream via ESP32 Node</span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis domain={[50, 140]} stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  backdropFilter: "blur(10px)",
                  fontSize: "12px",
                  color: "#f8fafc",
                }}
              />
              <ReferenceLine y={100} stroke="#e11d48" strokeDasharray="3 3" label={{ value: "High HR Limit", fill: "#f43f5e", fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="heart_rate"
                name="Heart Rate (BPM)"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#hrGrad)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
};

