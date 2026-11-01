"use client";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { Scenario } from "@/lib/types";

const TERMS = [6, 12, 24, 36, 60];
const termLabel = (m: number) =>
  m % 12 === 0 ? `${m / 12} ano${m > 12 ? "s" : ""}` : `${m} meses`;

type Patch = Partial<
  Pick<Scenario, "amount" | "months" | "startDate" | "cdiRate">
>;

export default function ScenarioControls({
  scenario,
  ready,
  onChange,
}: {
  scenario: Scenario;
  ready: boolean;
  onChange: (patch: Patch) => void;
}) {
  const [customTerm, setCustomTerm] = useState(
    !TERMS.includes(scenario.months),
  );
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const mark = (name: string, ok: boolean) =>
    setInvalid((v) => (v[name] === !ok ? v : { ...v, [name]: !ok }));
  const number =
    (name: keyof Patch, min: number, max: number, integer = false) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.valueAsNumber;
      const ok =
        Number.isFinite(value) &&
        value >= min &&
        value <= max &&
        (!integer || Number.isInteger(value));
      mark(name, ok);
      if (ok) onChange({ [name]: value });
    };

  return (
    <div className="controls" aria-label="Cenário da comparação" role="group">
      <label className="amount">
        <span>Investindo</span>
        <span
          className="amount-input"
          data-invalid={invalid.amount || undefined}
        >
          <span aria-hidden="true">R$</span>
          <input
            name="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            max="1000000000"
            step="100"
            defaultValue={scenario.amount}
            onChange={number("amount", 0.01, 1e9)}
            aria-invalid={invalid.amount || undefined}
            aria-describedby="amount-error"
            disabled={!ready}
          />
        </span>
        <span id="amount-error" className="field-error" aria-live="polite">
          {invalid.amount ? "Use um valor entre R$ 0,01 e R$ 1 bilhão." : ""}
        </span>
      </label>

      <fieldset className="terms">
        <legend>por</legend>
        <div className="chips" role="radiogroup" aria-label="Prazo">
          {TERMS.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              className="chip"
              aria-checked={!customTerm && scenario.months === m}
              disabled={!ready}
              onClick={() => {
                setCustomTerm(false);
                mark("months", true);
                onChange({ months: m });
              }}
            >
              {termLabel(m)}
            </button>
          ))}
          <button
            type="button"
            role="radio"
            className="chip"
            aria-checked={customTerm}
            disabled={!ready}
            onClick={() => setCustomTerm(true)}
          >
            outro
          </button>
        </div>
        {customTerm && (
          <label className="custom-term">
            <input
              name="months"
              type="number"
              inputMode="numeric"
              min="1"
              max="360"
              step="1"
              defaultValue={scenario.months}
              onChange={number("months", 1, 360, true)}
              aria-invalid={invalid.months || undefined}
              autoFocus
            />
            <span>meses</span>
            {invalid.months && (
              <span className="field-error">Entre 1 e 360 meses inteiros.</span>
            )}
          </label>
        )}
      </fieldset>

      <details className="assumptions">
        <summary>
          <SlidersHorizontal size={16} aria-hidden="true" />
          CDI {scenario.cdiRate.toLocaleString("pt-BR")}% a.a.
        </summary>
        <div className="assumptions-body">
          <label className="field">
            CDI (% ao ano)
            <input
              name="cdi"
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              step="0.01"
              defaultValue={scenario.cdiRate}
              onChange={number("cdiRate", 0, 100)}
              aria-invalid={invalid.cdiRate || undefined}
            />
            <span className="field-help">
              Taxa hipotética. Ajuste para o CDI do dia.
            </span>
          </label>
          <label className="field">
            Data da aplicação
            <input
              name="startDate"
              type="date"
              defaultValue={scenario.startDate}
              max="9900-12-31"
              onChange={(e) => {
                const v = e.target.value;
                const ok = /^\d{4}-\d{2}-\d{2}$/.test(v) && v <= "9900-12-31";
                mark("startDate", ok);
                if (ok) onChange({ startDate: v });
              }}
              aria-invalid={invalid.startDate || undefined}
            />
            <span className="field-help">
              Define a faixa de IR e o vencimento de cada opção.
            </span>
          </label>
        </div>
      </details>
    </div>
  );
}
