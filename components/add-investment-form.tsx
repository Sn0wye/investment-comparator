'use client';

import type React from 'react';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Investment } from '@/lib/types';
import { calculateIRRate } from '@/lib/calculations';

interface AddInvestmentFormProps {
  onAdd: (investment: Investment) => void;
  onCancel: () => void;
  cdiRate: number;
}

export default function AddInvestmentForm({
  onAdd,
  onCancel,
  cdiRate
}: AddInvestmentFormProps) {
  // Set default end date to 1 year from now
  const defaultEndDate = new Date();
  defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);

  const [investment, setInvestment] = useState<Investment>({
    id: '',
    name: '',
    type: 'CDB',
    rate: 100,
    isPercentOfCDI: true,
    amount: 10000,
    endDate: defaultEndDate,
    ir: 20 // Default for 1 year
  });

  const [dateInputValue, setDateInputValue] = useState(
    format(defaultEndDate, 'dd/MM/yyyy')
  );
  const [amountError, setAmountError] = useState('');

  const handleChange = (field: keyof Investment, value: any) => {
    setInvestment({ ...investment, [field]: value });

    // Update IR based on investment type and end date
    if (field === 'type' && value === 'LCI/LCA') {
      setInvestment(prev => ({ ...prev, [field]: value, ir: 0 }));
    } else if (field === 'type' && value === 'CDB') {
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

      // Set IR rate based on calculated months
      const irRate = calculateIRRate(months);
      setInvestment(prev => ({ ...prev, [field]: value, ir: irRate }));
    } else if (field === 'endDate' && investment.type === 'CDB') {
      // Calculate months between now and new end date
      const today = new Date();
      const endDate = new Date(value);
      const months = Math.max(
        1,
        Math.ceil(
          (endDate.getFullYear() - today.getFullYear()) * 12 +
            (endDate.getMonth() - today.getMonth()) +
            (endDate.getDate() >= today.getDate() ? 0 : -1)
        )
      );

      // Set IR rate based on calculated months
      const irRate = calculateIRRate(months);
      setInvestment(prev => ({ ...prev, [field]: value, ir: irRate }));

      // Update date input value
      setDateInputValue(format(value, 'dd/MM/yyyy'));
    } else if (field === 'amount') {
      // Validate amount is not zero
      if (value === 0) {
        setAmountError('O valor não pode ser zero');
      } else {
        setAmountError('');
      }
      setInvestment(prev => ({ ...prev, [field]: value }));
    } else if (field === 'isPercentOfCDI') {
      // When changing between fixed and post-fixed, adjust the rate to a sensible default
      if (value === true) {
        // If switching to post-fixed (% of CDI), set to 100% of CDI
        setInvestment(prev => ({ ...prev, [field]: value, rate: 100 }));
      } else {
        // If switching to fixed (% per year), set to current CDI rate
        setInvestment(prev => ({ ...prev, [field]: value, rate: cdiRate }));
      }
    } else {
      setInvestment(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDateInputValue(inputValue);

    // Try to parse the date
    const parsedDate = parse(inputValue, 'dd/MM/yyyy', new Date());

    // If valid date and in the future, update the investment state
    if (isValid(parsedDate) && parsedDate > new Date()) {
      handleChange('endDate', parsedDate);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate amount before submitting
    if (investment.amount === 0) {
      setAmountError('O valor não pode ser zero');
      return;
    }

    onAdd(investment);
  };

  return (
    <Card className='w-full max-w-2xl mx-auto border-neutral-200 dark:border-neutral-800'>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Adicionar Novo Investimento</CardTitle>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Nome do Investimento</Label>
              <Input
                id='name'
                value={investment.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder='ex: CDB Banco XYZ'
                required
                className='border-neutral-200 dark:border-neutral-700 focus:border-neutral-300 dark:focus:border-neutral-500'
              />
            </div>

            <div className='space-y-2'>
              <Label>Tipo de Investimento</Label>
              <RadioGroup
                value={investment.type}
                onValueChange={value => handleChange('type', value)}
                className='flex gap-4'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='CDB' id='cdb' />
                  <Label htmlFor='cdb'>CDB</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='LCI/LCA' id='lci/lca' />
                  <Label htmlFor='lci/lca'>LCI/LCA</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='amount'>Valor Inicial (R$)</Label>
              <Input
                id='amount'
                type='number'
                value={investment.amount}
                onChange={e =>
                  handleChange('amount', Number.parseFloat(e.target.value))
                }
                min='0.01'
                step='any'
                required
                className={cn(
                  'border-neutral-200 dark:border-neutral-700 focus:border-neutral-300 dark:focus:border-neutral-500',
                  amountError && 'border-red-500'
                )}
              />
              {amountError && (
                <p className='text-xs text-red-500'>{amountError}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='endDate'>Data de Vencimento</Label>
              <div className='flex gap-2'>
                <Input
                  id='dateInput'
                  value={dateInputValue}
                  onChange={handleDateInputChange}
                  placeholder='DD/MM/AAAA'
                  className='border-neutral-200 dark:border-neutral-700 focus:border-neutral-300 dark:focus:border-neutral-500'
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className='border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-500'
                      type='button'
                    >
                      <CalendarIcon className='h-4 w-4' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0 border-neutral-200 dark:border-neutral-700'>
                    <Calendar
                      mode='single'
                      selected={investment.endDate}
                      onSelect={date => date && handleChange('endDate', date)}
                      initialFocus
                      disabled={date => date < new Date()}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <Label>Modalidade de Rendimento</Label>
            <div className='grid grid-cols-2 gap-2'>
              <Button
                type='button'
                variant={investment.isPercentOfCDI ? 'outline' : 'default'}
                className={cn(
                  'border-neutral-200 dark:border-neutral-700',
                  !investment.isPercentOfCDI && 'bg-primary',
                  investment.isPercentOfCDI && 'bg-transparent hover:bg-accent'
                )}
                onClick={() => handleChange('isPercentOfCDI', false)}
              >
                Prefixado
              </Button>
              <Button
                type='button'
                variant={investment.isPercentOfCDI ? 'default' : 'outline'}
                className={cn(
                  'border-neutral-200 dark:border-neutral-700',
                  investment.isPercentOfCDI && 'bg-primary',
                  !investment.isPercentOfCDI && 'bg-transparent hover:bg-accent'
                )}
                onClick={() => handleChange('isPercentOfCDI', true)}
              >
                Pós-Fixado (CDI)
              </Button>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='rate'>
              {investment.isPercentOfCDI
                ? `Taxa (% do CDI atual de ${cdiRate.toFixed(2)}%)`
                : 'Taxa (% ao ano)'}
            </Label>
            <Input
              id='rate'
              type='number'
              value={investment.rate}
              onChange={e =>
                handleChange('rate', Number.parseFloat(e.target.value))
              }
              min='0.01'
              step='0.01'
              required
              className='border-neutral-200 dark:border-neutral-700 focus:border-neutral-300 dark:focus:border-neutral-500'
            />
          </div>

          {investment.type === 'CDB' && (
            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <Label htmlFor='ir'>Imposto de Renda (%)</Label>
                <span className='text-sm text-muted-foreground'>
                  Calculado automaticamente pela duração
                </span>
              </div>
              <Input
                id='ir'
                type='number'
                value={investment.ir}
                readOnly
                className='bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 cursor-not-allowed'
              />
              <p className='text-xs text-muted-foreground'>
                Até 6 meses: 22,5%, Até 12 meses: 20%, Até 24 meses: 17,5%,
                Acima de 24 meses: 15%
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className='flex justify-between border-t border-neutral-200 dark:border-neutral-800 pt-4'>
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            className='border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-500'
          >
            Cancelar
          </Button>
          <Button type='submit'>Adicionar Investimento</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
