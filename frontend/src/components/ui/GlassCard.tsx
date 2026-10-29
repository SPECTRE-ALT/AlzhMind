"use client";

import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  glow = false,
  interactive = false,
  onClick,
}) => {
  const baseClasses = glow
    ? "glass-panel-glow"
    : interactive
    ? "glass-card-interactive"
    : "glass-panel";

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-5 ${baseClasses} ${interactive ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
};

