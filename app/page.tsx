import InvestmentComparison from "@/components/investment-comparison";
import { createScenario } from "@/lib/storage";

export default function Home() {
  const initialScenario = createScenario(new Date().toISOString().slice(0, 10));
  return (
    <>
      <a href="#simulador" className="skip-link">
        Pular para o comparador
      </a>
      <main className="shell">
        <InvestmentComparison initialScenario={initialScenario} />
        <section
          className="method"
          id="como-funciona"
          aria-labelledby="method-title"
        >
          <h2 id="method-title">Como a conta é feita</h2>
          <div className="method-grid">
            <article>
              <h3>Rendimento</h3>
              <p>
                Juros compostos, aporte único e taxa constante. Para % do CDI, o
                percentual multiplica a taxa diária equivalente do CDI. Dias
                úteis são estimados como dias corridos × 252 / 365. Não entram
                taxas, inflação, aportes mensais nem mudanças futuras do CDI.
              </p>
            </article>
            <article>
              <h3>Impostos</h3>
              <p>
                CDB paga IR sobre o ganho: 22,5% até 180 dias, 20% até 360,
                17,5% até 720 e 15% acima disso. Resgate antes de 30 dias também
                paga IOF regressivo. LCI e LCA são isentas de IR para pessoa
                física, por isso mostramos a taxa de CDB equivalente.
              </p>
            </article>
            <article>
              <h3>O que não entra</h3>
              <p>
                Liquidez, carência, risco do emissor e cobertura do FGC. Maior
                valor líquido não é sinônimo de melhor escolha. As opções
                iniciais são exemplos, não ofertas.
              </p>
            </article>
            <article>
              <h3>Seus dados</h3>
              <p>
                Ficam só neste navegador, sem cadastro e sem servidor. Limpar os
                dados do site apaga a comparação. Dá para exportar em CSV a
                qualquer momento.
              </p>
            </article>
          </div>
          <p className="method-sources">
            Fontes:{" "}
            <a href="https://www.caixa.gov.br/voce/poupanca-e-investimentos/tesouro-direto/Paginas/default.aspx">
              tributação de renda fixa
            </a>{" "}
            e{" "}
            <a href="https://borainvestir.b3.com.br/tipos-de-investimentos/renda-fixa/lci-lca-e-lc/investimentos-isentos-como-declarar-lci-e-lca-corretamente-no-imposto-de-renda-2026/">
              isenção de LCI/LCA
            </a>
            .
          </p>
        </section>
      </main>
      <footer className="site-footer">
        <span className="wordmark">rende</span>
        <span>Simulação educativa. Não é recomendação de investimento.</span>
      </footer>
    </>
  );
}
