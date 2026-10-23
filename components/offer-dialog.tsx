"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { isInvestment } from "@/lib/storage";
import type { Investment } from "@/lib/types";

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
  const [isCdi, setIsCdi] = useState(investment.isPercentOfCDI);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    element?.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      className="offer-dialog"
      aria-labelledby="dialog-title"
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
          <p className="section-kicker">Sua próxima comparação</p>
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
          <X size={20} />
        </button>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
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
            name="name"
            autoFocus
            defaultValue={investment.name}
            required
            maxLength={80}
            placeholder="Ex.: CDB do meu banco"
          />
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
              name="rate"
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
          </label>
          <label className="field">
            Valor aplicado (R$)
            <input
              name="amount"
              type="number"
              min="0.01"
              max="1000000000"
              step="0.01"
              defaultValue={investment.amount}
              required
            />
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            Data da aplicação
            <input
              name="purchaseDate"
              type="date"
              defaultValue={investment.purchaseDate}
              required
            />
          </label>
          <label className="field">
            Vencimento
            <input
              name="endDate"
              type="date"
              defaultValue={investment.endDate}
              required
            />
          </label>
        </div>
        <p className="field-help">
          O imposto é calculado automaticamente pelo tipo e prazo.
        </p>
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
