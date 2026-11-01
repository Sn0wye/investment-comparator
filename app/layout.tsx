import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const font = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font",
});

export const metadata: Metadata = {
  title: "Rende | Quanto fica com você",
  description:
    "Compare CDB, LCI e LCA pelo que sobra depois do imposto. Mude valor, prazo e taxas e veja o ranking mudar na hora. Tudo salvo no seu navegador.",
  openGraph: {
    title: "Rende | Quanto fica com você",
    description: "Compare renda fixa pelo valor líquido, na hora.",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={font.variable}>
      <body>{children}</body>
    </html>
  );
}
