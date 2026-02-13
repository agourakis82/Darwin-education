'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Package, ClipboardList, BarChart3, Eye, ArrowLeft } from 'lucide-react';
import { QGenGenerateTab } from './components/QGenGenerateTab';
import { QGenBatchTab } from './components/QGenBatchTab';
import { QGenExamTab } from './components/QGenExamTab';
import { QGenAnalyticsTab } from './components/QGenAnalyticsTab';
import { QGenReviewTab } from './components/QGenReviewTab';
import { spring } from '@/lib/motion';

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

  const renderTab = () => {
    if (activeTab === 'generate') return <QGenGenerateTab />;
    if (activeTab === 'batch') return <QGenBatchTab />;
    if (activeTab === 'exam') return <QGenExamTab />;
    if (activeTab === 'analytics') return <QGenAnalyticsTab />;
    return <QGenReviewTab />;
  };

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 md:px-6">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
      >
        <Link
          href="/"
          className="darwin-focus-ring darwin-nav-link text-label-secondary hover:text-label-primary text-sm mb-4 inline-flex items-center gap-2 rounded-lg px-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="darwin-panel-strong border border-separator/80 p-5 md:p-6">
          <h1 className="text-3xl font-semibold text-label-primary md:text-4xl">
            QGen <span className="gradient-text">DDL</span>
          </h1>
          <p className="text-label-secondary mt-2">
            Sistema de Geração de Questões com integração de Diagnóstico Diferencial de Lacunas
          </p>
          <div className="darwin-image-tile relative mt-6 h-44 md:h-52">
            <Image
              src="/images/branding/qgen-hero-apple-v1.png"
              alt="Visual de geração inteligente de questões médicas"
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
              className="object-cover object-center opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-0/90 via-surface-0/65 to-surface-0/25" />
            <div className="relative z-10 h-full flex items-end p-5">
              <p className="text-sm md:text-base text-label-secondary max-w-lg">
                Gere itens com controles de qualidade e revisão em fluxo orientado por evidência.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="mb-6">
        <nav
          className="darwin-panel-strong flex gap-1 overflow-x-auto rounded-2xl border border-separator/75 p-1.5"
          aria-label="Seções do QGen"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`darwin-focus-ring darwin-nav-link relative inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium ${
                activeTab === tab.id
                  ? 'text-emerald-200'
                  : 'text-label-secondary hover:bg-surface-3/65 hover:text-label-primary'
              }`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {activeTab === tab.id ? (
                <motion.span
                  layoutId="qgen-tab-active"
                  transition={spring.snappy}
                  className="absolute inset-0 rounded-xl border border-emerald-500/35 bg-emerald-500/[0.16] shadow-inner-shine"
                  aria-hidden="true"
                />
              ) : null}
              <span className="relative z-[1] inline-flex">{tab.icon}</span>
              <span className="relative z-[1]">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="darwin-panel-strong rounded-2xl border border-separator/80 p-5 md:p-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={spring.snappy}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
