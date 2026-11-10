import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assistente de Estoque — Cozinha Profissional",
  description: "Chatbot com IA que consulta e dá baixa no estoque da cozinha.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}