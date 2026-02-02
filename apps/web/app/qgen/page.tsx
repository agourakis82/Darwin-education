'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QGenGenerateTab } from './components/QGenGenerateTab';
import { QGenBatchTab } from './components/QGenBatchTab';
import { QGenExamTab } from './components/QGenExamTab';
import { QGenAnalyticsTab } from './components/QGenAnalyticsTab';
import { QGenReviewTab } from './components/QGenReviewTab';

type TabId = 'generate' | 'batch' | 'exam' | 'analytics' | 'review';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'generate', label: 'Gerar Questão', icon: '✨' },
  { id: 'batch', label: 'Lote', icon: '📦' },
  { id: 'exam', label: 'Prova Completa', icon: '📋' },
  { id: 'analytics', label: 'Estatísticas', icon: '📊' },
  { id: 'review', label: 'Revisão', icon: '👁️' },
];

export default function QGenPage() {
  const [activeTab, setActiveTab] = useState<TabId>('generate');

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-gray-400 hover:text-white text-sm mb-4 inline-flex items-center gap-2"
        >
          ← Voltar
        </Link>
        <h1 className="text-4xl font-bold text-white mt-2">
          QGen <span className="text-primary-500">DDL</span>
        </h1>
        <p className="text-gray-400 mt-2">
          Sistema de Geração de Questões com integração de Diagnóstico Diferencial de Lacunas
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700 mb-6">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        {activeTab === 'generate' && <QGenGenerateTab />}
        {activeTab === 'batch' && <QGenBatchTab />}
        {activeTab === 'exam' && <QGenExamTab />}
        {activeTab === 'analytics' && <QGenAnalyticsTab />}
        {activeTab === 'review' && <QGenReviewTab />}
      </div>
    </main>
  );
}
