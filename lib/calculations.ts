import type { Investment, InvestmentReturns } from './types';

export function calculateInvestmentReturns(
  investment: Investment,
  cdiRate: number
): InvestmentReturns {
  // Calculate months between now and end date
  const today = new Date();
  const endDate = new Date(investment.endDate);
  const months = Math.max(
    1,
    Math.ceil(
      (endDate.getFullYear() - today.getFullYear()) * 12 +
        (endDate.getMonth() - today.getMonth()) +
        (endDate.getDate() >= today.getDate() ? 0 : -1)
    )
  );

  // Calculate the effective annual rate
  let annualRate: number;

  if (investment.isPercentOfCDI) {
    // If rate is a percentage of CDI
    annualRate = (investment.rate / 100) * cdiRate;
  } else {
    // If rate is a direct percentage
    annualRate = investment.rate;
  }

  // Convert annual rate to monthly rate
  const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;

  // Calculate gross future value using compound interest formula
  const grossValue = investment.amount * Math.pow(1 + monthlyRate, months);
  const grossReturn = grossValue - investment.amount;

  // Calculate income tax on returns (if applicable)
  const taxAmount =
    investment.type === 'LCI/LCA' ? 0 : grossReturn * (investment.ir / 100);

  // Calculate liquid value and return
  const liquidValue = grossValue - taxAmount;
  const liquidReturn = liquidValue - investment.amount;

  return {
    grossValue,
    liquidValue,
    grossReturn,
    liquidReturn,
    months
  };
}

// Calculate IR rate based on investment duration in months
export function calculateIRRate(months: number): number {
  if (months <= 6) return 22.5;
  if (months <= 12) return 20;
  if (months <= 24) return 17.5;
  return 15;
}
