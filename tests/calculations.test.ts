import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addMonths,
  calculateIRRate,
  calculateInvestmentReturns,
  daysBetween,
} from "../lib/calculations";
import {
  createScenario,
  isDate,
  migrateLegacy,
  parseScenario,
} from "../lib/storage";

const defaults = createScenario("2026-01-01");
const base = { ...defaults.investments[0], rate: 12, isPercentOfCDI: false };

test("one-year fixed CDB compounds from purchase date and taxes gains only", () => {
  const result = calculateInvestmentReturns(base, 10);
  assert.equal(result.days, 365);
  assert.ok(Math.abs(result.grossReturn - 1200) < 0.000001);
  assert.ok(Math.abs(result.liquidReturn - 990) < 0.000001);
  assert.equal(result.irRate, 17.5);
  assert.equal(result.iofAmount, 0);
});
test("all exact regressive income-tax boundaries", () => {
  for (const [days, rate] of [
    [1, 22.5],
    [180, 22.5],
    [181, 20],
    [360, 20],
    [361, 17.5],
    [720, 17.5],
    [721, 15],
  ])
    assert.equal(calculateIRRate(days), rate);
});
test("LCI/LCA has no taxes; CDI 100% matches fixed annual CDI", () => {
  const cdi = calculateInvestmentReturns(
    { ...base, rate: 100, isPercentOfCDI: true, type: "LCI/LCA" },
    12,
  );
  assert.ok(Math.abs(cdi.liquidReturn - 1200) < 0.000001);
  assert.equal(cdi.taxAmount, 0);
  assert.equal(cdi.iofAmount, 0);
});
test("IOF is deducted before IR and ends at 30 days", () => {
  const day1 = calculateInvestmentReturns(base, 12, 1);
  assert.ok(Math.abs(day1.iofAmount / day1.grossReturn - 0.96) < 1e-9);
  assert.ok(
    Math.abs(day1.taxAmount - (day1.grossReturn - day1.iofAmount) * 0.225) <
      1e-9,
  );
  assert.ok(calculateInvestmentReturns(base, 12, 29).iofAmount > 0);
  assert.equal(calculateInvestmentReturns(base, 12, 30).iofAmount, 0);
});
test("zero interest and chart origin return principal without NaN", () => {
  assert.equal(
    calculateInvestmentReturns({ ...base, rate: 0 }, 0).liquidValue,
    base.amount,
  );
  assert.equal(calculateInvestmentReturns(base, 12, 0).liquidReturn, 0);
});
test("calendar math handles month end, leap days, and DST independently", () => {
  assert.equal(addMonths("2024-01-31", 1), "2024-02-29");
  assert.equal(addMonths("2024-02-29", 12), "2025-02-28");
  assert.equal(addMonths("0099-12-31", 2), "0100-02-28");
  assert.equal(daysBetween("2024-01-01", "2025-01-01"), 366);
  assert.equal(daysBetween("2026-03-07", "2026-03-10"), 3);
  assert.equal(isDate("2026-02-30"), false);
});
test("storage validates payloads and accepts deliberately empty comparisons", () => {
  assert.deepEqual(parseScenario(JSON.stringify(defaults)), defaults);
  assert.equal(
    parseScenario(JSON.stringify({ ...defaults, investments: [] })).investments
      .length,
    0,
  );
  for (const value of [
    null,
    {},
    { ...defaults, cdiRate: "NaN" },
    { ...defaults, investments: [base, base] },
    { ...defaults, investments: [{ ...base, amount: -1 }] },
    { ...defaults, investments: [{ ...base, endDate: "2025-01-01" }] },
  ])
    assert.throws(() => parseScenario(JSON.stringify(value)));
});
test("legacy migration preserves amounts, rates, and purchase/maturity dates", () => {
  const legacy = [
    {
      ...base,
      purchaseDate: "2025-02-01T03:00:00.000Z",
      endDate: "2027-01-01T03:00:00.000Z",
      ir: 20,
    },
  ];
  const migrated = migrateLegacy(JSON.stringify(legacy), "13.25", defaults);
  assert.equal(migrated.investments[0].purchaseDate, "2025-02-01");
  assert.equal(migrated.investments[0].endDate, "2027-01-01");
  assert.equal(migrated.cdiRate, 13.25);
  assert.equal(migrated.investments[0].amount, base.amount);
  assert.equal(migrateLegacy("[]", "NaN", defaults).cdiRate, defaults.cdiRate);
  assert.throws(() => migrateLegacy("{bad json", "12", defaults));
});
