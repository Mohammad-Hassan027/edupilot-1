import React from "react";

interface ProgressRingProps {
  size?: number;
  progress: number; // 0 to 100
  strokeWidth?: number;
  className?: string;
  glow?: boolean;
}

export function ProgressRing({
  size = 120,
  progress,
  strokeWidth = 10,
  className = "",
  glow = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(Math.max(progress, 0), 100) / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          className="text-secondary"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="text-primary transition-all duration-500 ease-out"
          stroke="url(#progressGradient)"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            filter: glow ? "drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))" : "none",
          }}
        />
        {/* Gradients */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--chart-3, 199 89% 48%))" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
