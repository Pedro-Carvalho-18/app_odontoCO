"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function SystemHealth() {
  useEffect(() => {
    // Ao iniciar o app, chama o health check para garantir migrações do banco
    fetch("/api/health").catch(console.error);

    // Carregar tema preferido
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Carregar tamanho da tela preferido (se estiver no Electron)
    const savedSize = localStorage.getItem('windowSize');
    if (savedSize && typeof window !== 'undefined' && (window as any).require) {
      try {
        const [w, h] = savedSize.split('x').map(Number);
        if (w && h) {
          const electron = (window as any).require('electron');
          electron.ipcRenderer.send('resize-window', w, h);
        }
      } catch (err) {
        console.error("Erro ao aplicar tamanho de tela inicial:", err);
      }
    }
  }, []);
  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <title>OdontOC - Gestão Odontológica</title>
        <meta name="description" content="Sistema de gestão para clínicas odontológicas" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        <SystemHealth />
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 h-full">
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
