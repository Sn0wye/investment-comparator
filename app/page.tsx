import { ChartNoAxesCombined } from "lucide-react";
import InvestmentComparison from "@/components/investment-comparison";
import { createScenario } from "@/lib/storage";

export default function Home() {
  const initialScenario = createScenario(new Date().toISOString().slice(0, 10));
  return (
    <>
      <a href="#simulador" className="skip-link">
        Pular para o simulador
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="Rende, início">
            <span className="brand-symbol">
              <ChartNoAxesCombined
                aria-hidden="true"
                size={24}
                strokeWidth={2.5}
              />
            </span>
            rende<span className="brand-dot">.</span>
          </a>
          <nav aria-label="Navegação principal">
            <a className="nav-active" href="#simulador">
              Comparador
            </a>
            <a href="#como-funciona">Como funciona</a>
          </nav>
        </div>
      </header>
      <main className="shell">
        <section className="intro" aria-labelledby="page-title">
          <h1 id="page-title">Compare investimentos</h1>
        </section>
        <InvestmentComparison initialScenario={initialScenario} />
        <section
          className="methodology"
          id="como-funciona"
          aria-labelledby="method-title"
        >
          <h2 id="method-title">Como funciona</h2>
          <div className="explanations">
            <details>
              <summary>Como o rendimento é calculado?</summary>
              <p>
                Usamos juros compostos, aporte único e taxa constante. Para % do
                CDI, aplicamos o percentual à taxa diária equivalente do CDI.
                Estimamos dias úteis como dias corridos × 252 / 365, sem
                calendário de feriados. O resultado real pode variar. Não
                incluímos taxas, inflação, aportes mensais ou mudanças futuras
                do CDI.
              </p>
            </details>
            <details>
              <summary>Quais impostos entram na conta?</summary>
              <p>
                Para CDB, o IR incide sobre o ganho após IOF: 22,5% até 180
                dias, 20% de 181 a 360, 17,5% de 361 a 720 e 15% acima de 720
                dias. Aplicamos IOF regressivo em resgates de CDB antes de 30
                dias. LCI/LCA são simuladas com isenção de IR para pessoa
                física.
              </p>
              <p>
                Consulte as regras de{" "}
                <a href="https://www.caixa.gov.br/voce/poupanca-e-investimentos/tesouro-direto/Paginas/default.aspx">
                  tributação de renda fixa
                </a>{" "}
                e de{" "}
                <a href="https://borainvestir.b3.com.br/tipos-de-investimentos/renda-fixa/lci-lca-e-lc/investimentos-isentos-como-declarar-lci-e-lca-corretamente-no-imposto-de-renda-2026/">
                  isenção de LCI/LCA
                </a>
                .
              </p>
            </details>
            <details>
              <summary>Maior rendimento significa melhor investimento?</summary>
              <p>
                Não necessariamente. Liquidez, carência, risco do emissor e
                cobertura do FGC também importam. O simulador compara retorno
                estimado e não verifica disponibilidade ou prazo mínimo dos
                produtos. As opções iniciais são exemplos, não ofertas ou
                recomendações.
              </p>
            </details>
            <details>
              <summary>Onde minha simulação fica salva?</summary>
              <p>
                Somente neste navegador, sem cadastro. Os dados não são enviados
                a um servidor. Limpar os dados do navegador remove a simulação.
                Você pode exportar os resultados em CSV.
              </p>
            </details>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <span className="footer-brand">rende.</span>
        <span>Simulação educativa. Não é recomendação de investimento.</span>
      </footer>
    </>
  );
}
