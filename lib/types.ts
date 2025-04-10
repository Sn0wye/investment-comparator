export interface Investment {
  id: string
  name: string
  type: "CDB" | "LCI"
  rate: number
  isPercentOfCDI: boolean
  amount: number
  endDate: Date
  ir: number
}

export interface InvestmentReturns {
  grossValue: number
  liquidValue: number
  grossReturn: number
  liquidReturn: number
  months: number
}
