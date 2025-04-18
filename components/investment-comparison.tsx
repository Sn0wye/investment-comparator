'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';
import { useMobile } from '@/hooks/use-mobile';
import AppHeader from '@/components/app-header';
import InvestmentCard from '@/components/investment-card';
import AddInvestmentForm from '@/components/add-investment-form';
import type { Investment } from '@/lib/types';

export default function InvestmentComparison() {
  // Inicialize os estados com null para evitar diferenças de hidratação
  const [investments, setInvestments] = useState<Investment[] | null>(null);
  const [cdiRate, setCdiRate] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const isMobile = useMobile();

  // Set default dates
  const today = new Date();
  const defaultEndDate = new Date();
  defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);

  // Marque que estamos no cliente e inicialize os estados
  useEffect(() => {
    setIsClient(true);

    // Inicialize o CDI rate
    const savedCdiRate = localStorage.getItem('cdiRate');
    if (savedCdiRate) {
      try {
        setCdiRate(Number.parseFloat(savedCdiRate));
      } catch (error) {
        console.error('Erro ao carregar taxa CDI:', error);
        setCdiRate(10.65);
      }
    } else {
      setCdiRate(10.65);
    }

    // Inicialize os investimentos
    const savedInvestments = localStorage.getItem('investments');
    if (savedInvestments) {
      try {
        const parsedInvestments = JSON.parse(savedInvestments);
        // Convert string dates back to Date objects
        const processedInvestments = parsedInvestments.map((inv: any) => ({
          ...inv,
          purchaseDate: new Date(inv.purchaseDate || today),
          endDate: new Date(inv.endDate)
        }));
        setInvestments(processedInvestments);
      } catch (error) {
        console.error('Erro ao carregar investimentos:', error);
      }
    }
  }, []);

  // Save investments to localStorage whenever they change
  useEffect(() => {
    if (investments) {
      localStorage.setItem('investments', JSON.stringify(investments));
    }
  }, [investments]);

  // Save CDI rate to localStorage whenever it changes
  useEffect(() => {
    if (cdiRate !== null) {
      localStorage.setItem('cdiRate', cdiRate.toString());
    }
  }, [cdiRate]);

  const handleAddInvestment = (investment: Investment) => {
    if (investments) {
      setInvestments([
        ...investments,
        {
          ...investment,
          id: Math.random().toString(36).substring(2, 9)
        }
      ]);
    }
    setShowAddForm(false);
  };

  const handleRemoveInvestment = (id: string) => {
    if (investments) {
      setInvestments(investments.filter(inv => inv.id !== id));
    }
  };

  // Renderize um estado de carregamento até que o cliente esteja pronto
  if (!isClient || investments === null || cdiRate === null) {
    return (
      <div className='container mx-auto py-8 px-4 flex justify-center items-center min-h-[50vh]'>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning>
      <AppHeader cdiRate={cdiRate} onCdiRateChange={setCdiRate} />

      <div className='container mx-auto px-4 pb-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
          {investments.map(investment => (
            <InvestmentCard
              key={investment.id}
              investment={investment}
              cdiRate={cdiRate}
              onRemove={() => handleRemoveInvestment(investment.id)}
            />
          ))}

          <Button
            variant='outline'
            className='h-[300px] border-dashed border-neutral-200 dark:border-neutral-700 flex flex-col gap-2 hover:border-neutral-300 dark:hover:border-neutral-500'
            onClick={() => setShowAddForm(true)}
          >
            <Plus className='h-8 w-8' />
            <span>Adicionar Investimento</span>
          </Button>
        </div>

        {isMobile ? (
          <Drawer open={showAddForm} onOpenChange={setShowAddForm}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Adicionar Novo Investimento</DrawerTitle>
              </DrawerHeader>
              <AddInvestmentForm
                onAdd={handleAddInvestment}
                onCancel={() => setShowAddForm(false)}
                cdiRate={cdiRate}
              />
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogContent className='sm:max-w-[600px] p-0'>
              <DialogHeader className='px-6 pt-6'>
                <DialogTitle>Adicionar Novo Investimento</DialogTitle>
              </DialogHeader>
              <AddInvestmentForm
                onAdd={handleAddInvestment}
                onCancel={() => setShowAddForm(false)}
                cdiRate={cdiRate}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
