import { calculateInvestmentReturns, money } from "@/lib/calculations";
import type { Investment } from "@/lib/types";

export const COLORS = [
  "#2459d3",
  "#168477",
  "#bb6b2d",
  "#8c55b5",
  "#b84d6c",
  "#65778e",
];
export default function GrowthChart({
  investments,
  cdiRate,
}: {
  investments: Investment[];
  cdiRate: number;
}) {
  const longest = Math.max(
    ...investments.map((i) => calculateInvestmentReturns(i, cdiRate).days),
    1,
  );
  const series = investments.map((investment) => {
    const duration = calculateInvestmentReturns(investment, cdiRate).days;
    return Array.from({ length: 49 }, (_, step) => {
      const day = Math.round((duration * step) / 48);
      return {
        x: 62 + (day / longest) * 658,
        value: calculateInvestmentReturns(investment, cdiRate, day)
          .liquidReturn,
      };
    });
  });
  const max = Math.max(...series.flat().map((point) => point.value), 1) * 1.12;
  const y = (value: number) => 190 - (value / max) * 162;
  return (
    <div className="chart-wrap">
      <svg
        viewBox="0 0 750 228"
        role="img"
        aria-labelledby="growth-title growth-description"
      >
        <title id="growth-title">Evolução do ganho líquido estimado</title>
        <desc id="growth-description">
          {investments
            .map(
              (i) =>
                `${i.name}: ${money(calculateInvestmentReturns(i, cdiRate).liquidReturn)} em ${calculateInvestmentReturns(i, cdiRate).days} dias.`,
            )
            .join(" ")}
        </desc>
        {[0, 1, 2, 3].map((tick) => (
          <g key={tick}>
            <line
              x1="62"
              x2="720"
              y1={y((max * tick) / 3)}
              y2={y((max * tick) / 3)}
              className="chart-grid"
            />
            <text
              x="50"
              y={y((max * tick) / 3) + 4}
              textAnchor="end"
              className="chart-label"
            >
              {new Intl.NumberFormat("pt-BR", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format((max * tick) / 3)}
            </text>
          </g>
        ))}
        {[0, 1, 2, 3, 4].map((tick) => (
          <text
            key={tick}
            x={62 + (tick / 4) * 658}
            y="218"
            textAnchor="middle"
            className="chart-label"
          >
            {Math.round((longest * tick) / 4)} d
          </text>
        ))}
        {series.map((points, index) => (
          <path
            key={investments[index].id}
            d={points
              .map(
                (point, step) =>
                  `${step ? "L" : "M"}${point.x.toFixed(2)},${y(point.value).toFixed(2)}`,
              )
              .join(" ")}
            fill="none"
            stroke={COLORS[index % COLORS.length]}
            strokeWidth="2.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="chart-legend">
        {investments.map((i, index) => (
          <span key={i.id}>
            <i style={{ background: COLORS[index % COLORS.length] }} />
            {i.name}
          </span>
        ))}
      </div>
    </div>
  );
}
