"use client";

import { useState } from "react";
import { formatMontant } from "@/lib/kpi";

interface SVGLineChartProps {
  data: {
    date: string;
    value: number;
    amount?: number;
  }[];
  yLabel?: string;
}

export function SVGLineChart({ data, yLabel = "kg" }: SVGLineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
        <p className="text-xs text-gray-400 font-medium">Aucune donnée disponible pour le graphique</p>
      </div>
    );
  }

  // Dimension settings
  const width = 500;
  const height = 180;
  const paddingLeft = 40;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Compute boundaries
  const maxVal = Math.max(...data.map((d) => d.value), 10);
  const minVal = 0;

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return height - paddingBottom - ((val - minVal) / (maxVal - minVal)) * chartHeight;
  };

  // Generate SVG Path for the line
  let linePath = "";
  let areaPath = "";

  if (data.length > 0) {
    const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`);
    linePath = `M ${points.join(" L ")}`;
    
    // For area chart, close the path to the bottom axis
    areaPath = `${linePath} L ${getX(data.length - 1)},${height - paddingBottom} L ${getX(0)},${height - paddingBottom} Z`;
  }

  const yTicks = [0, maxVal / 2, maxVal];

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto select-none"
      >
        <defs>
          <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eab308" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#eab308" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="chart-line-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {yTicks.map((tick, i) => {
          const y = getY(tick);
          return (
            <g key={i} className="opacity-40">
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={y + 3}
                textAnchor="end"
                className="text-[9px] fill-gray-400 font-bold"
              >
                {Math.round(tick)}
              </text>
            </g>
          );
        })}

        {/* Fill Area */}
        {data.length > 1 && (
          <path
            d={areaPath}
            fill="url(#chart-area-grad)"
            className="transition-all duration-300"
          />
        )}

        {/* Path Line */}
        {data.length > 1 && (
          <path
            d={linePath}
            fill="none"
            stroke="url(#chart-line-grad)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        )}

        {/* Interactive Dots / Bars */}
        {data.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.value);
          const isHovered = hoveredPoint === i;

          return (
            <g key={i}>
              {/* Invisible touch target bar for easy hover */}
              <rect
                x={cx - chartWidth / (data.length * 2)}
                y={paddingTop}
                width={chartWidth / data.length || 20}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />

              {/* Bar or Dot representation */}
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 4}
                fill={isHovered ? "#ca8a04" : "#ffffff"}
                stroke="#eab308"
                strokeWidth={2}
                className="transition-all duration-150 cursor-pointer pointer-events-none"
              />

              {/* X axis labels (limited to prevent clutter) */}
              {(i === 0 || i === data.length - 1 || (data.length > 5 && i === Math.floor(data.length / 2))) && (
                <text
                  x={cx}
                  y={height - 8}
                  textAnchor="middle"
                  className="text-[8px] fill-gray-400 font-semibold"
                >
                  {d.date.substring(5)} {/* Show MM-DD only */}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Dynamic Floating Tooltip */}
      {hoveredPoint !== null && data[hoveredPoint] && (
        <div className="absolute top-0 right-0 bg-white/95 backdrop-blur border border-gray-150 rounded-xl p-2 shadow-lg text-[10px] flex flex-col gap-0.5 animate-fadeIn z-10 min-w-[100px]">
          <p className="text-gray-400 font-bold uppercase tracking-wider">
            {data[hoveredPoint].date}
          </p>
          <p className="text-gray-900 font-extrabold flex items-center justify-between gap-2 mt-0.5">
            <span>Quantité :</span>
            <span className="text-brand-600 font-black">{data[hoveredPoint].value.toLocaleString("fr-FR")} {yLabel}</span>
          </p>
          {data[hoveredPoint].amount !== undefined && (
            <p className="text-gray-600 font-semibold flex items-center justify-between gap-2">
              <span>Coût :</span>
              <span className="text-gray-800">{formatMontant(data[hoveredPoint].amount!)}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
