"use client";
import { useRef, useState } from "react";
import { calculateInvestmentReturns, money } from "@/lib/calculations";
import type { Investment } from "@/lib/types";

export const COLORS = [
  "#0f8a52",
  "#2d5fa8",
  "#b8651f",
  "#7a4fb0",
  "#b2436b",
  "#5f6f7a",
];

const W = 760;
const H = 240;
const L = 56;
const R = 744;
const T = 16;
const B = 204;

export default function GrowthChart({
  investments,
  cdiRate,
}: {
  investments: Investment[];
  cdiRate: number;
}) {
  const finals = investments.map((i) => calculateInvestmentReturns(i, cdiRate));
  const longest = Math.max(...finals.map((f) => f.days), 1);
  const series = investments.map((investment, index) => {
    const duration = finals[index].days;
    return Array.from({ length: 49 }, (_, step) => {
      const day = Math.round((duration * step) / 48);
      return {
        x: L + (day / longest) * (R - L),
        value: calculateInvestmentReturns(investment, cdiRate, day)
          .liquidReturn,
      };
    });
  });
  const max = Math.max(...series.flat().map((p) => p.value), 1) * 1.08;
  const y = (value: number) => B - (value / max) * (B - T);
  const path = (points: { x: number; value: number }[]) =>
    points
      .map(
        (p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${y(p.value).toFixed(1)}`,
      )
      .join(" ");
  const compact = new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const svgRef = useRef<SVGSVGElement>(null);
  const [day, setDay] = useState<number | null>(null);
  const xOf = (d: number) => L + (d / longest) * (R - L);
  const pointAt = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((clientX - rect.left) / rect.width) * W;
    const d = Math.round(((x - L) / (R - L)) * longest);
    setDay(Math.min(longest, Math.max(0, d)));
  };
  const hover =
    day === null
      ? null
      : investments.map((investment, index) => {
          const ended = day > finals[index].days;
          return {
            investment,
            ended,
            value: calculateInvestmentReturns(
              investment,
              cdiRate,
              Math.min(day, finals[index].days),
            ).liquidReturn,
            color: COLORS[index % COLORS.length],
          };
        });

  return (
    <section className="growth" aria-labelledby="growth-title">
      <div className="growth-head">
        <h2 id="growth-title">Evolução do ganho líquido</h2>
        <ul className="legend">
          {investments.map((i, index) => (
            <li key={i.id}>
              <i style={{ background: COLORS[index % COLORS.length] }} />
              {i.name}
            </li>
          ))}
        </ul>
      </div>
      <div
        className="chart-scroll"
        tabIndex={0}
        role="region"
        aria-label="Gráfico de ganho líquido ao longo do prazo. Use as setas para percorrer os dias."
        onKeyDown={(e) => {
          const step = e.shiftKey ? 30 : 7;
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            setDay((d) =>
              Math.min(
                longest,
                Math.max(0, (d ?? 0) + (e.key === "ArrowRight" ? step : -step)),
              ),
            );
          } else if (e.key === "Home") setDay(0);
          else if (e.key === "End") setDay(longest);
          else if (e.key === "Escape") setDay(null);
        }}
        onBlur={() => setDay(null)}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          onPointerMove={(e) => pointAt(e.clientX)}
          onPointerDown={(e) => pointAt(e.clientX)}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") setDay(null);
          }}
          role="img"
          aria-labelledby="growth-title"
          aria-describedby="growth-description"
        >
          <desc id="growth-description">
            {investments
              .map(
                (i, index) =>
                  `${i.name}: ${money(finals[index].liquidReturn)} em ${finals[index].days} dias.`,
              )
              .join(" ")}
          </desc>
          {[0, 1, 2, 3].map((tick) => (
            <g key={tick}>
              <line
                x1={L}
                x2={R}
                y1={y((max * tick) / 3)}
                y2={y((max * tick) / 3)}
                className="chart-grid"
              />
              <text
                x={L - 8}
                y={y((max * tick) / 3) + 4}
                textAnchor="end"
                className="chart-label"
              >
                {compact.format((max * tick) / 3)}
              </text>
            </g>
          ))}
          {[0, 1, 2, 3, 4].map((tick) => (
            <text
              key={tick}
              x={L + (tick / 4) * (R - L)}
              y={H - 8}
              textAnchor={tick === 0 ? "start" : tick === 4 ? "end" : "middle"}
              className="chart-label"
            >
              {Math.round((longest * tick) / 4)} dias
            </text>
          ))}
          {series[0] && (
            <path
              d={`${path(series[0])} L${series[0][48].x.toFixed(1)},${B} L${L},${B} Z`}
              fill={COLORS[0]}
              opacity="0.08"
            />
          )}
          {series.map((points, index) => (
            <path
              key={investments[index].id}
              d={path(points)}
              fill="none"
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={index === 0 ? 3 : 2}
              strokeDasharray={index === 0 ? undefined : `${4 + index * 2} 5`}
              strokeLinejoin="round"
              strokeLinecap="round"
              className="chart-line"
            />
          ))}
          {hover && day !== null && (
            <g className="chart-hover">
              <line
                x1={xOf(day)}
                x2={xOf(day)}
                y1={T}
                y2={B}
                className="chart-cursor"
              />
              {hover.map((h) =>
                h.ended ? null : (
                  <circle
                    key={h.investment.id}
                    cx={xOf(day)}
                    cy={y(h.value)}
                    r="5"
                    fill={h.color}
                    className="chart-dot"
                  />
                ),
              )}
            </g>
          )}
        </svg>
        {hover && day !== null && (
          <div
            className="chart-tip"
            role="status"
            aria-live="polite"
            style={{
              left: `${(xOf(day) / W) * 100}%`,
              translate: xOf(day) > W / 2 ? "calc(-100% - 14px) 0" : "14px 0",
            }}
          >
            <strong>{day} dias</strong>
            <ul>
              {hover.map((h) => (
                <li key={h.investment.id} data-ended={h.ended || undefined}>
                  <i style={{ background: h.color }} />
                  <span>{h.investment.name}</span>
                  <b>{money(h.value)}</b>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <details className="chart-data">
        <summary>Ver valores em tabela</summary>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Tabela de ganho líquido"
        >
          <table>
            <caption>Ganho líquido estimado por prazo</caption>
            <thead>
              <tr>
                <th scope="col">Opção</th>
                <th scope="col">Dias</th>
                <th scope="col">Ganho líquido</th>
              </tr>
            </thead>
            {investments.map((investment, index) => (
              <tbody key={investment.id}>
                {[0, 1, 2, 3, 4].map((step) => {
                  const days = Math.round((finals[index].days * step) / 4);
                  return (
                    <tr key={step}>
                      {step === 0 && (
                        <th scope="rowgroup" rowSpan={5}>
                          {investment.name}
                        </th>
                      )}
                      <th scope="row">{days}</th>
                      <td>
                        {money(
                          calculateInvestmentReturns(investment, cdiRate, days)
                            .liquidReturn,
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </div>
      </details>
      <p className="chart-note">
        Resgate estimado a cada dia do prazo. Não garante liquidez antes do
        vencimento.
      </p>
    </section>
  );
}
