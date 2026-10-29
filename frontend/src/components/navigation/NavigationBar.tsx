"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, UserRole } from "@/context/AuthContext";
import { Activity, Shield, MessageSquare, LogOut, Radio, User, ChevronDown } from "lucide-react";

export const NavigationBar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, switchRole } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Overview" },
    { href: "/dashboard", label: "Telemetry & Safety" },
    { href: "/care", label: "EzCare Companion" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-md border-b border-[#27272a]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff6700] transition-transform group-hover:scale-125" />
            <span className="text-base font-semibold tracking-tight text-white">Alzhmind</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[#27272a]">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? "text-white bg-[#1c1c1e]"
                      : "text-[#a1a1aa] hover:text-white hover:bg-[#121214]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: Session State, Role Badge & CTA */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Dynamic Role Switcher */}
              <div className="relative">
                <button
                  onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121214] border border-[#27272a] text-xs text-white hover:border-[#3f3f46] transition-colors"
                >
                  <span className="text-[#a1a1aa]">Role:</span>
                  <span className="font-semibold capitalize text-[#ff6700]">{user.role}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#a1a1aa]" />
                </button>

                {roleMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#121214] border border-[#27272a] p-1.5 shadow-2xl z-50">
                    <div className="px-2.5 py-1 text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">
                      Switch Role View
                    </div>
                    {(["patient", "caregiver", "doctor"] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          switchRole(r);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs capitalize flex items-center justify-between ${
                          user.role === r
                            ? "bg-[#ff6700]/10 text-[#ff6700] font-semibold"
                            : "text-[#a1a1aa] hover:text-white hover:bg-[#1c1c1e]"
                        }`}
                      >
                        {r}
                        {user.role === r && <span className="w-1.5 h-1.5 rounded-full bg-[#ff6700]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Profile or Guest indicator */}
              <Link
                href="/auth"
                className="hidden sm:flex items-center gap-2 text-xs text-[#a1a1aa] hover:text-white px-2 py-1 rounded-lg"
              >
                <User className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px]">
                  {user.fullName || user.email.split("@")[0]}
                </span>
                {user.isGuest && (
                  <span className="text-[10px] text-[#71717a] border border-[#27272a] px-1.5 py-0.2 rounded-md">
                    Guest
                  </span>
                )}
              </Link>

              {/* Logout */}
              <button
                onClick={logout}
                title="Log Out"
                className="p-2 rounded-xl text-[#a1a1aa] hover:text-white hover:bg-[#1c1c1e] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth"
                className="px-4 py-1.5 text-xs text-white border border-[#27272a] hover:border-[#3f3f46] rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth?mode=guest"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#ff6700] hover:bg-[#ff5500] rounded-xl transition-colors"
              >
                Guest Access
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

