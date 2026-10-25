"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowDownToLine,
  ChevronDown,
  Copy,
  Plus,
  Trash2,
  Pencil,
  RotateCcw,
  Moon,
  Sun,
} from "lucide-react";
import {
  addMonths,
  calculateInvestmentReturns,
  money,
  percent,
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
import ScenarioForm from "./scenario-form";

const OfferDialog = dynamic(() => import("./offer-dialog"));

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
        setNotice(
          "Sua comparação anterior foi importada. Valores e datas foram preservados.",
        );
      }
      setCanSave(true);
      const theme = localStorage.getItem("rende-theme");
      if (theme === "dark") {
        setDark(true);
        document.documentElement.dataset.theme = "dark";
      }
    } catch {
      setSaveStatus("Salvamento indisponível");
      setNotice(
        "Não foi possível carregar os dados salvos. Seus dados anteriores foram preservados; você pode usar os exemplos sem salvá-los.",
      );
    }
    setReady(true);
  }, [initialScenario]);

  useEffect(() => {
    if (!ready || !canSave) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario));
      setSaveStatus("");
    } catch {
      setSaveStatus("Não salvo: armazenamento indisponível");
    }
  }, [scenario, ready, canSave]);

  const results = scenario.investments.map((investment) => ({
    investment,
    ...calculateInvestmentReturns(investment, scenario.cdiRate),
  }));
  const ranked = [...results].sort((a, b) => b.liquidReturn - a.liquidReturn);
  const comparable = results.every(
    (r) =>
      r.investment.amount === results[0].investment.amount &&
      r.investment.purchaseDate === results[0].investment.purchaseDate &&
      r.investment.endDate === results[0].investment.endDate,
  );
  const tied =
    ranked.length > 1 &&
    Math.abs(ranked[0].liquidReturn - ranked[1].liquidReturn) < 0.01;
  const examples =
    scenario.investments.length > 0 &&
    scenario.investments.every((i) => i.id.startsWith("example-"));

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
      ...results.map((r) => [
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
        ["\uFEFF" + rows.map((row) => row.map(cell).join(";")).join("\r\n")],
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
      aria-label="Simulador de renda fixa"
      className="simulator"
    >
      <div className="workspace-grid">
        <aside className="scenario-panel" aria-labelledby="scenario-title">
          <h2 id="scenario-title">Sua simulação</h2>
          <ScenarioForm
            scenario={scenario}
            ready={ready}
            onApply={(next) => {
              setScenario(next);
              setNotice(
                `Simulação atualizada: ${money(next.amount)} por ${next.months} meses. Confira os valores líquidos.`,
              );
            }}
          />
        </aside>
        <section
          className="comparison-panel"
          aria-labelledby="comparison-title"
        >
          <div className="comparison-heading">
            <h2 id="comparison-title">Valor líquido no vencimento</h2>
            <button
              className="icon-button"
              aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
              onClick={() => {
                const next = !dark;
                setDark(next);
                document.documentElement.dataset.theme = next
                  ? "dark"
                  : "light";
                try {
                  localStorage.setItem("rende-theme", next ? "dark" : "light");
                } catch {
                  /* Theme works without storage. */
                }
              }}
            >
              {dark ? (
                <Sun aria-hidden="true" size={20} />
              ) : (
                <Moon aria-hidden="true" size={20} />
              )}
            </button>
          </div>
          {examples && (
            <p className="example-note">
              Opções de exemplo. Edite as taxas ou adicione a sua.
            </p>
          )}
          <p className="storage-warning" role="status" aria-atomic="true">
            {saveStatus}
          </p>
          <div className="notice">
            <p role="status" aria-atomic="true">
              {notice}
            </p>
            {removed && (
              <button
                className="text-button"
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
                Desfazer remoção
              </button>
            )}
          </div>
          {!comparable && (
            <p className="comparison-warning">
              Valores ou datas diferentes. Use “Aplicar a todas” para comparar
              nas mesmas condições. A ordem considera o ganho em reais.
            </p>
          )}
          {tied && comparable && (
            <p className="example-note">
              As primeiras opções têm o mesmo ganho líquido.
            </p>
          )}
          {results.length ? (
            <div className="offers-list">
              {ranked.map((result, index) => (
                <article
                  className="offer-row"
                  key={result.investment.id}
                  aria-labelledby={`offer-${result.investment.id}`}
                >
                  <div className="offer-main">
                    <div className="offer-identity">
                      <h3 id={`offer-${result.investment.id}`}>
                        {result.investment.name}
                      </h3>
                      <p>
                        {percent(result.investment.rate)}{" "}
                        {result.investment.isPercentOfCDI ? "do CDI" : "ao ano"}
                      </p>
                      {index === 0 &&
                        comparable &&
                        results.length > 1 &&
                        !tied && (
                          <span className="best-label">
                            Maior ganho líquido
                          </span>
                        )}
                    </div>
                    <div className="offer-value">
                      <strong>
                        <span className="sr-only">Valor líquido: </span>
                        {money(result.liquidValue)}
                      </strong>
                      <span>Ganho de {money(result.liquidReturn)}</span>
                    </div>
                  </div>
                  <div className="offer-bottom">
                    <details className="offer-details">
                      <summary>
                        Detalhes
                        <span className="sr-only">
                          {" "}
                          de {result.investment.name}
                        </span>
                        <ChevronDown size={16} aria-hidden="true" />
                      </summary>
                      <dl className="breakdown">
                        <div>
                          <dt>Valor aplicado</dt>
                          <dd>{money(result.investment.amount)}</dd>
                        </div>
                        <div>
                          <dt>Ganho bruto</dt>
                          <dd>{money(result.grossReturn)}</dd>
                        </div>
                        <div>
                          <dt>Imposto de renda ({percent(result.irRate)})</dt>
                          <dd>{money(result.taxAmount)}</dd>
                        </div>
                        <div>
                          <dt>IOF</dt>
                          <dd>{money(result.iofAmount)}</dd>
                        </div>
                        <div>
                          <dt>Prazo</dt>
                          <dd>{result.days} dias</dd>
                        </div>
                        <div>
                          <dt>Ganho líquido</dt>
                          <dd>{percent(result.netPercent)}</dd>
                        </div>
                        <div>
                          <dt>Aplicação</dt>
                          <dd>
                            {result.investment.purchaseDate
                              .split("-")
                              .reverse()
                              .join("/")}
                          </dd>
                        </div>
                        <div>
                          <dt>Vencimento</dt>
                          <dd>
                            {result.investment.endDate
                              .split("-")
                              .reverse()
                              .join("/")}
                          </dd>
                        </div>
                      </dl>
                      <div className="detail-actions">
                        <button
                          className="text-button"
                          disabled={!ready || results.length >= MAX_OFFERS}
                          onClick={() => {
                            setScenario((s) => ({
                              ...s,
                              investments: [
                                ...s.investments,
                                {
                                  ...result.investment,
                                  id: crypto.randomUUID(),
                                  name: `${result.investment.name.slice(0, 72)} (cópia)`,
                                },
                              ],
                            }));
                            setNotice(
                              "Opção duplicada. Edite a taxa para comparar.",
                            );
                          }}
                        >
                          <Copy size={16} aria-hidden="true" />
                          Duplicar
                          <span className="sr-only">
                            {" "}
                            {result.investment.name}
                          </span>
                        </button>
                        <button
                          className="text-button danger"
                          disabled={!ready}
                          onClick={() => {
                            setRemoved(result.investment);
                            setScenario((s) => ({
                              ...s,
                              investments: s.investments.filter(
                                (i) => i.id !== result.investment.id,
                              ),
                            }));
                            setNotice(`${result.investment.name} removido.`);
                            addButton.current?.focus();
                          }}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                          Remover
                          <span className="sr-only">
                            {" "}
                            {result.investment.name}
                          </span>
                        </button>
                      </div>
                    </details>
                    <button
                      className="text-button edit-button"
                      onClick={(event) =>
                        openEditor(result.investment, event.currentTarget)
                      }
                      disabled={!ready}
                    >
                      <Pencil size={16} aria-hidden="true" />
                      Editar
                      <span className="sr-only"> {result.investment.name}</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>Adicione sua primeira opção</h3>
              <button
                className="button secondary"
                onClick={() => {
                  setScenario(createScenario(scenario.startDate));
                  setNotice("Exemplos restaurados.");
                }}
              >
                Usar exemplos
              </button>
            </div>
          )}
          <button
            ref={addButton}
            className="button add-offer"
            onClick={(event) => openEditor(undefined, event.currentTarget)}
            disabled={!ready || results.length >= MAX_OFFERS}
          >
            <Plus size={20} aria-hidden="true" />
            {results.length >= MAX_OFFERS
              ? "Limite de 12 opções atingido"
              : "Adicionar investimento"}
          </button>
          {results.length > 0 && (
            <details className="growth-section">
              <summary>
                Evolução do ganho líquido
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <GrowthChart
                investments={scenario.investments}
                cdiRate={scenario.cdiRate}
              />
            </details>
          )}
          <details className="more-options">
            <summary>
              Mais opções
              <ChevronDown size={18} aria-hidden="true" />
            </summary>
            <div className="detail-actions">
              <button
                className="text-button"
                onClick={exportCsv}
                disabled={!results.length}
              >
                <ArrowDownToLine size={18} aria-hidden="true" />
                Exportar CSV
              </button>
              <button
                className="text-button"
                onClick={() => {
                  setScenario(createScenario(scenario.startDate));
                  setRemoved(null);
                  setNotice("Exemplos restaurados.");
                }}
                disabled={!ready}
              >
                <RotateCcw size={18} aria-hidden="true" />
                Restaurar exemplos
              </button>
            </div>
          </details>
        </section>
      </div>
      <noscript>
        <p className="comparison-warning">
          Ative o JavaScript para editar e salvar esta simulação de exemplo.
        </p>
      </noscript>
      {editing && (
        <OfferDialog
          investment={editing.investment}
          isNew={editing.isNew}
          onClose={closeEditor}
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
              editing.isNew
                ? "Investimento adicionado."
                : "Investimento atualizado.",
            );
            closeEditor();
          }}
        />
      )}
    </section>
  );
}
