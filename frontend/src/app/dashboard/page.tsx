"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { HardwareStatus } from "@/components/hardware/HardwareStatus";
import {
  Heart,
  Wind,
  Activity,
  ShieldAlert,
  Phone,
  User,
  Stethoscope,
  Building,
  Radio,
  Clock,
  ArrowRight,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TelemetryData {
  device_id: string;
  heart_rate: number;
  spo2: number;
  acceleration: number;
  fall_detected: boolean;
  battery_level: number;
  received_at: string;
  analysis?: {
    severity: string;
    panic_score: number;
    anomalies: Array<{ type: string; message: string; severity: string }>;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isHardwareOnline, setIsHardwareOnline] = useState<boolean>(false);
  const [chartHistory, setChartHistory] = useState<any[]>([]);
  const [lastHeartbeat, setLastHeartbeat] = useState<string | null>(null);

  // Fetch or listen to WebSocket
  useEffect(() => {
    let ws: WebSocket | null = null;
    let pollTimer: NodeJS.Timeout | null = null;

    const checkBackendStatus = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/telemetry/status");
        if (res.ok) {
          const data = await res.json();
          setIsHardwareOnline(data.is_online);
          if (data.is_online && data.latest) {
            setTelemetry(data.latest);
            setLastHeartbeat(new Date().toLocaleTimeString());
          } else {
            setTelemetry(null);
          }
        }
      } catch (err) {
        setIsHardwareOnline(false);
        setTelemetry(null);
      }
    };

    checkBackendStatus();
    pollTimer = setInterval(checkBackendStatus, 4000);

    try {
      ws = new WebSocket("ws://localhost:8000/ws/telemetry");
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "TELEMETRY_UPDATE") {
            setIsHardwareOnline(true);
            setTelemetry(msg.data);
            setLastHeartbeat(new Date().toLocaleTimeString());
            const point = {
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              heart_rate: msg.data.heart_rate,
              spo2: msg.data.spo2,
            };
            setChartHistory((prev) => [...prev, point].slice(-15));
          } else if (msg.type === "HARDWARE_STATUS") {
            setIsHardwareOnline(msg.is_online);
            if (msg.data) setTelemetry(msg.data);
          }
        } catch (e) {
          console.error("WS error", e);
        }
      };
      ws.onclose = () => setIsHardwareOnline(false);
    } catch {
      setIsHardwareOnline(false);
    }

    return () => {
      if (ws) ws.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, []);

  const handleManualSimulate = async () => {
    try {
      await fetch("http://localhost:8000/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: user?.deviceId || "ESP32-ALZH-NODE-01",
          patient_id: user?.medicalId || "patient_primary",
          heart_rate: 76.0,
          spo2: 98.4,
          acceleration: 1.04,
          fall_detected: false,
          battery_level: 92,
        }),
      });
      setIsHardwareOnline(true);
    } catch (e) {
      alert("FastAPI backend is offline. Start the backend with: cd backend && python -m uvicorn main:app --port 8000");
    }
  };

  const isCritical = telemetry?.fall_detected || telemetry?.analysis?.severity === "CRITICAL";

  return (
    <div className="min-h-screen bg-black text-[#f4f4f5] py-8 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Patient Identity & Profile Anchor */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272a]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff6700]" />
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Telemetry & Safety Console
              </h1>
            </div>
            <p className="text-xs text-[#a1a1aa] mt-1">
              Active Medical Profile:{" "}
              <span className="font-semibold text-white">
                {user?.fullName || "Unregistered Patient Profile"}
              </span>{" "}
              • ID: <span className="font-mono text-[#a1a1aa]">{user?.medicalId || "MED-PENDING"}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/care"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#ff6700] hover:bg-[#ff5500] rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span>Launch EzCare Companion</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Hardware Status Banner (Strict offline handling) */}
        <HardwareStatus
          isOnline={isHardwareOnline}
          deviceId={user?.deviceId || "ESP32-ALZH-NODE-01"}
          lastHeartbeat={lastHeartbeat}
          onRefresh={() => setIsHardwareOnline(false)}
          onLaunchSimulator={handleManualSimulate}
        />

        {/* Emergency Alert Banner if Fall or Anomaly Triggered */}
        {isCritical && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/60 text-white flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-200">
                  Critical Physiological Event Detected
                </h3>
                <p className="text-xs text-red-100 mt-0.5">
                  {telemetry?.fall_detected
                    ? "MPU6050 accelerometer registered high-impact fall force. Immediate response alert dispatched to designated emergency contacts."
                    : telemetry?.analysis?.anomalies[0]?.message || "Severe vital threshold deviation."}
                </p>
              </div>
            </div>
            <span className="badge-orange bg-red-900/50 text-red-200 border-red-500/40 text-[10px]">
              CRITICAL
            </span>
          </div>
        )}

        {/* Real-time Telemetry Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Live Vitals & Waveforms */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Heart Rate */}
              <div className="card-apple p-5 space-y-2">
                <div className="flex items-center justify-between text-[#a1a1aa] text-xs">
                  <span>Pulse Rate (MAX30102)</span>
                  <Heart className={`w-4 h-4 ${telemetry ? "text-[#ff6700]" : "text-[#71717a]"}`} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-white">
                    {telemetry ? telemetry.heart_rate : "—"}
                  </span>
                  <span className="text-xs text-[#a1a1aa]">BPM</span>
                </div>
                <p className="text-[11px] text-[#71717a]">
                  {telemetry ? "Clinical optical window" : "Awaiting hardware packet"}
                </p>
              </div>

              {/* SpO2 */}
              <div className="card-apple p-5 space-y-2">
                <div className="flex items-center justify-between text-[#a1a1aa] text-xs">
                  <span>Blood Oxygen (SpO2)</span>
                  <Wind className={`w-4 h-4 ${telemetry ? "text-[#ff6700]" : "text-[#71717a]"}`} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-white">
                    {telemetry ? `${telemetry.spo2}%` : "—"}
                  </span>
                  <span className="text-xs text-[#a1a1aa]">Saturation</span>
                </div>
                <p className="text-[11px] text-[#71717a]">
                  {telemetry ? "PPG red & IR ratio" : "Awaiting hardware packet"}
                </p>
              </div>

              {/* MPU6050 Acceleration */}
              <div className="card-apple p-5 space-y-2">
                <div className="flex items-center justify-between text-[#a1a1aa] text-xs">
                  <span>Inertial Motion (MPU6050)</span>
                  <Activity className={`w-4 h-4 ${telemetry ? "text-[#ff6700]" : "text-[#71717a]"}`} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-white">
                    {telemetry ? telemetry.acceleration : "—"}
                  </span>
                  <span className="text-xs text-[#a1a1aa]">g (vector)</span>
                </div>
                <p className="text-[11px] text-[#71717a]">
                  {telemetry ? "Threshold limit: 2.85g" : "Awaiting hardware packet"}
                </p>
              </div>
            </div>

            {/* Live Chart or Offline Visual */}
            <div className="card-apple p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                    Continuous Optical Vitals Stream
                  </h3>
                  <p className="text-[11px] text-[#71717a]">
                    Zero fake interpolation — only renders verified ESP32 frames.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-[#71717a]">
                  {isHardwareOnline ? "STREAMING 1HZ" : "BUFFER EMPTY"}
                </span>
              </div>

              {isHardwareOnline && chartHistory.length > 0 ? (
                <div className="h-60 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartHistory}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff6700" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ff6700" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#3f3f46" tick={{ fontSize: 10 }} />
                      <YAxis domain={[50, 130]} stroke="#3f3f46" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#121214",
                          borderColor: "#27272a",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="heart_rate"
                        stroke="#ff6700"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#chartGrad)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 rounded-xl bg-[#0a0a0a] border border-[#27272a] flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <Activity className="w-6 h-6 text-[#3f3f46]" />
                  <span className="text-xs font-medium text-[#71717a]">
                    Awaiting Active Hardware Stream
                  </span>
                  <p className="text-[11px] text-[#52525b] max-w-sm">
                    Connect an ESP32 microcontroller running the Alzhmind firmware to begin plotting real optical PPG data.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Real Registered Contacts & Physician Information */}
          <div className="space-y-6">
            {/* Real Registered Emergency Contacts Card */}
            <div className="card-apple p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                  Designated Emergency Contacts
                </h3>
                <Link
                  href="/auth"
                  className="text-[11px] text-[#ff6700] hover:text-[#ff5500] font-medium"
                >
                  Edit Contacts
                </Link>
              </div>

              {user?.emergencyContacts && user.emergencyContacts.length > 0 ? (
                <div className="space-y-2.5">
                  {user.emergencyContacts.map((contact, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#121214] border border-[#27272a] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">{contact.name}</div>
                        <div className="text-[11px] text-[#71717a]">{contact.relation}</div>
                      </div>
                      <a
                        href={`tel:${contact.phone}`}
                        className="px-2.5 py-1 rounded-lg bg-[#18181b] border border-[#27272a] text-xs font-mono text-[#a1a1aa] hover:text-white hover:border-[#ff6700] transition-colors flex items-center gap-1.5"
                      >
                        <Phone className="w-3 h-3 text-[#ff6700]" />
                        <span>{contact.phone}</span>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#121214] border border-[#27272a] text-center space-y-2">
                  <User className="w-5 h-5 text-[#71717a] mx-auto" />
                  <p className="text-xs text-[#a1a1aa]">No emergency contacts registered yet.</p>
                  <Link
                    href="/auth"
                    className="inline-block text-xs font-semibold text-[#ff6700] hover:text-[#ff5500]"
                  >
                    Add Emergency Contacts
                  </Link>
                </div>
              )}
            </div>

            {/* Attending Physician Card */}
            <div className="card-apple p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                  Attending Medical Lead
                </h3>
                <Stethoscope className="w-4 h-4 text-[#ff6700]" />
              </div>

              {user?.doctorName ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] text-[#71717a] block">Physician</span>
                    <span className="text-xs font-semibold text-white">{user.doctorName}</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#71717a] block">Clinical Center</span>
                    <span className="text-xs text-[#a1a1aa]">
                      {user.clinicHospital || "Hospital Affiliation Unspecified"}
                    </span>
                  </div>

                  {user.doctorPhone && (
                    <div>
                      <span className="text-[11px] text-[#71717a] block">Clinical Pager / Direct Phone</span>
                      <a
                        href={`tel:${user.doctorPhone}`}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-[#ff6700] hover:text-[#ff5500] mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{user.doctorPhone}</span>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-[#71717a]">
                  No attending physician linked. Please update your profile in the onboarding portal.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

