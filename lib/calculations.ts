import type { Investment } from "./types";
const DAY = 86_400_000;
export const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const percent = (value: number) =>
  `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
export function daysBetween(start: string, end: string) {
  return Math.round(
    (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY,
  );
}
export function addMonths(date: string, months: number) {
  const start = new Date(`${date}T00:00:00Z`);
  const target = new Date(start);
  target.setUTCDate(1);
  target.setUTCMonth(target.getUTCMonth() + months);
  const lastDay = new Date(target);
  lastDay.setUTCMonth(lastDay.getUTCMonth() + 1, 0);
  target.setUTCDate(Math.min(start.getUTCDate(), lastDay.getUTCDate()));
  return target.toISOString().slice(0, 10);
}
export function calculateIRRate(days: number): number {
  if (days <= 180) return 22.5;
  if (days <= 360) return 20;
  if (days <= 720) return 17.5;
  return 15;
}
// IOF percentage of earnings, applied before income tax.
const IOF = [
  100, 96, 93, 90, 86, 83, 80, 76, 73, 70, 66, 63, 60, 56, 53, 50, 46, 43, 40,
  36, 33, 30, 26, 23, 20, 16, 13, 10, 6, 3,
];
export function calculateInvestmentReturns(
  investment: Investment,
  cdiRate: number,
  elapsedDays?: number,
) {
  const days =
    elapsedDays ?? daysBetween(investment.purchaseDate, investment.endDate);
  // Constant-rate estimate: 252 business days/year, approximated by days * 252/365.
  const dailyRate = investment.isPercentOfCDI
    ? ((Math.pow(1 + cdiRate / 100, 1 / 252) - 1) * investment.rate) / 100
    : Math.pow(1 + investment.rate / 100, 1 / 252) - 1;
  const grossValue =
    investment.amount * Math.pow(1 + dailyRate, (days * 252) / 365);
  const grossReturn = Math.max(0, grossValue - investment.amount);
  const irRate = investment.type === "CDB" ? calculateIRRate(days) : 0;
  const iofAmount =
    investment.type === "CDB" && days < 30
      ? (grossReturn * IOF[Math.max(0, days)]) / 100
      : 0;
  const taxAmount = ((grossReturn - iofAmount) * irRate) / 100;
  const liquidReturn = grossReturn - taxAmount - iofAmount;
  return {
    days,
    grossValue,
    grossReturn,
    irRate,
    taxAmount,
    iofAmount,
    liquidReturn,
    liquidValue: investment.amount + liquidReturn,
    netPercent: (liquidReturn / investment.amount) * 100,
  };
}
