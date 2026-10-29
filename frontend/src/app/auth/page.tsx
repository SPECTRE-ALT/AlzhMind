"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, UserRole, EmergencyContact } from "@/context/AuthContext";
import {
  Lock,
  Mail,
  User,
  Phone,
  Stethoscope,
  Building,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Shield,
} from "lucide-react";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loginWithEmail, loginAsGuest, updateProfile, switchRole } = useAuth();

  const [step, setStep] = useState<"auth" | "onboarding">("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile Form state
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("caregiver");
  const [medicalId, setMedicalId] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [caregiverPhone, setCaregiverPhone] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [clinicHospital, setClinicHospital] = useState("");
  const [deviceId, setDeviceId] = useState("ESP32-ALZH-NODE-01");
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: "", relation: "", phone: "" },
  ]);

  // Guard ref to prevent the guest-login effect from firing more than once
  const guestHandled = useRef(false);

  // Handle URL mode query (e.g. /auth?mode=guest)
  useEffect(() => {
    if (guestHandled.current) return;
    const mode = searchParams.get("mode");
    if (mode === "guest") {
      guestHandled.current = true;
      loginAsGuest("caregiver");
      router.push("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // If user is already logged in but not onboarded, transition to onboarding
  useEffect(() => {
    if (user) {
      if (!user.isOnboarded && !user.isGuest) {
        setStep("onboarding");
        setEmail(user.email);
        setFullName(user.fullName || "");
        setRole(user.role || "caregiver");
        setMedicalId(user.medicalId || `MED-${Math.floor(100000 + Math.random() * 900000)}`);
      } else {
        // Already onboarded
        setFullName(user.fullName);
        setRole(user.role);
        setPrimaryPhone(user.primaryPhone);
        setCaregiverPhone(user.caregiverPhone);
        setDoctorName(user.doctorName);
        setDoctorPhone(user.doctorPhone);
        setClinicHospital(user.clinicHospital);
        setEmergencyContacts(
          user.emergencyContacts.length > 0
            ? user.emergencyContacts
            : [{ name: "", relation: "", phone: "" }]
        );
      }
    }
  }, [user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    await loginWithEmail(email);
    setIsSubmitting(false);
    setStep("onboarding");
  };

  const handleAddEmergencyContact = () => {
    setEmergencyContacts((prev) => [...prev, { name: "", relation: "", phone: "" }]);
  };

  const handleRemoveEmergencyContact = (idx: number) => {
    setEmergencyContacts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleContactChange = (idx: number, field: keyof EmergencyContact, val: string) => {
    setEmergencyContacts((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: val } : c))
    );
  };

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validContacts = emergencyContacts.filter(
      (c) => c.name.trim() !== "" && c.phone.trim() !== ""
    );

    updateProfile({
      fullName,
      role,
      medicalId,
      primaryPhone,
      caregiverPhone,
      doctorName,
      doctorPhone,
      clinicHospital,
      deviceId,
      emergencyContacts: validContacts,
    });

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-black text-[#f4f4f5] py-16 px-6">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Navigation back and header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#ff6700]">
            <Shield className="w-4 h-4" />
            <span>Secure Access & Verification</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {step === "auth" ? "Access Alzhmind Portal" : "Clinical & Safety Onboarding"}
          </h1>
          <p className="text-xs text-[#a1a1aa]">
            {step === "auth"
              ? "Sign in with your clinical credentials or enter with one-click Guest Test Mode."
              : "Register real patient vitals profile, designated contacts, and attending physician."}
          </p>
        </div>

        {/* Step 1: Auth form */}
        {step === "auth" && (
          <div className="card-apple p-8 space-y-6">
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-[#a1a1aa] block mb-1.5 font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="physician@hospital.org or family@alzhmind.health"
                    className="w-full input-apple"
                  />
                  <Mail className="w-4 h-4 absolute right-3.5 top-3.5 text-[#71717a]" />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#a1a1aa] block mb-1.5 font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full input-apple"
                  />
                  <Lock className="w-4 h-4 absolute right-3.5 top-3.5 text-[#71717a]" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 btn-orange flex items-center justify-center gap-2 text-sm mt-2"
              >
                <span>{isSubmitting ? "Authenticating..." : "Continue to Onboarding"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-4 border-t border-[#27272a] text-center space-y-3">
              <span className="text-xs text-[#71717a] block">Or evaluate the ecosystem immediately:</span>
              <button
                type="button"
                onClick={() => {
                  loginAsGuest("caregiver");
                  router.push("/dashboard");
                }}
                className="w-full py-3 btn-secondary text-xs flex items-center justify-center gap-2"
              >
                <span>Enter as Evaluator (Guest Test Mode)</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Patient/User Profile Onboarding */}
        {step === "onboarding" && (
          <div className="card-apple p-8 space-y-6">
            <form onSubmit={handleOnboardingSubmit} className="space-y-6">
              {/* Role selection */}
              <div>
                <label className="text-xs font-semibold text-[#a1a1aa] block mb-2 uppercase tracking-wider">
                  Interface Role Selection
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["patient", "caregiver", "doctor"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-medium border capitalize transition-colors ${
                        role === r
                          ? "bg-[#ff6700]/10 border-[#ff6700] text-[#ff6700]"
                          : "bg-[#121214] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient / User info */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-white block border-b border-[#27272a] pb-1">
                  1. Identification & Contact Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#a1a1aa] block mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Arthur Miller"
                      className="w-full input-apple"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#a1a1aa] block mb-1">Medical Record / ID</label>
                    <input
                      type="text"
                      value={medicalId}
                      onChange={(e) => setMedicalId(e.target.value)}
                      placeholder="MED-748920"
                      className="w-full input-apple"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#a1a1aa] block mb-1">Primary Patient Phone</label>
                    <input
                      type="tel"
                      value={primaryPhone}
                      onChange={(e) => setPrimaryPhone(e.target.value)}
                      placeholder="+1 (555) 014-9922"
                      className="w-full input-apple"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#a1a1aa] block mb-1">Assigned ESP32 Node ID</label>
                    <input
                      type="text"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                      className="w-full input-apple font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Attending Physician */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-white block border-b border-[#27272a] pb-1">
                  2. Attending Doctor & Clinical Center
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#a1a1aa] block mb-1">Attending Physician</label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      placeholder="Dr. Catherine Howard, MD"
                      className="w-full input-apple"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#a1a1aa] block mb-1">Doctor Phone / Pager</label>
                    <input
                      type="tel"
                      value={doctorPhone}
                      onChange={(e) => setDoctorPhone(e.target.value)}
                      placeholder="+1 (555) 019-3320"
                      className="w-full input-apple"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[#a1a1aa] block mb-1">Clinic / Hospital Affiliation</label>
                  <input
                    type="text"
                    value={clinicHospital}
                    onChange={(e) => setClinicHospital(e.target.value)}
                    placeholder="Metropolitan Neurology & Memory Clinic"
                    className="w-full input-apple"
                  />
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#27272a] pb-1">
                  <span className="text-xs font-semibold text-white">
                    3. Real Emergency Contacts
                  </span>
                  <button
                    type="button"
                    onClick={handleAddEmergencyContact}
                    className="text-[11px] text-[#ff6700] hover:text-[#ff5500] flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Contact
                  </button>
                </div>

                {emergencyContacts.map((contact, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl bg-[#121214] border border-[#27272a] space-y-2.5 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#71717a] font-medium">Contact #{index + 1}</span>
                      {emergencyContacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEmergencyContact(index)}
                          className="text-[#71717a] hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={contact.name}
                        onChange={(e) => handleContactChange(index, "name", e.target.value)}
                        className="input-apple text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Relation (e.g. Son)"
                        value={contact.relation}
                        onChange={(e) => handleContactChange(index, "relation", e.target.value)}
                        className="input-apple text-xs"
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={contact.phone}
                        onChange={(e) => handleContactChange(index, "phone", e.target.value)}
                        className="input-apple text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 btn-orange flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Profile & Open Telemetry Dashboard</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-[#71717a] p-12 text-center text-xs">Loading Auth...</div>}>
      <AuthContent />
    </Suspense>
  );
}

