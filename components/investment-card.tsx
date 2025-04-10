"use client"

import { X } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Investment } from "@/lib/types"
import { calculateInvestmentReturns } from "@/lib/calculations"

interface InvestmentCardProps {
  investment: Investment
  cdiRate: number
  onRemove: () => void
}

export default function InvestmentCard({ investment, cdiRate, onRemove }: InvestmentCardProps) {
  const { grossValue, liquidValue, grossReturn, liquidReturn, months } = calculateInvestmentReturns(investment, cdiRate)

  // Format the end date
  const endDate = new Date(investment.endDate)
  const formattedEndDate = endDate.toLocaleDateString("pt-BR")

  return (
    <Card className="relative border-neutral-800">
      <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-8 w-8" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>

      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{investment.name}</CardTitle>
          <Badge variant={investment.type === "CDB" ? "default" : "secondary"}>{investment.type}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Valor Inicial</p>
            <p className="font-medium">R$ {investment.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Data de Vencimento</p>
            <p className="font-medium">{formattedEndDate}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Taxa</p>
            <p className="font-medium">
              {investment.rate}% {investment.isPercentOfCDI ? "do CDI" : "ao ano"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Duração</p>
            <p className="font-medium">{months} meses</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Imposto de Renda</p>
          <p className="font-medium">{investment.ir}%</p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-stretch border-t border-neutral-800 pt-4">
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div>
            <p className="text-sm text-muted-foreground">Rendimento Bruto</p>
            <p className="font-medium text-green-500">
              R$ {grossReturn.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Rendimento Líquido</p>
            <p className="font-medium text-green-500">
              R$ {liquidReturn.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Valor Bruto</p>
            <p className="font-semibold">R$ {grossValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor Líquido</p>
            <p className="font-semibold">R$ {liquidValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
