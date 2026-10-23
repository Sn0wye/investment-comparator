"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  Plus,
  SlidersHorizontal,
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
  isDate,
  migrateLegacy,
  parseScenario,
} from "@/lib/storage";
import type { Investment, Scenario } from "@/lib/types";
import GrowthChart, { COLORS } from "./growth-chart";

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
  const [saveStatus, setSaveStatus] = useState("Salvo neste navegador");
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
      setSaveStatus("Salvo neste navegador");
    } catch {
      setSaveStatus("Não salvo: armazenamento indisponível");
    }
  }, [scenario, ready, canSave]);

  const results = scenario.investments.map((investment, index) => ({
    investment,
    color: COLORS[index % COLORS.length],
    ...calculateInvestmentReturns(investment, scenario.cdiRate),
  }));
  const ranked = [...results].sort((a, b) => b.liquidReturn - a.liquidReturn);
  const comparable = results.every(
    (r) =>
      r.investment.amount === results[0].investment.amount &&
      r.investment.purchaseDate === results[0].investment.purchaseDate &&
      r.investment.endDate === results[0].investment.endDate,
  );
  const best = ranked[0];
  const tied =
    ranked.length > 1 &&
    Math.abs(ranked[0].liquidReturn - ranked[1].liquidReturn) < 0.01;
  const examples =
    scenario.investments.length > 0 &&
    scenario.investments.every((i) => i.id.startsWith("example-"));

  function openEditor(investment?: Investment) {
    returnFocus.current = document.activeElement as HTMLElement;
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
      aria-label="Simulador de renda fixa"
      className="simulator"
    >
      <div className="workspace-toolbar">
        <span>
          <span className="status-dot" />
          Sua simulação <span className="toolbar-divider">/</span>{" "}
          <span className="muted">Renda fixa</span>
        </span>
        <div>
          <span className="save-status">
            <Check size={13} />
            {saveStatus}
          </span>
          <button
            className="icon-button"
            aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
            onClick={() => {
              const next = !dark;
              setDark(next);
              document.documentElement.dataset.theme = next ? "dark" : "light";
              try {
                localStorage.setItem("rende-theme", next ? "dark" : "light");
              } catch {
                /* Theme remains usable without storage. */
              }
            }}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
      <div className="workspace-grid">
        <aside className="scenario-panel">
          <div className="panel-title">
            <SlidersHorizontal size={18} />
            <h2>Seu cenário</h2>
          </div>
          <p className="panel-description">
            O mesmo ponto de partida
            <br />
            para todas as opções.
          </p>
          <form
            key={`${scenario.amount}-${scenario.months}-${scenario.startDate}-${scenario.cdiRate}`}
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const amount = Number(data.get("amount")),
                months = Number(data.get("months")),
                cdiRate = Number(data.get("cdi")),
                startDate = String(data.get("startDate"));
              if (
                !Number.isFinite(amount) ||
                amount < 0.01 ||
                amount > 1e9 ||
                !Number.isInteger(months) ||
                months < 1 ||
                months > 360 ||
                !Number.isFinite(cdiRate) ||
                cdiRate < 0 ||
                cdiRate > 100 ||
                !isDate(startDate)
              )
                return;
              const endDate = addMonths(startDate, months);
              setScenario((s) => ({
                ...s,
                amount,
                months,
                cdiRate,
                startDate,
                investments: s.investments.map((i) => ({
                  ...i,
                  amount,
                  purchaseDate: startDate,
                  endDate,
                })),
              }));
              setNotice("Cenário aplicado a todas as opções.");
            }}
          >
            <label className="field">
              Quanto você quer investir?
              <span className="input-affix">
                <span>R$</span>
                <input
                  name="amount"
                  aria-label="Valor para investir"
                  type="number"
                  min="0.01"
                  max="1000000000"
                  step="0.01"
                  defaultValue={scenario.amount}
                  required
                />
              </span>
            </label>
            <label className="field">
              Por quanto tempo?
              <span className="input-affix suffix">
                <input
                  name="months"
                  aria-label="Prazo em meses"
                  type="number"
                  min="1"
                  max="360"
                  step="1"
                  defaultValue={scenario.months}
                  required
                />
                <span>meses</span>
              </span>
            </label>
            <div className="term-shortcuts">
              {[6, 12, 24, 36].map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={(event) => {
                    const input = event.currentTarget.form?.elements.namedItem(
                      "months",
                    ) as HTMLInputElement;
                    input.value = String(months);
                    input.focus();
                  }}
                >
                  {months}m
                </button>
              ))}
            </div>
            <label className="field">
              Data da aplicação
              <input
                type="date"
                name="startDate"
                defaultValue={scenario.startDate}
                required
                max="9900-12-31"
              />
            </label>
            <div className="cdi-field">
              <label className="field">
                CDI para simular
                <span className="input-affix suffix">
                  <input
                    name="cdi"
                    aria-label="CDI anual para simular"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    defaultValue={scenario.cdiRate}
                    required
                  />
                  <span>% a.a.</span>
                </span>
              </label>
              <p className="field-help">
                Taxa hipotética e constante.
                <br />
                Não é uma cotação em tempo real.
              </p>
            </div>
            <button
              className="button primary apply-button"
              type="submit"
              disabled={!ready}
            >
              Aplicar cenário <ArrowUpRight size={17} />
            </button>
          </form>
          <div className="scenario-tip">
            <CircleHelp size={18} />
            <p>
              Uma LCI com taxa menor pode render mais que um CDB. O imposto faz
              diferença.
            </p>
          </div>
        </aside>
        <div className="comparison-panel">
          <div className="comparison-heading">
            <div>
              <h2>
                Compare o que fica com você
                <span className="count-badge">{results.length}</span>
              </h2>
              <p>
                {examples
                  ? "Comece com estes exemplos ou adicione suas opções."
                  : "Valores estimados no vencimento, depois dos impostos."}
              </p>
            </div>
            <button
              className="button secondary export-button"
              onClick={exportCsv}
              disabled={!results.length}
            >
              <ArrowDownToLine size={15} />
              Exportar
            </button>
          </div>
          <div className="notice" role="status" aria-live="polite">
            {notice}
            {removed && (
              <button
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
          </div>
          {!comparable && (
            <p className="comparison-warning">
              As opções têm valores ou datas diferentes. Aplique um cenário
              comum para comparar em igualdade. A ordem abaixo considera apenas
              o ganho em reais.
            </p>
          )}
          {best && comparable && (
            <div className="result-banner">
              <span className="result-symbol">
                <ArrowUpRight size={25} />
              </span>
              <div>
                <p>
                  {results.length === 1
                    ? "Resultado da sua opção"
                    : tied
                      ? "As primeiras opções empatam"
                      : "Maior ganho líquido neste cenário"}
                </p>
                <strong>{best.investment.name}</strong>
                <span className="result-context">
                  {results.length > 1 && !tied
                    ? `${money(best.liquidReturn - ranked[1].liquidReturn)} a mais que a próxima opção`
                    : `${best.days} dias de investimento`}
                </span>
              </div>
              <div className="result-value">
                <span>Ganho líquido</span>
                <strong>+ {money(best.liquidReturn)}</strong>
                <span>{percent(best.netPercent)} no período</span>
              </div>
            </div>
          )}
          {results.length ? (
            <>
              <div className="offers-header">
                <span>Opção / rentabilidade</span>
                <span>Você recebe</span>
              </div>
              <div className="offers-list">
                {ranked.map((result, index) => (
                  <article
                    className={`offer-row ${index === 0 && comparable && results.length > 1 && !tied ? "leading-offer" : ""}`}
                    key={result.investment.id}
                  >
                    <div className="offer-main">
                      <div className="offer-identity">
                        <span
                          className="offer-swatch"
                          style={{ background: result.color }}
                        />
                        <div>
                          <h3>{result.investment.name}</h3>
                          <p>
                            {percent(result.investment.rate)}{" "}
                            {result.investment.isPercentOfCDI
                              ? "do CDI"
                              : "ao ano"}
                            <span className="tag">
                              {result.investment.type === "CDB"
                                ? `IR ${percent(result.irRate)}`
                                : "Isento de IR"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="offer-value">
                        <strong>{money(result.liquidValue)}</strong>
                        <span>+ {money(result.liquidReturn)} líquidos</span>
                      </div>
                    </div>
                    <div className="offer-bottom">
                      <details>
                        <summary>
                          Ver composição <ChevronDown size={13} />
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
                            <dt>Imposto de renda</dt>
                            <dd>− {money(result.taxAmount)}</dd>
                          </div>
                          <div>
                            <dt>IOF</dt>
                            <dd>− {money(result.iofAmount)}</dd>
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
                            <dt>Aplicação / vencimento</dt>
                            <dd>
                              {result.investment.purchaseDate
                                .split("-")
                                .reverse()
                                .join("/")}{" "}
                              /{" "}
                              {result.investment.endDate
                                .split("-")
                                .reverse()
                                .join("/")}
                            </dd>
                          </div>
                        </dl>
                      </details>
                      <div className="offer-actions">
                        <button
                          className="icon-button"
                          aria-label={`Editar ${result.investment.name}`}
                          title="Editar"
                          onClick={() => openEditor(result.investment)}
                          disabled={!ready}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Duplicar ${result.investment.name}`}
                          title="Duplicar"
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
                          <Copy size={14} />
                        </button>
                        <button
                          className="icon-button remove-button"
                          aria-label={`Remover ${result.investment.name}`}
                          title="Remover"
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
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <SlidersHorizontal size={32} />
              <h3>Seu próximo investimento começa aqui.</h3>
              <p>
                Adicione um CDB, LCI ou LCA para ver a estimativa de retorno.
              </p>
              <button
                className="button secondary"
                onClick={() => {
                  setScenario(createScenario(scenario.startDate));
                  setNotice("Exemplos restaurados.");
                }}
              >
                Experimentar com exemplos
              </button>
            </div>
          )}
          <button
            ref={addButton}
            className="add-offer"
            onClick={() => openEditor()}
            disabled={!ready || results.length >= MAX_OFFERS}
          >
            <Plus size={18} />
            {results.length >= MAX_OFFERS
              ? "Limite de 12 opções atingido"
              : "Adicionar opção de investimento"}
          </button>
          {results.length > 0 && (
            <section className="growth-section" aria-labelledby="chart-heading">
              <div className="chart-heading">
                <h3 id="chart-heading">Seu dinheiro ao longo do tempo</h3>
                <span>Ganho líquido estimado (R$)</span>
              </div>
              <GrowthChart
                investments={scenario.investments}
                cdiRate={scenario.cdiRate}
              />
              <p className="chart-note">
                Estimativa de resgate em cada prazo. Cada linha termina no
                vencimento da opção.
              </p>
            </section>
          )}
          <div className="comparison-footnote">
            <span>
              <Check size={14} /> Sem cadastro. Seus dados ficam com você.
            </span>
            <button
              onClick={() => {
                setScenario(createScenario(scenario.startDate));
                setRemoved(null);
                setNotice("Exemplos restaurados.");
              }}
              disabled={!ready}
            >
              <RotateCcw size={13} />
              Restaurar exemplos
            </button>
          </div>
        </div>
      </div>
      <noscript>
        <p className="comparison-warning">
          Esta é uma simulação de exemplo. Ative o JavaScript para alterar
          valores e salvar sua comparação.
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
                ? "Opção adicionada à comparação."
                : "Opção atualizada.",
            );
            closeEditor();
          }}
        />
      )}
    </section>
  );
}
