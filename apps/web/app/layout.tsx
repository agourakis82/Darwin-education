import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/Navigation';

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
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  );
}
