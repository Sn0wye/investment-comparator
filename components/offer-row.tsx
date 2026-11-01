"use client";
import { Pencil } from "lucide-react";
import { calculateIRRate, money, percent } from "@/lib/calculations";
import type { Investment } from "@/lib/types";
import { useAnimatedNumber } from "./use-animated-number";

export interface Result extends ReturnType<
  typeof import("@/lib/calculations").calculateInvestmentReturns
> {
  investment: Investment;
}

const fmtRate = (v: number) =>
  v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

export default function OfferRow({
  result,
  rank,
  share,
  netShare,
  leader,
  ready,
  onRate,
  onEdit,
}: {
  result: Result;
  rank: number;
  share: number;
  netShare: number;
  leader: boolean;
  ready: boolean;
  onRate: (rate: number, isPercentOfCDI: boolean) => void;
  onEdit: (trigger: HTMLElement) => void;
}) {
  const { investment: i } = result;
  const liquidValue = useAnimatedNumber(result.liquidValue);
  const liquidReturn = useAnimatedNumber(result.liquidReturn);
  const exempt = i.type !== "CDB";
  const equivalent = exempt
    ? i.rate / (1 - calculateIRRate(result.days) / 100)
    : 0;
  const unit = i.isPercentOfCDI ? "do CDI" : "ao ano";

  return (
    <li
      className="offer"
      data-id={i.id}
      data-leader={leader || undefined}
      style={{ "--i": rank } as React.CSSProperties}
      aria-labelledby={`offer-${i.id}`}
    >
      <span className="offer-rank" aria-hidden="true">
        {rank}
      </span>
      <div className="offer-head">
        <h3 id={`offer-${i.id}`}>
          <button
            type="button"
            className="offer-name"
            onClick={(e) => onEdit(e.currentTarget)}
            disabled={!ready}
          >
            {i.name}
            <Pencil size={14} aria-hidden="true" />
            <span className="sr-only">, editar</span>
          </button>
        </h3>
        <span className="offer-type">{i.type}</span>
      </div>
      <div className="offer-rate">
        <label>
          <span className="sr-only">Taxa de {i.name}</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            max={i.isPercentOfCDI ? 300 : 100}
            step="0.01"
            value={i.rate}
            disabled={!ready}
            onChange={(e) => {
              const v = e.target.valueAsNumber;
              if (
                Number.isFinite(v) &&
                v >= 0 &&
                v <= (i.isPercentOfCDI ? 300 : 100)
              )
                onRate(v, i.isPercentOfCDI);
            }}
          />
        </label>
        <label>
          <span className="sr-only">Modalidade de {i.name}</span>
          <select
            value={i.isPercentOfCDI ? "cdi" : "fixed"}
            disabled={!ready}
            onChange={(e) => {
              const cdi = e.target.value === "cdi";
              onRate(cdi ? Math.min(i.rate, 300) : Math.min(i.rate, 100), cdi);
            }}
          >
            <option value="cdi">% do CDI</option>
            <option value="fixed">% ao ano</option>
          </select>
        </label>
      </div>
      <div className="offer-value">
        <strong>
          <span className="sr-only">Valor líquido no vencimento: </span>
          {money(liquidValue)}
        </strong>
        <span>
          {liquidReturn >= 0 ? "+" : ""}
          {money(liquidReturn)} líquidos
        </span>
      </div>
      <div className="offer-bar" aria-hidden="true">
        <i
          className="bar-gross"
          style={{ transform: `scaleX(${Math.max(0.01, share)})` }}
        />
        <i
          className="bar-net"
          style={{ transform: `scaleX(${Math.max(0.01, netShare)})` }}
        />
      </div>
      <p className="offer-tax">
        {exempt ? (
          <>
            Isento de IR. Vale o mesmo que um CDB a{" "}
            <b>
              {fmtRate(equivalent)}% {unit}
            </b>
            .
          </>
        ) : (
          <>
            IR de {percent(result.irRate)} leva <b>{money(result.taxAmount)}</b>
            {result.iofAmount > 0 && (
              <>
                {" "}
                e IOF leva <b>{money(result.iofAmount)}</b>
              </>
            )}
            .
          </>
        )}
      </p>
    </li>
  );
}
