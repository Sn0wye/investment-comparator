# Rende

A Portuguese-language fixed-income comparator for CDB and LCI/LCA. Compare estimated net returns, edit or duplicate offers, apply a shared scenario, inspect a growth chart, and export CSV. No account or backend is required.

## Development

Requires Node.js 22+ and pnpm 9.15.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Production

```sh
pnpm build
pnpm start
```

Next.js 16 App Router exports the site to `out/`. `pnpm start` serves that directory on port 3000. Deploy `out/` on any static host with directory index support, or use Vercel's Next.js preset. There is no runtime Next.js server, database, API key, or environment variable to configure.

The page, examples, results, and SVG chart are rendered at build time. The example application date is the build date and is editable. JavaScript enables editing and restores browser-local data after hydration. Without JavaScript the example comparison and methodology remain readable. Fonts use the system stack; no remote font fetch is required. The offer dialog is loaded on demand, and reduced-motion preferences disable CSS animation.

## Interface and accessibility

The main flow is amount, term, and ranked net returns. CDI/date settings, offer details, the growth chart, and export/reset actions expand only when needed. The chart includes a data table and distinct line patterns.

Controls have visible focus, at least 44px touch targets, and inline errors linked to their fields. Invalid collapsed fields expand and receive focus. The modal contains keyboard focus and restores it to its trigger on close. Layouts support narrow screens, enlarged text, dark mode, reduced motion/transparency, increased contrast, and forced colors.

Verification included a 320px viewport with 200% text, keyboard navigation, invalid form submission, iPhone Safari simulation, and automated accessibility checks. These checks do not replace a full VoiceOver/TalkBack user test. Android device verification was unavailable in this environment.

## Checks

```sh
pnpm audit
pnpm test
pnpm build
pnpm typecheck
pnpm check:static
pnpm format:check
```

CI runs these checks. `check:static` verifies meaningful prerendered content, local assets, and a 220 KiB gzip budget for initial HTML, JavaScript, and CSS. This is a build-artifact budget, not a field performance measurement. To audit a production build locally:

```sh
pnpm start
# In another terminal, with Chrome installed:
pnpm dlx lighthouse http://localhost:3000 --chrome-flags="--headless" --view
```

## Dependency security

Next.js is pinned to the latest stable release verified on 2026-10-23, `16.4.3`. React and React DOM use `19.3.1` or compatible patches. Node types stay on the latest Node 22 release to match CI.

Two targeted pnpm overrides enforce patched transitive dependencies: `source-map-js` 1.2.2 for [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q), and `compression` 1.8.2 under `serve` for [GHSA-vc2v-76pw-4v95](https://github.com/advisories/GHSA-vc2v-76pw-4v95). The latter is needed because the latest `serve` still pins 1.8.1. Remove these overrides when upstream dependencies resolve patched versions themselves.

CI runs `pnpm audit` against all dependencies, including development tools, and fails on reported vulnerabilities. A clean audit covers known registry advisories at the time of the check; it is not a guarantee against undiscovered vulnerabilities.

## Structure

- `app/page.tsx`: static page, navigation, and calculation methodology.
- `components/investment-comparison.tsx`: scenario controls, ranking, browser persistence, and CSV export.
- `components/offer-dialog.tsx`: native modal with validation and focus management.
- `components/growth-chart.tsx`: accessible SVG projections without a chart dependency.
- `lib/calculations.ts`: pure date, compound-return, IR, and IOF calculations.
- `lib/storage.ts`: validated storage format and migration from the previous app.

## Calculation assumptions

This is an educational estimate for individuals, not an offer feed or investment recommendation. The initial 12% CDI is a hypothetical editable scenario, not a live quote.

- Single contribution, constant interest, no fees or inflation adjustment.
- Fixed annual rates are converted to daily rates using 252 business days/year.
- CDI percentages multiply the equivalent daily CDI rate, then compound.
- Business days are approximated as calendar days × 252 / 365. Holidays are not modeled.
- IR on CDB earnings uses exact calendar-day brackets: 22.5% through 180 days, 20% through 360, 17.5% through 720, and 15% thereafter.
- CDB redemption before 30 days deducts regressive IOF before calculating IR.
- LCI/LCA are modeled as exempt from IR for individuals.
- Every offer uses its full purchase-to-maturity period, including imported historical purchases. The chart shows estimated net gains if redeemed at each elapsed day, ending at that offer's maturity. It does not imply early-redemption availability.
- A leading option is highlighted only when principal, purchase date, and maturity match. Differing scenarios show a warning and sort by absolute net gain.

Sources: [CAIXA's taxation explanation](https://www.caixa.gov.br/voce/poupanca-e-investimentos/tesouro-direto/Paginas/default.aspx) and [B3's 2026 LCI/LCA exemption explanation](https://borainvestir.b3.com.br/tipos-de-investimentos/renda-fixa/lci-lca-e-lc/investimentos-isentos-como-declarar-lci-e-lca-corretamente-no-imposto-de-renda-2026/). Review tax assumptions when regulations change.

## Browser data and rollback

The versioned key is `investment-comparator:v1`. On the first visit, existing `investments` and `cdiRate` keys are validated and migrated, preserving each offer's amount, rate, and dates. The legacy keys are never deleted or overwritten. The new format supports up to 12 options.

Malformed or unsupported saved data remains untouched. In that case the UI explains that it is using unsaved examples; export remains available. Storage quota failures also show an unsaved status. No simulation data is sent to a server. Clearing site storage removes saved comparisons.

Reverting the deployment restores the old application and its legacy data. Changes made in the new UI are not copied back to the legacy format.
