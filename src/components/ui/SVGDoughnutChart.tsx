"use client";

import { useState } from "react";
import { formatMontant } from "@/lib/kpi";

interface SVGDoughnutChartProps {
  data: {
    label: string;
    value: number;
    color: string;
    strokeColor: string;
  }[];
  title?: string;
}

export function SVGDoughnutChart({ data, title }: SVGDoughnutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  // SVG parameters
  const size = 180;
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 14;
  const center = size / 2;

  let currentOffset = 0;

  const segments = data.map((item, index) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const dashArray = `${(percentage / 100) * circumference} ${circumference}`;
    const dashOffset = currentOffset;
    
    // Accumulate offset (since SVG stroke-dashoffset grows clockwise, we subtract it)
    currentOffset -= (percentage / 100) * circumference;

    return {
      ...item,
      percentage,
      dashArray,
      dashOffset,
      index,
    };
  });

  const activeSegment = hoveredIndex !== null ? segments[hoveredIndex] : null;

  return (
    <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-around gap-6 py-2">
      <div className="relative w-[180px] h-[180px] flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 select-none"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {segments.map((seg) => {
            const isHovered = hoveredIndex === seg.index;
            return (
              <circle
                key={seg.label}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={seg.strokeColor}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer origin-center"
                onMouseEnter={() => setHoveredIndex(seg.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  filter: isHovered ? "drop-shadow(0 4px 6px rgba(0,0,0,0.08))" : "none",
                }}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
          {activeSegment ? (
            <>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider truncate max-w-[100px]">
                {activeSegment.label}
              </p>
              <p className="text-sm font-extrabold text-gray-900 mt-0.5">
                {activeSegment.percentage.toFixed(0)}%
              </p>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                {formatMontant(activeSegment.value)}
              </p>
            </>
          ) : (
            <>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                Total
              </p>
              <p className="text-base font-black text-gray-900 mt-0.5">
                {formatMontant(total)}
              </p>
              <p className="text-[9px] text-gray-400 font-medium">Répartition</p>
            </>
          )}
        </div>
      </div>

      {/* Legends */}
      <div className="flex-1 w-full max-w-[200px] flex flex-col gap-2">
        {segments.map((seg) => {
          const isHovered = hoveredIndex === seg.index;
          return (
            <div
              key={seg.label}
              onMouseEnter={() => setHoveredIndex(seg.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                isHovered ? "bg-gray-50" : "bg-transparent"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0`}
                  style={{ backgroundColor: seg.strokeColor }}
                />
                <span className="text-xs text-gray-600 font-medium truncate">
                  {seg.label}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-gray-800">
                  {formatMontant(seg.value)}
                </span>
                <span className="text-[9px] text-gray-400 block">
                  {seg.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
