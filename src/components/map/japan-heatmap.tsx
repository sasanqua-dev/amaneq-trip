"use client";

import { useState } from "react";
import { PREFECTURES } from "@/lib/constants/prefectures";

interface JapanHeatmapProps {
  visitCounts: Record<number, number>;
  onPrefectureClick?: (code: number) => void;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  code: number;
}

// Grid positions for each prefecture (col, row) on an approximate geographic grid.
// The grid uses columns 0-9 and rows 0-14 to lay out Japan from north (top) to south (bottom).
const PREFECTURE_GRID: Record<number, { col: number; row: number }> = {
  // Hokkaido
  1:  { col: 8, row: 0 },

  // Tohoku (northeast Honshu)
  2:  { col: 7, row: 2 },  // Aomori
  3:  { col: 8, row: 3 },  // Iwate
  4:  { col: 7, row: 4 },  // Miyagi
  5:  { col: 7, row: 3 },  // Akita
  6:  { col: 6, row: 4 },  // Yamagata
  7:  { col: 7, row: 5 },  // Fukushima

  // Kanto
  8:  { col: 7, row: 6 },  // Ibaraki
  9:  { col: 7, row: 7 },  // Tochigi — shifted below Ibaraki visually
  10: { col: 6, row: 6 },  // Gunma
  11: { col: 6, row: 7 },  // Saitama
  12: { col: 7, row: 8 },  // Chiba
  13: { col: 6, row: 8 },  // Tokyo
  14: { col: 6, row: 9 },  // Kanagawa

  // Chubu
  15: { col: 6, row: 5 },  // Niigata
  16: { col: 5, row: 6 },  // Toyama
  17: { col: 4, row: 6 },  // Ishikawa
  18: { col: 4, row: 7 },  // Fukui
  19: { col: 5, row: 8 },  // Yamanashi
  20: { col: 5, row: 7 },  // Nagano
  21: { col: 4, row: 8 },  // Gifu
  22: { col: 5, row: 9 },  // Shizuoka
  23: { col: 4, row: 9 },  // Aichi

  // Kinki
  24: { col: 3, row: 9 },  // Mie
  25: { col: 3, row: 7 },  // Shiga
  26: { col: 3, row: 8 },  // Kyoto
  27: { col: 3, row: 10 }, // Osaka — moved down to avoid overlap
  28: { col: 2, row: 8 },  // Hyogo
  29: { col: 4, row: 10 }, // Nara
  30: { col: 3, row: 11 }, // Wakayama

  // Chugoku
  31: { col: 2, row: 7 },  // Tottori
  32: { col: 1, row: 7 },  // Shimane
  33: { col: 2, row: 9 },  // Okayama
  34: { col: 1, row: 9 },  // Hiroshima
  35: { col: 0, row: 9 },  // Yamaguchi

  // Shikoku
  36: { col: 2, row: 10 }, // Tokushima
  37: { col: 2, row: 11 }, // Kagawa — placed below Tokushima
  38: { col: 1, row: 10 }, // Ehime
  39: { col: 1, row: 11 }, // Kochi

  // Kyushu
  40: { col: 0, row: 10 }, // Fukuoka
  41: { col: 0, row: 11 }, // Saga — shifted left
  42: { col: -1, row: 11 },// Nagasaki
  43: { col: 0, row: 12 }, // Kumamoto
  44: { col: 1, row: 12 }, // Oita — shifted right of Kumamoto
  45: { col: 1, row: 13 }, // Miyazaki
  46: { col: 0, row: 13 }, // Kagoshima

  // Okinawa
  47: { col: -1, row: 14 }, // Okinawa
};

function getColor(count: number): string {
  if (count === 0) return "#e5e7eb";
  // Gradient from light blue (#dbeafe) to dark blue (#1e40af)
  // Clamp at 10 visits for the darkest shade
  const t = Math.min(count, 10) / 10;

  const r1 = 0xdb, g1 = 0xea, b1 = 0xfe;
  const r2 = 0x1e, g2 = 0x40, b2 = 0xaf;

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

const CELL_SIZE = 44;
const CELL_GAP = 4;
const PADDING = 24;

// Offset so that the minimum column (-1 for Nagasaki/Okinawa) maps to x = PADDING
const COL_OFFSET = 1;

export function JapanHeatmap({ visitCounts, onPrefectureClick }: JapanHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    code: 1,
  });

  const svgWidth = (10 + COL_OFFSET) * (CELL_SIZE + CELL_GAP) + PADDING * 2;
  const svgHeight = 15 * (CELL_SIZE + CELL_GAP) + PADDING * 2;

  function handleMouseEnter(code: number, e: React.MouseEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top,
      code,
    });
  }

  function handleMouseLeave() {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }

  function handleClick(code: number) {
    onPrefectureClick?.(code);
  }

  const tooltipPrefecture = PREFECTURES.find((p) => p.code === tooltip.code);
  const tooltipCount = visitCounts[tooltip.code] ?? 0;

  return (
    <div className="relative inline-block">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width="100%"
        height="100%"
        className="max-w-full"
        role="img"
        aria-label="Japan prefecture heatmap"
      >
        {PREFECTURES.map((pref) => {
          const pos = PREFECTURE_GRID[pref.code];
          if (!pos) return null;

          const count = visitCounts[pref.code] ?? 0;
          const x = PADDING + (pos.col + COL_OFFSET) * (CELL_SIZE + CELL_GAP);
          const y = PADDING + pos.row * (CELL_SIZE + CELL_GAP);

          return (
            <g key={pref.code}>
              <rect
                x={x}
                y={y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={6}
                ry={6}
                fill={getColor(count)}
                stroke="#94a3b8"
                strokeWidth={1}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onMouseEnter={(e) => handleMouseEnter(pref.code, e)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(pref.code)}
                role="button"
                aria-label={`${pref.name} (${pref.nameEn}): ${count}回`}
              />
              <text
                x={x + CELL_SIZE / 2}
                y={y + CELL_SIZE / 2 + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11}
                fontWeight={500}
                fill={count >= 5 ? "#ffffff" : "#374151"}
                pointerEvents="none"
                className="select-none"
              >
                {pref.name.replace(/[県府都道]$/, "").slice(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>

      {tooltip.visible && tooltipPrefecture && (
        <div
          className="pointer-events-none fixed z-50 rounded-md bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md border"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="font-medium">
            {tooltipPrefecture.name} ({tooltipPrefecture.nameEn})
          </p>
          <p className="text-muted-foreground">
            {tooltipCount > 0 ? `${tooltipCount}回訪問` : "未訪問"}
          </p>
        </div>
      )}
    </div>
  );
}
