import { addMonths, daysBetween } from "./calculations";
import type { Investment, Scenario } from "./types";

export const STORAGE_KEY = "investment-comparator:v1";
export const MAX_OFFERS = 12;
const numberIn = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;
export function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function isInvestment(value: unknown): value is Investment {
  if (!value || typeof value !== "object") return false;
  const v = value as Investment;
  return (
    typeof v.id === "string" &&
    v.id.length > 0 &&
    typeof v.name === "string" &&
    v.name.trim().length > 0 &&
    v.name.length <= 80 &&
    (v.type === "CDB" || v.type === "LCI/LCA") &&
    typeof v.isPercentOfCDI === "boolean" &&
    numberIn(v.rate, 0, v.isPercentOfCDI ? 300 : 100) &&
    numberIn(v.amount, 0.01, 1e9) &&
    isDate(v.purchaseDate) &&
    isDate(v.endDate) &&
    daysBetween(v.purchaseDate, v.endDate) > 0 &&
    daysBetween(v.purchaseDate, v.endDate) <= 36525
  );
}
export function createScenario(startDate: string): Scenario {
  const base = {
    amount: 10000,
    purchaseDate: startDate,
    endDate: addMonths(startDate, 12),
    isPercentOfCDI: true,
  };
  return {
    version: 1,
    cdiRate: 12,
    amount: 10000,
    months: 12,
    startDate,
    investments: [
      {
        ...base,
        id: "example-cdb",
        name: "CDB pós-fixado",
        type: "CDB",
        rate: 110,
      },
      {
        ...base,
        id: "example-lci",
        name: "LCI / LCA",
        type: "LCI/LCA",
        rate: 95,
      },
      {
        ...base,
        id: "example-fixed",
        name: "CDB prefixado",
        type: "CDB",
        rate: 12.5,
        isPercentOfCDI: false,
      },
    ],
  };
}
export function parseScenario(raw: string): Scenario {
  const v = JSON.parse(raw) as Scenario;
  if (
    !v ||
    v.version !== 1 ||
    !numberIn(v.cdiRate, 0, 100) ||
    !numberIn(v.amount, 0.01, 1e9) ||
    !numberIn(v.months, 1, 360) ||
    !Number.isInteger(v.months) ||
    !isDate(v.startDate) ||
    v.startDate > "9900-12-31" ||
    !Array.isArray(v.investments) ||
    v.investments.length > MAX_OFFERS ||
    !v.investments.every(isInvestment) ||
    new Set(v.investments.map((i) => i.id)).size !== v.investments.length
  )
    throw new Error("Invalid saved scenario");
  return v;
}
// Leave old keys untouched so migration and deployment can be rolled back.
export function migrateLegacy(
  raw: string,
  cdi: string | null,
  defaults: Scenario,
): Scenario {
  const values: unknown = JSON.parse(raw);
  if (!Array.isArray(values)) throw new Error("Invalid legacy investments");
  const investments = values.map((value) => {
    if (!value || typeof value !== "object")
      throw new Error("Invalid legacy investment");
    const v = value as Record<string, unknown>;
    const result = {
      ...v,
      purchaseDate:
        typeof v.purchaseDate === "string"
          ? v.purchaseDate.slice(0, 10)
          : defaults.startDate,
      endDate: typeof v.endDate === "string" ? v.endDate.slice(0, 10) : "",
    };
    if (!isInvestment(result)) throw new Error("Invalid legacy investment");
    return result;
  });
  if (
    investments.length > MAX_OFFERS ||
    new Set(investments.map((i) => i.id)).size !== investments.length
  )
    throw new Error("Too many or duplicate investments");
  const cdiRate =
    cdi !== null && cdi.trim() !== "" ? Number(cdi) : defaults.cdiRate;
  return {
    ...defaults,
    investments,
    cdiRate: numberIn(cdiRate, 0, 100) ? cdiRate : defaults.cdiRate,
    amount: investments[0]?.amount ?? defaults.amount,
  };
}
