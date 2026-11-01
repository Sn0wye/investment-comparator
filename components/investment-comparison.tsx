"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDownToLine, Moon, Plus, RotateCcw, Sun } from "lucide-react";
import {
  addMonths,
  calculateInvestmentReturns,
  money,
} from "@/lib/calculations";
import {
  MAX_OFFERS,
  STORAGE_KEY,
  createScenario,
  migrateLegacy,
  parseScenario,
} from "@/lib/storage";
import type { Investment, Scenario } from "@/lib/types";
import GrowthChart from "./growth-chart";
import OfferRow from "./offer-row";
import ScenarioControls from "./scenario-controls";

const OfferDialog = dynamic(() => import("./offer-dialog"));

function applyScenario(
  s: Scenario,
  patch: Partial<Pick<Scenario, "amount" | "months" | "startDate" | "cdiRate">>,
): Scenario {
  const next = { ...s, ...patch };
  if (patch.cdiRate !== undefined && Object.keys(patch).length === 1)
    return next;
  const endDate = addMonths(next.startDate, next.months);
  return {
    ...next,
    investments: next.investments.map((i) => ({
      ...i,
      amount: next.amount,
      purchaseDate: next.startDate,
      endDate,
    })),
  };
}

export default function InvestmentComparison({
  initialScenario,
}: {
  initialScenario: Scenario;
}) {
  const [scenario, setScenario] = useState(initialScenario);
  const [ready, setReady] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [notice, setNotice] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [editing, setEditing] = useState<{
    investment: Investment;
    isNew: boolean;
  } | null>(null);
  const [removed, setRemoved] = useState<Investment | null>(null);
  const [dark, setDark] = useState(false);
  const addButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const list = useRef<HTMLOListElement>(null);
  const positions = useRef(new Map<string, number>());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const legacy = localStorage.getItem("investments");
      if (raw) setScenario(parseScenario(raw));
      else if (legacy) {
        setScenario(
          migrateLegacy(
            legacy,
            localStorage.getItem("cdiRate"),
            initialScenario,
          ),
        );
        setNotice("Sua comparação anterior foi importada.");
      }
      setCanSave(true);
      const theme = localStorage.getItem("rende-theme");
      const isDark = theme
        ? theme === "dark"
        : matchMedia("(prefers-color-scheme: dark)").matches;
      setDark(isDark);
      document.documentElement.dataset.theme = isDark ? "dark" : "light";
    } catch {
      setSaveStatus("Não salvo: armazenamento indisponível.");
    }
    setReady(true);
  }, [initialScenario]);

  useEffect(() => {
    if (!ready || !canSave) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario));
      setSaveStatus("");
    } catch {
      setSaveStatus("Não salvo: armazenamento indisponível.");
    }
  }, [scenario, ready, canSave]);

  // Rows keep their DOM node across re-ranking; slide them from where they were.
  useLayoutEffect(() => {
    const rows = list.current?.querySelectorAll<HTMLElement>("[data-id]");
    if (!rows) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    rows.forEach((row) => {
      const id = row.dataset.id as string;
      const top = row.offsetTop;
      const prev = positions.current.get(id);
      if (prev !== undefined && prev !== top && !reduce)
        row.animate(
          [{ transform: `translateY(${prev - top}px)` }, { transform: "none" }],
          { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" },
        );
      positions.current.set(id, top);
    });
  });

  const results = scenario.investments.map((investment) => ({
    investment,
    ...calculateInvestmentReturns(investment, scenario.cdiRate),
  }));
  const ranked = [...results].sort((a, b) => b.liquidReturn - a.liquidReturn);
  const best = ranked[0];
  const runnerUp = ranked[1];
  const maxGross = Math.max(...ranked.map((r) => r.grossReturn), 0);
  const comparable = results.every(
    (r) =>
      r.investment.amount === results[0].investment.amount &&
      r.investment.purchaseDate === results[0].investment.purchaseDate &&
      r.investment.endDate === results[0].investment.endDate,
  );
  const tied =
    !!runnerUp && Math.abs(best.liquidReturn - runnerUp.liquidReturn) < 0.01;

  const updateInvestment = (id: string, patch: Partial<Investment>) =>
    setScenario((s) => ({
      ...s,
      investments: s.investments.map((i) =>
        i.id === id ? { ...i, ...patch } : i,
      ),
    }));

  function openEditor(investment?: Investment, trigger?: HTMLElement) {
    returnFocus.current = trigger ?? (document.activeElement as HTMLElement);
    setEditing({
      isNew: !investment,
      investment: investment ?? {
        id: crypto.randomUUID(),
        name: "",
        type: "CDB",
        rate: 100,
        isPercentOfCDI: true,
        amount: scenario.amount,
        purchaseDate: scenario.startDate,
        endDate: addMonths(scenario.startDate, scenario.months),
      },
    });
  }
  function closeEditor() {
    setEditing(null);
    requestAnimationFrame(() =>
      (returnFocus.current?.isConnected
        ? returnFocus.current
        : addButton.current
      )?.focus(),
    );
  }
  function remove(investment: Investment) {
    setRemoved(investment);
    setScenario((s) => ({
      ...s,
      investments: s.investments.filter((i) => i.id !== investment.id),
    }));
    setNotice(`${investment.name} removido.`);
  }
  function duplicate(investment: Investment) {
    setScenario((s) => ({
      ...s,
      investments: [
        ...s.investments,
        {
          ...investment,
          id: crypto.randomUUID(),
          name: `${investment.name.slice(0, 72)} (cópia)`,
        },
      ],
    }));
    setNotice("Opção duplicada. Ajuste a taxa para comparar.");
  }
  function exportCsv() {
    const cell = (value: string | number) =>
      `"${String(value)
        .replace(/^[\s]*[=+@\-]/, "'$&")
        .replaceAll('"', '""')}"`;
    const rows = [
      [
        "Opção",
        "Tipo",
        "Valor aplicado",
        "Aplicação",
        "Vencimento",
        "Taxa",
        "Modalidade",
        "CDI anual simulado",
        "Ganho bruto",
        "IR",
        "IOF",
        "Valor líquido",
      ],
      ...ranked.map((r) => [
        r.investment.name,
        r.investment.type,
        r.investment.amount,
        r.investment.purchaseDate,
        r.investment.endDate,
        r.investment.rate,
        r.investment.isPercentOfCDI ? "% CDI" : "% a.a.",
        scenario.cdiRate,
        r.grossReturn.toFixed(2),
        r.taxAmount.toFixed(2),
        r.iofAmount.toFixed(2),
        r.liquidValue.toFixed(2),
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(
        ["﻿" + rows.map((row) => row.map(cell).join(";")).join("\r\n")],
        { type: "text/csv;charset=utf-8;" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "rende-comparacao.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Comparação exportada em CSV.");
  }

  return (
    <section
      id="simulador"
      tabIndex={-1}
      className="simulator"
      aria-label="Comparador de renda fixa"
    >
      <header className="top">
        <a className="wordmark" href="/" aria-label="Rende, início">
          rende
        </a>
        <button
          type="button"
          className="icon-button"
          aria-label={dark ? "Usar tema claro" : "Usar tema escuro"}
          onClick={() => {
            const next = !dark;
            setDark(next);
            document.documentElement.dataset.theme = next ? "dark" : "light";
            try {
              localStorage.setItem("rende-theme", next ? "dark" : "light");
            } catch {
              /* Theme works without storage. */
            }
          }}
        >
          {dark ? (
            <Sun size={20} aria-hidden="true" />
          ) : (
            <Moon size={20} aria-hidden="true" />
          )}
        </button>
      </header>

      <h1>Quanto fica com você?</h1>

      <ScenarioControls
        scenario={scenario}
        ready={ready}
        onChange={(patch) => setScenario((s) => applyScenario(s, patch))}
      />

      <div className="ranking" aria-labelledby="verdict">
        <p
          id="verdict"
          className="verdict"
          aria-live="polite"
          aria-atomic="true"
        >
          {!best ? (
            "Adicione uma opção para comparar."
          ) : !comparable ? (
            <>
              Valores ou datas diferentes entre as opções. A ordem considera o
              ganho em reais.
            </>
          ) : tied ? (
            <>
              <b>{best.investment.name}</b> e <b>{runnerUp.investment.name}</b>{" "}
              empatam em {money(best.liquidValue)} líquidos.
            </>
          ) : runnerUp ? (
            <>
              <b>{best.investment.name}</b> deixa{" "}
              <b>{money(best.liquidReturn - runnerUp.liquidReturn)}</b> a mais
              que {runnerUp.investment.name}.
            </>
          ) : (
            <>
              <b>{best.investment.name}</b> rende {money(best.liquidReturn)}{" "}
              líquidos. Adicione outra opção para comparar.
            </>
          )}
        </p>
        <p className="status" role="status" aria-atomic="true">
          {saveStatus || notice}
          {removed && (
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setScenario((s) => ({
                  ...s,
                  investments: [...s.investments, removed],
                }));
                setRemoved(null);
                setNotice("Opção restaurada.");
              }}
              disabled={results.length >= MAX_OFFERS}
            >
              Desfazer
            </button>
          )}
        </p>

        {ranked.length > 0 ? (
          <ol className="offers" ref={list}>
            {ranked.map((result, index) => (
              <OfferRow
                key={result.investment.id}
                result={result}
                rank={index + 1}
                share={maxGross > 0 ? result.grossReturn / maxGross : 0}
                netShare={maxGross > 0 ? result.liquidReturn / maxGross : 0}
                leader={index === 0 && comparable && !tied && ranked.length > 1}
                ready={ready}
                onRate={(rate, isPercentOfCDI) =>
                  updateInvestment(result.investment.id, {
                    rate,
                    isPercentOfCDI,
                  })
                }
                onEdit={(trigger) => openEditor(result.investment, trigger)}
              />
            ))}
          </ol>
        ) : (
          <div className="empty">
            <p>Nenhuma opção na comparação.</p>
            <button
              type="button"
              className="button"
              onClick={() => {
                setScenario(createScenario(scenario.startDate));
                setNotice("Exemplos restaurados.");
              }}
            >
              Usar exemplos
            </button>
          </div>
        )}

        <div className="ranking-actions">
          <button
            ref={addButton}
            type="button"
            className="button primary"
            onClick={(e) => openEditor(undefined, e.currentTarget)}
            disabled={!ready || results.length >= MAX_OFFERS}
          >
            <Plus size={18} aria-hidden="true" />
            {results.length >= MAX_OFFERS
              ? "Limite de 12 opções"
              : "Adicionar opção"}
          </button>
          <button
            type="button"
            className="button quiet"
            onClick={exportCsv}
            disabled={!results.length}
          >
            <ArrowDownToLine size={18} aria-hidden="true" />
            CSV
          </button>
          <button
            type="button"
            className="button quiet"
            onClick={() => {
              setScenario(createScenario(scenario.startDate));
              setRemoved(null);
              setNotice("Exemplos restaurados.");
            }}
            disabled={!ready}
          >
            <RotateCcw size={18} aria-hidden="true" />
            Exemplos
          </button>
        </div>
      </div>

      {ranked.length > 0 && (
        <GrowthChart
          investments={ranked.map((r) => r.investment)}
          cdiRate={scenario.cdiRate}
        />
      )}

      <noscript>
        <p className="status">
          Ative o JavaScript para editar e salvar esta comparação.
        </p>
      </noscript>

      {editing && (
        <OfferDialog
          investment={editing.investment}
          isNew={editing.isNew}
          canDuplicate={results.length < MAX_OFFERS}
          onClose={closeEditor}
          onRemove={() => {
            remove(editing.investment);
            closeEditor();
          }}
          onDuplicate={() => {
            duplicate(editing.investment);
            closeEditor();
          }}
          onSave={(investment) => {
            setScenario((s) => ({
              ...s,
              investments: editing.isNew
                ? [...s.investments, investment]
                : s.investments.map((i) =>
                    i.id === investment.id ? investment : i,
                  ),
            }));
            setNotice(
              editing.isNew ? "Opção adicionada." : "Opção atualizada.",
            );
            closeEditor();
          }}
        />
      )}
    </section>
  );
}
