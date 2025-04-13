'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { CardContent, CardFooter } from '@/components/ui/card';
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
import {
  format,
  parse,
  isValid,
  addMonths,
  addYears,
  startOfDay
} from 'date-fns';
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
  // Set default dates
  const today = startOfDay(new Date());
  const defaultEndDate = new Date();
  defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);

  const [investment, setInvestment] = useState<Investment>({
    id: '',
    name: '',
    type: 'CDB',
    rate: 100,
    isPercentOfCDI: true,
    amount: 10000,
    purchaseDate: today,
    endDate: defaultEndDate,
    ir: 20 // Default for 1 year
  });

  const [purchaseDateInputValue, setPurchaseDateInputValue] = useState(
    format(today, 'dd/MM/yyyy')
  );
  const [endDateInputValue, setEndDateInputValue] = useState(
    format(defaultEndDate, 'dd/MM/yyyy')
  );
  const [amountError, setAmountError] = useState('');
  const [isTodaySelected, setIsTodaySelected] = useState(true);

  // Check if purchase date is today
  useEffect(() => {
    const currentDate = startOfDay(new Date());
    const purchaseDate = startOfDay(new Date(investment.purchaseDate));

    // Compare dates without time
    setIsTodaySelected(
      currentDate.getDate() === purchaseDate.getDate() &&
        currentDate.getMonth() === purchaseDate.getMonth() &&
        currentDate.getFullYear() === purchaseDate.getFullYear()
    );
  }, [investment.purchaseDate]);

  const handleChange = (field: keyof Investment, value: any) => {
    const updatedInvestment = { ...investment, [field]: value };
    setInvestment(updatedInvestment);

    // Update IR based on investment type and dates
    if (field === 'type' && value === 'LCI/LCA') {
      setInvestment({ ...updatedInvestment, ir: 0 });
    } else if (field === 'type' && value === 'CDB') {
      updateIRRate(
        updatedInvestment.endDate,
        updatedInvestment.purchaseDate,
        updatedInvestment
      );
    } else if (
      (field === 'endDate' || field === 'purchaseDate') &&
      updatedInvestment.type === 'CDB'
    ) {
      updateIRRate(
        field === 'endDate' ? value : updatedInvestment.endDate,
        field === 'purchaseDate' ? value : updatedInvestment.purchaseDate,
        updatedInvestment
      );
    } else if (field === 'amount') {
      // Validate amount is not zero
      if (value === 0) {
        setAmountError('O valor não pode ser zero');
      } else {
        setAmountError('');
      }
    } else if (field === 'isPercentOfCDI') {
      // When changing between fixed and post-fixed, adjust the rate to a sensible default
      if (value === true) {
        // If switching to post-fixed (% of CDI), set to 100% of CDI
        setInvestment({ ...updatedInvestment, rate: 100 });
      } else {
        // If switching to fixed (% per year), set to current CDI rate
        setInvestment({ ...updatedInvestment, rate: cdiRate });
      }
    }
  };

  const updateIRRate = (
    endDate: Date,
    purchaseDate: Date,
    currentInvestment = investment
  ) => {
    // Calculate months between purchase date and end date
    const start = new Date(purchaseDate);
    const end = new Date(endDate);
    const months = Math.max(
      1,
      Math.ceil(
        (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth()) +
          (end.getDate() >= start.getDate() ? 0 : -1)
      )
    );

    // Set IR rate based on calculated months
    const irRate = calculateIRRate(months);
    setInvestment({ ...currentInvestment, ir: irRate });
  };

  const handlePurchaseDateInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const inputValue = e.target.value;
    setPurchaseDateInputValue(inputValue);

    // Only update the date if the format is complete
    if (inputValue.length === 10) {
      try {
        const parsedDate = parse(inputValue, 'dd/MM/yyyy', new Date());

        // If valid date, update the investment state
        if (isValid(parsedDate)) {
          const normalizedDate = startOfDay(parsedDate);
          handleChange('purchaseDate', normalizedDate);
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    }
  };

  const handleEndDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setEndDateInputValue(inputValue);

    // Only update the date if the format is complete
    if (inputValue.length === 10) {
      try {
        const parsedDate = parse(inputValue, 'dd/MM/yyyy', new Date());

        // If valid date and after purchase date, update the investment state
        if (isValid(parsedDate) && parsedDate > investment.purchaseDate) {
          const normalizedDate = startOfDay(parsedDate);
          handleChange('endDate', normalizedDate);
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate amount before submitting
    if (investment.amount === 0) {
      setAmountError('O valor não pode ser zero');
      return;
    }

    // Validate end date is after purchase date
    if (investment.endDate <= investment.purchaseDate) {
      alert('A data de vencimento deve ser posterior à data de compra');
      return;
    }

    onAdd(investment);
  };

  const setToday = () => {
    const today = startOfDay(new Date());
    handleChange('purchaseDate', today);
    setPurchaseDateInputValue(format(today, 'dd/MM/yyyy'));
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className='space-y-4 px-6'>
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
            <Label htmlFor='purchaseDate'>Data de Compra</Label>
            <div className='grid grid-cols-[1fr,40px,80px] gap-2'>
              <Input
                id='purchaseDateInput'
                value={purchaseDateInputValue}
                onChange={handlePurchaseDateInputChange}
                placeholder='DD/MM/AAAA'
                className='border-neutral-200 dark:border-neutral-700 focus:border-neutral-300 dark:focus:border-neutral-500'
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className='border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-500 w-10 px-0'
                    type='button'
                  >
                    <CalendarIcon className='h-4 w-4' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0 border-neutral-200 dark:border-neutral-700'>
                  <Calendar
                    mode='single'
                    selected={investment.purchaseDate}
                    onSelect={date => {
                      if (date) {
                        const normalizedDate = startOfDay(date);
                        handleChange('purchaseDate', normalizedDate);
                        setPurchaseDateInputValue(
                          format(normalizedDate, 'dd/MM/yyyy')
                        );
                      }
                    }}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <Button
                type='button'
                variant={isTodaySelected ? 'default' : 'outline'}
                className={cn(
                  'w-20 h-10 whitespace-nowrap',
                  !isTodaySelected &&
                    'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-500'
                )}
                onClick={setToday}
                disabled={isTodaySelected}
              >
                Hoje
              </Button>
            </div>
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='endDate'>Data de Vencimento</Label>
          <div className='grid grid-cols-[1fr,40px] gap-2'>
            <Input
              id='endDateInput'
              value={endDateInputValue}
              onChange={handleEndDateInputChange}
              placeholder='DD/MM/AAAA'
              className='border-neutral-200 dark:border-neutral-700 focus:border-neutral-300 dark:focus:border-neutral-500'
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className='border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-500 w-10 px-0'
                  type='button'
                >
                  <CalendarIcon className='h-4 w-4' />
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0 border-neutral-200 dark:border-neutral-700'>
                <Calendar
                  mode='single'
                  selected={investment.endDate}
                  onSelect={date => {
                    if (date) {
                      const normalizedDate = startOfDay(date);
                      handleChange('endDate', normalizedDate);
                      setEndDateInputValue(
                        format(normalizedDate, 'dd/MM/yyyy')
                      );
                    }
                  }}
                  initialFocus
                  disabled={date => date <= investment.purchaseDate}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className='flex flex-wrap gap-2 mt-2'>
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-500'
              onClick={() => {
                const newDate = addMonths(investment.purchaseDate, 6);
                handleChange('endDate', newDate);
                setEndDateInputValue(format(newDate, 'dd/MM/yyyy'));
              }}
            >
              6 meses
            </Button>
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-500'
              onClick={() => {
                const newDate = addYears(investment.purchaseDate, 1);
                handleChange('endDate', newDate);
                setEndDateInputValue(format(newDate, 'dd/MM/yyyy'));
              }}
            >
              1 ano
            </Button>
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-500'
              onClick={() => {
                const newDate = addYears(investment.purchaseDate, 2);
                handleChange('endDate', newDate);
                setEndDateInputValue(format(newDate, 'dd/MM/yyyy'));
              }}
            >
              2 anos
            </Button>
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-500'
              onClick={() => {
                const newDate = addYears(investment.purchaseDate, 3);
                handleChange('endDate', newDate);
                setEndDateInputValue(format(newDate, 'dd/MM/yyyy'));
              }}
            >
              3 anos
            </Button>
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

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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

          {investment.type === 'CDB' ? (
            <div className='space-y-2'>
              <Label htmlFor='ir'>Imposto de Renda (%)</Label>
              <Input
                id='ir'
                type='number'
                value={investment.ir}
                readOnly
                className='bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 cursor-not-allowed'
              />
            </div>
          ) : (
            <div className='space-y-2 md:block hidden'>
              {/* Empty space to maintain alignment when there's no IR */}
            </div>
          )}
        </div>

        {investment.type === 'CDB' && (
          <p className='text-xs text-muted-foreground'>
            Até 6 meses: 22,5%, Até 12 meses: 20%, Até 24 meses: 17,5%, Acima de
            24 meses: 15%
          </p>
        )}
      </CardContent>

      <CardFooter className='flex justify-between border-t border-neutral-200 dark:border-neutral-800 pt-4 px-6 pb-6'>
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
  );
}
