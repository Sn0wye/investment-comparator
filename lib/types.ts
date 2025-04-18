export interface Investment {
  id: string;
  name: string;
  type: 'CDB' | 'LCI/LCA';
  rate: number;
  isPercentOfCDI: boolean;
  amount: number;
  purchaseDate: Date;
  endDate: Date;
  ir: number;
}

export interface InvestmentReturns {
  grossValue: number;
  liquidValue: number;
  grossReturn: number;
  liquidReturn: number;
  months: number;
}
