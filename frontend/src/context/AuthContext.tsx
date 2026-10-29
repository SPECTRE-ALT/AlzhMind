"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "patient" | "caregiver" | "doctor";

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  medicalId: string;
  primaryPhone: string;
  caregiverPhone: string;
  doctorName: string;
  doctorPhone: string;
  clinicHospital: string;
  emergencyContacts: EmergencyContact[];
  deviceId: string; // Associated ESP32 Node
  isOnboarded: boolean;
  isGuest?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string) => Promise<void>;
  loginAsGuest: (preferredRole?: UserRole) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
}

const STORAGE_KEY = "alzhmind_user_profile";

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithEmail: async () => {},
  loginAsGuest: () => {},
  updateProfile: () => {},
  switchRole: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setUser(parsed);
      } catch (e) {
        console.error("Failed to parse cached session", e);
      }
    }
    setLoading(false);
  }, []);

  const saveUser = (u: UserProfile | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const loginWithEmail = async (email: string) => {
    // Look up if user has prior recorded profile or create pending onboarding profile
    const existing = user && user.email === email ? user : null;
    if (existing) {
      saveUser(existing);
      return;
    }

    const newUser: UserProfile = {
      uid: `usr_${Date.now()}`,
      email,
      fullName: "",
      role: "patient",
      medicalId: `MED-${Math.floor(100000 + Math.random() * 900000)}`,
      primaryPhone: "",
      caregiverPhone: "",
      doctorName: "",
      doctorPhone: "",
      clinicHospital: "",
      emergencyContacts: [],
      deviceId: "ESP32-ALZH-NODE-01",
      isOnboarded: false,
      isGuest: false,
    };
    saveUser(newUser);
  };

  const loginAsGuest = (preferredRole: UserRole = "caregiver") => {
    const guestUser: UserProfile = {
      uid: "guest_session_01",
      email: "guest.demo@alzhmind.internal",
      fullName: preferredRole === "doctor" ? "Dr. A. Vance, MD" : preferredRole === "caregiver" ? "David Miller" : "Arthur Miller",
      role: preferredRole,
      medicalId: "MED-GUEST-8841",
      primaryPhone: "+1 (555) 014-9922",
      caregiverPhone: "+1 (555) 018-4491",
      doctorName: "Dr. Catherine Howard, MD",
      doctorPhone: "+1 (555) 019-3320",
      clinicHospital: "Metropolitan Neurology Institute",
      emergencyContacts: [
        { name: "David Miller", relation: "Son / Primary Caregiver", phone: "+1 (555) 018-4491" },
        { name: "Sarah Miller", relation: "Daughter", phone: "+1 (555) 012-7744" },
      ],
      deviceId: "ESP32-ALZH-NODE-01",
      isOnboarded: true,
      isGuest: true,
    };
    saveUser(guestUser);
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data, isOnboarded: true };
    saveUser(updated);
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    saveUser(updated);
  };

  const logout = () => {
    saveUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        loginAsGuest,
        updateProfile,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
