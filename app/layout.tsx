import type React from 'react';
import '@/app/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Comparador de Investimentos | CDB, LCI, LCA',
  description:
    'Compare diferentes opções de investimentos como CDB, LCI e LCA. Calcule rendimentos brutos e líquidos com base na taxa CDI atual.',
  keywords:
    'investimentos, CDB, LCI, comparação, renda fixa, CDI, simulador, calculadora, rendimento',
  authors: [{ name: 'Gabriel Trzimajewski', url: 'https://snowye.dev' }],
  openGraph: {
    title: 'Comparador de Investimentos | CDB, LCI, LCA',
    description:
      'Compare diferentes opções de investimentos como CDB, LCI, LCA. Calcule rendimentos brutos e líquidos.',
    type: 'website'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='pt-BR' suppressHydrationWarning>
      <body className={`${inter.className} dark`}>
        <ThemeProvider
          attribute='class'
          defaultTheme='dark'
          enableSystem={false}
          disableTransitionOnChange
          forcedTheme='dark'
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
