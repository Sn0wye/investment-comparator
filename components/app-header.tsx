'use client';

import type React from 'react';

import { useState } from 'react';
import { PiggyBank, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AppHeaderProps {
  cdiRate: number;
  onCdiRateChange: (newRate: number) => void;
}

export default function AppHeader({
  cdiRate,
  onCdiRateChange
}: AppHeaderProps) {
  const [editingCdi, setEditingCdi] = useState(false);

  const handleCdiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      onCdiRateChange(value);
    }
  };

  return (
    <header className='border-b border-neutral-800 py-4 px-4 mb-6'>
      <div className='container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4'>
        <div className='flex items-center gap-3'>
          <PiggyBank className='h-8 w-8 text-primary' />
          <h1 className='text-2xl font-bold'>Comparador de Investimentos</h1>
        </div>

        <div className='flex items-center gap-2 bg-neutral-900 px-4 py-2 rounded-md border border-neutral-800'>
          <span className='text-sm text-muted-foreground mr-2'>Taxa CDI:</span>

          {editingCdi ? (
            <div className='flex items-center'>
              <Input
                type='number'
                value={cdiRate}
                onChange={handleCdiChange}
                className='w-20 h-8 text-right border-neutral-700'
                step='0.01'
                min='0.01'
              />
              <span className='ml-1'>%</span>
              <Button
                size='sm'
                className='ml-2 h-8'
                onClick={() => setEditingCdi(false)}
              >
                Salvar
              </Button>
            </div>
          ) : (
            <div className='flex items-center'>
              <span className='font-bold'>{cdiRate.toFixed(2)}%</span>
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6 ml-1'
                onClick={() => setEditingCdi(true)}
              >
                <Edit className='h-3 w-3' />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
