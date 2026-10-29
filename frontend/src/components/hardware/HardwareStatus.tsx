"use client";

import React from "react";
import { Radio, WifiOff, RefreshCw, Cpu, Activity } from "lucide-react";

interface HardwareStatusProps {
  isOnline: boolean;
  deviceId: string;
  lastHeartbeat: string | null;
  onRefresh: () => void;
  onLaunchSimulator?: () => void;
}

export const HardwareStatus: React.FC<HardwareStatusProps> = ({
  isOnline,
  deviceId,
  lastHeartbeat,
  onRefresh,
  onLaunchSimulator,
}) => {
  if (isOnline) {
    return (
      <div className="card-apple p-4 border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">ESP32 Hardware Online</span>
              <span className="text-[10px] text-emerald-400 font-mono">1Hz STREAM ACTIVE</span>
            </div>
            <p className="text-[11px] text-[#a1a1aa]">
              Node: <span className="font-mono text-white">{deviceId}</span> • Last packet: {lastHeartbeat || "Just now"}
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          title="Verify Heartbeat"
          className="p-2 rounded-xl text-[#71717a] hover:text-white hover:bg-[#18181b] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="card-apple p-6 border-[#27272a] bg-[#0a0a0a] space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#18181b] border border-[#27272a] text-[#71717a]">
            <WifiOff className="w-5 h-5 text-[#ff6700]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-white tracking-tight">
                Device Offline — Awaiting ESP32 Hardware Payload
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#18181b] border border-[#27272a] text-[#71717a]">
                NO MOCK TELEMETRY
              </span>
            </div>
            <p className="text-xs text-[#a1a1aa] leading-relaxed max-w-xl">
              No live physiological data is currently streaming from device{" "}
              <span className="font-mono text-white">{deviceId}</span>. Alzhmind strictly adheres to real clinical standards and does not generate synthetic vital signs or fake patient data when hardware is disconnected.
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="px-3 py-1.5 rounded-xl border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#a1a1aa] hover:text-white transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Ping Node</span>
        </button>
      </div>

      <div className="pt-3 border-t border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-[#71717a]">
        <div className="flex items-center gap-4">
          <span>Target Ingest: <code className="text-[#a1a1aa]">http://localhost:8000/api/telemetry</code></span>
          <span>Pins: <code className="text-[#a1a1aa]">SDA 21 / SCL 22</code></span>
        </div>

        {onLaunchSimulator && (
          <button
            onClick={onLaunchSimulator}
            className="text-xs text-[#ff6700] hover:text-[#ff5500] font-medium flex items-center gap-1"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Emit Test Hardware Frame (Simulator)</span>
          </button>
        )}
      </div>
    </div>
  );
};

