import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { BottomNav } from '@/components/BottomNav';
import { ToastProvider } from '@/components/ui/Toast';
import { PageTransition } from '@/components/ui/PageTransition';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Darwin Education - ENAMED Prep',
  description:
    'Plataforma de preparação para o ENAMED (Exame Nacional de Avaliação da Formação Médica)',
  keywords: ['ENAMED', 'medicina', 'prova', 'residência', 'educação médica'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        <ToastProvider>
          <div className="min-h-screen bg-surface-0">
            {/* Atmosphere gradient — subtle emerald/purple glow */}
            <div className="fixed inset-0 bg-gradient-to-br from-emerald-950/10 via-transparent to-purple-950/5 pointer-events-none" aria-hidden="true" />
            <div className="relative bg-gradient-to-b from-surface-1 to-surface-0 min-h-screen">
              <Navigation />
              <main id="main-content" className="pb-16 md:pb-0">
                <PageTransition>{children}</PageTransition>
              </main>
              <BottomNav />
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
