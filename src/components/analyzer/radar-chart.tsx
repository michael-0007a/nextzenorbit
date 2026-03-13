/**
 * Radar Chart — Client Component
 *
 * SVG-based radar chart for visualizing skill breakdown.
 */

"use client";

import { cn } from "@/lib/utils";

interface RadarChartProps {
  data: {
    label: string;
    value: number; // 0-100
    color?: string;
  }[];
  size?: number;
  className?: string;
}

export function RadarChart({ data, size = 200, className }: RadarChartProps) {
  const center = size / 2;
  const radius = (size / 2) * 0.8;
  const angleStep = (2 * Math.PI) / data.length;

  // Generate points for the background grid
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];

  // Calculate point position
  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Generate data polygon points
  const dataPoints = data.map((d, i) => getPoint(i, d.value));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  // Generate label positions
  const labelPoints = data.map((_, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const r = radius + 25;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  });

  return (
    <div className={cn("relative", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid circles */}
        {gridLevels.map((level, i) => (
          <polygon
            key={i}
            points={data
              .map((_, idx) => {
                const p = getPoint(idx, level * 100);
                return `${p.x},${p.y}`;
              })
              .join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-border"
            opacity={0.3}
          />
        ))}

        {/* Axis lines */}
        {data.map((_, i) => {
          const end = getPoint(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-border"
              opacity={0.3}
            />
          );
        })}

        {/* Data polygon */}
        <path
          d={dataPath}
          fill="url(#radarGradient)"
          fillOpacity={0.3}
          stroke="url(#radarStroke)"
          strokeWidth="2"
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="hsl(var(--primary))"
            stroke="hsl(var(--background))"
            strokeWidth="2"
          />
        ))}

        {/* Gradients */}
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary-light))" />
          </linearGradient>
        </defs>
      </svg>

      {/* Labels */}
      {data.map((d, i) => (
        <div
          key={i}
          className="absolute text-xs font-medium text-center whitespace-nowrap"
          style={{
            left: labelPoints[i].x,
            top: labelPoints[i].y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="text-foreground">{d.label}</div>
          <div className="text-primary font-bold">{d.value}%</div>
        </div>
      ))}
    </div>
  );
}

