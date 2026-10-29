"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  HeartPulse,
  Activity,
  Bot,
  Zap,
  Radio,
  Lock,
} from "lucide-react";

export default function LandingPage() {
  const { user, loginAsGuest } = useAuth();

  return (
    <div className="min-h-screen bg-black text-[#f4f4f5]">
      {/* Hero Showcase Section - Apple Editorial Style */}
      <section className="relative pt-20 pb-24 px-6 border-b border-[#27272a] overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Subtle Tagline */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-xl bg-[#121214] border border-[#27272a] text-xs font-medium text-[#a1a1aa]">
            <span className="w-2 h-2 rounded-full bg-[#ff6700]" />
            Continuous Wearable Edge Sensing & Zero-Latency AI
          </div>

          {/* Master Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
            Dignity, safety, and reassurance. In real time.
          </h1>

          {/* Subtext */}
          <p className="text-base sm:text-xl text-[#a1a1aa] max-w-2xl mx-auto font-normal leading-relaxed">
            Alzhmind bridges continuous biometric IoT telemetry, hardware fall detection, and an empathetic local AI care companion—engineered specifically for Alzheimer's patients, their families, and clinicians.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href={user ? "/dashboard" : "/auth"}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-medium text-sm text-white bg-[#ff6700] hover:bg-[#ff5500] transition-colors flex items-center justify-center gap-2 group"
            >
              <span>{user ? "Open Telemetry Hub" : "Get Started"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/auth?mode=guest"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-medium text-sm text-[#f4f4f5] bg-[#121214] border border-[#27272a] hover:border-[#3f3f46] hover:bg-[#18181b] transition-colors flex items-center justify-center gap-2"
            >
              <span>Try as Guest / Test Mode</span>
            </Link>
          </div>

          <p className="text-xs text-[#71717a] pt-1">
            Zero cloud requirement for conversational AI. Compatible with standard ESP32 edge nodes.
          </p>
        </div>
      </section>

      {/* Hardware Architecture Grid */}
      <section className="py-24 px-6 border-b border-[#27272a]">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="space-y-4 text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#ff6700]">
              Hardware Architecture
            </h2>
            <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Clinical telemetry right from the wrist.
            </h3>
            <p className="text-sm text-[#a1a1aa]">
              Autonomous ESP32 edge processing paired directly with clinical sensors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: MPU6050 Motion & Fall Detection */}
            <div className="card-apple p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center text-[#ff6700]">
                  <Activity className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-semibold text-white tracking-tight">
                  MPU6050 6-Axis Inertial Measurement
                </h4>
                <p className="text-xs leading-relaxed text-[#a1a1aa]">
                  Instantaneous freefall transition monitoring (&lt;0.55g) followed by impact threshold triggers (&gt;2.85g) and post-fall prone stillness detection.
                </p>
              </div>
              <div className="pt-4 border-t border-[#27272a] flex items-center justify-between text-[11px] text-[#71717a]">
                <span>I2C Address: 0x68</span>
                <span className="text-[#a1a1aa] font-medium">100Hz IMU Sample Rate</span>
              </div>
            </div>

            {/* Card 2: MAX30102 Optical Pulse Oximeter */}
            <div className="card-apple p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center text-[#ff6700]">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-semibold text-white tracking-tight">
                  MAX30102 Optical PPG Vitals
                </h4>
                <p className="text-xs leading-relaxed text-[#a1a1aa]">
                  Continuous non-invasive photoplethysmography extracting heart rate (BPM) and blood oxygen saturation (SpO2%) with low-power LED auto-calibration.
                </p>
              </div>
              <div className="pt-4 border-t border-[#27272a] flex items-center justify-between text-[11px] text-[#71717a]">
                <span>Dual Wavelength LED</span>
                <span className="text-[#a1a1aa] font-medium">Optical Noise Filter</span>
              </div>
            </div>

            {/* Card 3: ESP32 Edge Processing */}
            <div className="card-apple p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center text-[#ff6700]">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-semibold text-white tracking-tight">
                  ESP32 Microcontroller Node
                </h4>
                <p className="text-xs leading-relaxed text-[#a1a1aa]">
                  Low-latency Wi-Fi HTTP / WebSocket transmission. Direct telemetry dispatch to your local network or clinical server without intermediate hubs.
                </p>
              </div>
              <div className="pt-4 border-t border-[#27272a] flex items-center justify-between text-[11px] text-[#71717a]">
                <span>Wi-Fi 802.11 b/g/n</span>
                <span className="text-[#a1a1aa] font-medium">1Hz Transmission</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EzCare Cognitive Companion Highlight */}
      <section className="py-24 px-6 border-b border-[#27272a]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="badge-orange inline-block">Local AI Architecture</div>
            <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              EzCare Companion. Private, local, and humane.
            </h3>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              Dementia patients experience disorientation and acute sundowning anxiety. EzCare runs on a local **Ollama (Llama 3.1:3b)** instance on your premises—speaking in a warm, grounded human voice with zero internet dependency and zero risk to personal privacy.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-[#a1a1aa]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff6700]" />
                <span>Speech-to-Text and soothing Text-to-Speech integration</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#a1a1aa]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff6700]" />
                <span>Grounding memory orientation exercises tailored to individual patients</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#a1a1aa]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff6700]" />
                <span>Direct secure consultation conduit to attending physician</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/care"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#ff6700] hover:text-[#ff5500]"
              >
                Explore EzCare Portal <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="card-apple p-6 border-[#27272a] space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#ff6700]" />
                <span className="text-xs font-semibold text-white">EzCare Engine</span>
              </div>
              <span className="text-[10px] text-[#71717a] font-mono">OLLAMA // LOCALHOST:11434</span>
            </div>
            <div className="p-4 rounded-xl bg-[#121214] border border-[#27272a] space-y-2">
              <span className="text-[11px] text-[#71717a] uppercase font-semibold">User Prompt</span>
              <p className="text-xs text-[#f4f4f5]">"Where am I? Why is it getting so dark outside?"</p>
            </div>
            <div className="p-4 rounded-xl bg-[#18181b] border border-[#27272a] space-y-2">
              <span className="text-[11px] text-[#ff6700] uppercase font-semibold">EzCare Grounding Response</span>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                "You are at home in your comfortable living room, and you are completely safe. It is just evening arriving. Take a gentle breath in... and out. Your family is right nearby."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-black">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717a]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff6700]" />
            <span className="font-semibold text-[#a1a1aa]">Alzhmind</span>
            <span>— Cognitive Care & IoT Medical Technology</span>
          </div>
          <div>Strict Minimalist Architecture • 20% Radius Geometry • Zero Mock Telemetry</div>
        </div>
      </footer>
    </div>
  );
}
