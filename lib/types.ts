export interface Investment {
  id: string;
  name: string;
  type: "CDB" | "LCI/LCA";
  rate: number;
  isPercentOfCDI: boolean;
  amount: number;
  purchaseDate: string;
  endDate: string;
}
export interface Scenario {
  version: 1;
  investments: Investment[];
  cdiRate: number;
  amount: number;
  months: number;
  startDate: string;
}
