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
      <div
        className="chart-scroll"
        tabIndex={0}
        role="region"
        aria-label="Gráfico de ganho líquido; role horizontalmente para ver todo o período"
      >
        <svg
          viewBox="0 0 750 228"
          role="img"
          aria-labelledby="growth-title"
          aria-describedby="growth-description"
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
              strokeDasharray={index === 0 ? undefined : `${3 + index * 2} 4`}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        </svg>
      </div>
      <div className="chart-legend">
        {investments.map((i, index) => (
          <span key={i.id}>
            <svg
              aria-hidden="true"
              viewBox="0 0 30 8"
              style={{ width: "1.875rem", minWidth: 0, height: ".5rem" }}
            >
              <path
                d="M0 4H30"
                stroke={COLORS[index % COLORS.length]}
                strokeWidth="3"
                strokeDasharray={index === 0 ? undefined : `${3 + index * 2} 4`}
              />
            </svg>
            {i.name}
          </span>
        ))}
      </div>
      <p className="chart-note">
        Estimativa de resgate ao longo do prazo, sem garantia de liquidez antes
        do vencimento.
      </p>
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
                <th scope="col">Investimento</th>
                <th scope="col">Dias</th>
                <th scope="col">Ganho líquido</th>
              </tr>
            </thead>
            {investments.map((investment) => (
              <tbody key={investment.id}>
                {[0, 1, 2, 3, 4].map((step) => {
                  const days = Math.round(
                    (calculateInvestmentReturns(investment, cdiRate).days *
                      step) /
                      4,
                  );
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
    </div>
  );
}
