"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { isInvestment } from "@/lib/storage";
import type { Investment } from "@/lib/types";
import { useFormErrors } from "./form-errors";

export default function OfferDialog({
  investment,
  isNew,
  onSave,
  onClose,
}: {
  investment: Investment;
  isNew: boolean;
  onSave: (investment: Investment) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");
  const { errors, update, submit } = useFormErrors();
  const accessibility = (name: string) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `offer-${name}-error` : undefined,
  });
  const fieldError = (name: string) =>
    errors[name] ? (
      <span
        className="field-error"
        id={`offer-${name}-error`}
        aria-live="polite"
      >
        {errors[name]}
      </span>
    ) : null;
  const [isCdi, setIsCdi] = useState(investment.isPercentOfCDI);
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    element?.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      className="offer-dialog"
      aria-labelledby="dialog-title"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const targets = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "button, input, select, summary, [tabindex]",
          ),
        ).filter(
          (element) =>
            element.tabIndex >= 0 &&
            !element.hasAttribute("disabled") &&
            element.checkVisibility(),
        );
        const first = targets[0],
          last = targets[targets.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <div className="dialog-heading">
        <div>
          <h2 id="dialog-title">
            {isNew ? "Adicionar opção" : "Editar opção"}
          </h2>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Fechar"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <form
        noValidate
        onBlur={(event) => {
          if (event.target instanceof HTMLInputElement)
            update(event.currentTarget, event.target.name);
        }}
        onInput={(event) => {
          setError("");
          update(event.currentTarget);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          if (!submit(event.currentTarget)) return;
          const data = new FormData(event.currentTarget);
          const result: Investment = {
            id: investment.id,
            name: String(data.get("name")).trim(),
            type: data.get("type") as Investment["type"],
            rate: Number(data.get("rate")),
            isPercentOfCDI: isCdi,
            amount: Number(data.get("amount")),
            purchaseDate: String(data.get("purchaseDate")),
            endDate: String(data.get("endDate")),
          };
          if (!isInvestment(result)) {
            setError(
              "Confira os valores. O vencimento deve ser posterior à aplicação, com prazo de até 100 anos.",
            );
            return;
          }
          onSave(result);
        }}
      >
        <label className="field">
          Nome da opção
          <input
            {...accessibility("name")}
            name="name"
            autoFocus
            defaultValue={investment.name}
            required
            maxLength={80}
            placeholder="Ex.: CDB do meu banco"
          />
          {fieldError("name")}
        </label>
        <div className="form-grid">
          <label className="field">
            Tipo
            <select name="type" defaultValue={investment.type}>
              <option>CDB</option>
              <option>LCI/LCA</option>
            </select>
          </label>
          <label className="field">
            Rendimento
            <select
              value={isCdi ? "cdi" : "fixed"}
              onChange={(event) => setIsCdi(event.target.value === "cdi")}
            >
              <option value="cdi">Pós-fixado (% do CDI)</option>
              <option value="fixed">Prefixado (% ao ano)</option>
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            {isCdi ? "Taxa (% do CDI)" : "Taxa (% ao ano)"}
            <input
              key={String(isCdi)}
              {...accessibility("rate")}
              name="rate"
              inputMode="decimal"
              type="number"
              min="0"
              max={isCdi ? 300 : 100}
              step="0.01"
              defaultValue={
                isCdi === investment.isPercentOfCDI
                  ? investment.rate
                  : isCdi
                    ? 100
                    : 12
              }
              required
            />
            {fieldError("rate")}
          </label>
        </div>
        <details className="offer-settings">
          <summary>
            Valor e datas
            <ChevronDown size={18} aria-hidden="true" />
          </summary>
          <label className="field">
            Valor aplicado (R$)
            <input
              {...accessibility("amount")}
              name="amount"
              inputMode="decimal"
              type="number"
              min="0.01"
              max="1000000000"
              step="0.01"
              defaultValue={investment.amount}
              required
            />
            {fieldError("amount")}
          </label>
          <div className="form-grid">
            <label className="field">
              Data da aplicação
              <input
                {...accessibility("purchaseDate")}
                name="purchaseDate"
                type="date"
                defaultValue={investment.purchaseDate}
                required
              />
              {fieldError("purchaseDate")}
            </label>
            <label className="field">
              Vencimento
              <input
                {...accessibility("endDate")}
                name="endDate"
                type="date"
                defaultValue={investment.endDate}
                required
              />
              {fieldError("endDate")}
            </label>
          </div>
        </details>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="button primary" type="submit">
            {isNew ? "Adicionar à comparação" : "Salvar alterações"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
