'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Sparkles, Package, ClipboardList, BarChart3, Eye } from 'lucide-react';
import { QGenGenerateTab } from './components/QGenGenerateTab';
import { QGenBatchTab } from './components/QGenBatchTab';
import { QGenExamTab } from './components/QGenExamTab';
import { QGenAnalyticsTab } from './components/QGenAnalyticsTab';
import { QGenReviewTab } from './components/QGenReviewTab';

type TabId = 'generate' | 'batch' | 'exam' | 'analytics' | 'review';

interface Tab {
  id: TabId;
  label: string;
  icon: ReactNode;
}

const TABS: Tab[] = [
  { id: 'generate', label: 'Gerar Questão', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'batch', label: 'Lote', icon: <Package className="w-4 h-4" /> },
  { id: 'exam', label: 'Prova Completa', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'analytics', label: 'Estatísticas', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'review', label: 'Revisão', icon: <Eye className="w-4 h-4" /> },
];

export default function QGenPage() {
  const [activeTab, setActiveTab] = useState<TabId>('generate');

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-label-secondary hover:text-label-primary text-sm mb-4 inline-flex items-center gap-2"
        >
          ← Voltar
        </Link>
        <h1 className="text-4xl font-bold text-label-primary mt-2">
          QGen <span className="text-emerald-500">DDL</span>
        </h1>
        <p className="text-label-secondary mt-2">
          Sistema de Geração de Questões com integração de Diagnóstico Diferencial de Lacunas
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-3 mb-6">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-emerald-500 border-b-2 border-emerald-500'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              <span className="mr-2 inline-flex">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-surface-2/50 shadow-elevation-1 rounded-xl p-6">
        {activeTab === 'generate' && <QGenGenerateTab />}
        {activeTab === 'batch' && <QGenBatchTab />}
        {activeTab === 'exam' && <QGenExamTab />}
        {activeTab === 'analytics' && <QGenAnalyticsTab />}
        {activeTab === 'review' && <QGenReviewTab />}
      </div>
    </main>
  );
}
