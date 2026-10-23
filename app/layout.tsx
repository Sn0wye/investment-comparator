import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Rende | Comparador de investimentos",
  description:
    "Compare CDB, LCI e LCA pelo rendimento líquido. Simule prazos, taxas e impostos em uma comparação simples, salva no seu navegador.",
  openGraph: {
    title: "Rende | Comparador de investimentos",
    description:
      "Veja quanto fica com você. Compare renda fixa depois dos impostos.",
    locale: "pt_BR",
    type: "website",
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
