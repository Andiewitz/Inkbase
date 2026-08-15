"use client";

import React from "react";
import { motion } from "framer-motion";

export function WritingVelocityChart({
  wordCount = 1116,
}: {
  wordCount?: number;
}) {
  const points = [
    { month: "Jan", words: 200, x: 30, y: 70 },
    { month: "Feb", words: 450, x: 90, y: 45 },
    { month: "Mar", words: 380, x: 150, y: 55 },
    { month: "Apr", words: 620, x: 210, y: 30 },
    { month: "May", words: wordCount, x: 270, y: 20, active: true },
    { month: "Jun", words: 500, x: 330, y: 48 },
    { month: "Jul", words: 720, x: 390, y: 25 },
    { month: "Aug", words: 680, x: 450, y: 32 },
    { month: "Sep", words: 890, x: 510, y: 15 },
  ];

  // SVG smooth cubic bezier path
  const pathD =
    "M 30 70 C 60 70, 60 45, 90 45 C 120 45, 120 55, 150 55 C 180 55, 180 30, 210 30 C 240 30, 240 20, 270 20 C 300 20, 300 48, 330 48 C 360 48, 360 25, 390 25 C 420 25, 420 32, 450 32 C 480 32, 480 15, 510 15";
  const areaD = `${pathD} L 510 85 L 30 85 Z`;

  return (
    <div className="relative flex flex-col justify-between rounded-3xl border border-white/80 bg-gradient-to-br from-[#EAF6F9] via-[#DEF2F6] to-[#CFEDF3] p-5 shadow-[0_4px_16px_rgba(120,165,185,0.12)] overflow-hidden">
      <div className="flex items-center justify-between pb-1">
        <h4 className="text-xs font-bold text-slate-700">Writing Velocity</h4>
        <span className="text-[10px] font-semibold text-slate-500 bg-white/70 px-2 py-0.5 rounded-full border border-white/90">
          Weekly Prose Output
        </span>
      </div>

      <div className="relative w-full pt-3 pb-1">
        <svg viewBox="0 0 540 95" className="w-full h-24 overflow-visible">
          <defs>
            <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2C7E86" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2C7E86" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="30" y1="25" x2="510" y2="25" stroke="#D1E4EC" strokeDasharray="3 3" />
          <line x1="30" y1="55" x2="510" y2="55" stroke="#D1E4EC" strokeDasharray="3 3" />
          <line x1="30" y1="85" x2="510" y2="85" stroke="#CBDDE5" />

          {/* Shaded area */}
          <path d={areaD} fill="url(#velocityGradient)" />

          {/* Wave line */}
          <path
            d={pathD}
            fill="none"
            stroke="#2C7E86"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Node points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={pt.active ? "5" : "3.5"}
                fill={pt.active ? "#2C7E86" : "#FFFFFF"}
                stroke="#2C7E86"
                strokeWidth="2"
                className="transition-transform hover:scale-125"
              />
              {pt.active && (
                <g>
                  {/* Tooltip badge */}
                  <rect
                    x={pt.x - 28}
                    y={pt.y - 22}
                    width="56"
                    height="16"
                    rx="4"
                    fill="#FFFFFF"
                    stroke="#D0E3EC"
                    strokeWidth="1"
                    className="shadow-2xs"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 11}
                    textAnchor="middle"
                    className="text-[8px] font-bold fill-slate-800"
                  >
                    {pt.words} w/d
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between px-2 pt-1 text-[9px] font-semibold text-slate-500">
          {points.map((pt, i) => (
            <span key={i}>{pt.month}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
