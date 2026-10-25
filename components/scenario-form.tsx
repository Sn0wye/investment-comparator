"use client";
import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { addMonths } from "@/lib/calculations";
import type { Scenario } from "@/lib/types";
import { useFormErrors } from "./form-errors";

export default function ScenarioForm({
  scenario,
  ready,
  onApply,
}: {
  scenario: Scenario;
  ready: boolean;
  onApply: (scenario: Scenario) => void;
}) {
  const form = useRef<HTMLFormElement>(null);
  const { errors, update, submit } = useFormErrors();
  useEffect(() => {
    form.current?.reset();
  }, [scenario.amount, scenario.months, scenario.startDate, scenario.cdiRate]);
  const error = (name: string) =>
    errors[name] ? (
      <span
        className="field-error"
        id={`scenario-${name}-error`}
        aria-live="polite"
      >
        {errors[name]}
      </span>
    ) : null;
  const accessibility = (name: string) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `scenario-${name}-error` : undefined,
  });
  return (
    <form
      ref={form}
      noValidate
      aria-labelledby="scenario-title"
      onBlur={(event) => {
        if (event.target instanceof HTMLInputElement)
          update(event.currentTarget, event.target.name);
      }}
      onInput={(event) => update(event.currentTarget)}
      onSubmit={(event) => {
        event.preventDefault();
        if (!submit(event.currentTarget)) return;
        const data = new FormData(event.currentTarget);
        const amount = Number(data.get("amount")),
          months = Number(data.get("months")),
          cdiRate = Number(data.get("cdi")),
          startDate = String(data.get("startDate"));
        const endDate = addMonths(startDate, months);
        onApply({
          ...scenario,
          amount,
          months,
          cdiRate,
          startDate,
          investments: scenario.investments.map((i) => ({
            ...i,
            amount,
            purchaseDate: startDate,
            endDate,
          })),
        });
      }}
    >
      <div className="scenario-basics">
        <label className="field">
          Valor (R$)
          <input
            name="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            max="1000000000"
            step="0.01"
            defaultValue={scenario.amount}
            required
            {...accessibility("amount")}
          />
          {error("amount")}
        </label>
        <label className="field">
          Prazo (meses)
          <input
            name="months"
            type="number"
            inputMode="numeric"
            min="1"
            max="360"
            step="1"
            defaultValue={scenario.months}
            required
            {...accessibility("months")}
          />
          {error("months")}
        </label>
      </div>
      <details className="scenario-settings">
        <summary>
          CDI e data de aplicação
          <ChevronDown size={18} aria-hidden="true" />
        </summary>
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
            required
            {...accessibility("cdi")}
            aria-describedby={`cdi-help${errors.cdi ? " scenario-cdi-error" : ""}`}
          />
          <span id="cdi-help" className="field-help">
            Taxa hipotética, não uma cotação atual.
          </span>
          {error("cdi")}
        </label>
        <label className="field">
          Data da aplicação
          <input
            name="startDate"
            type="date"
            defaultValue={scenario.startDate}
            max="9900-12-31"
            required
            {...accessibility("startDate")}
          />
          {error("startDate")}
        </label>
      </details>
      <button
        className="button primary apply-button"
        type="submit"
        disabled={!ready}
      >
        Aplicar a todas
      </button>
    </form>
  );
}
