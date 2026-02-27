'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { spring } from '@/lib/motion'
import { ChevronDown } from 'lucide-react'

const faqItems = [
  {
    question: 'O que é Darwin Education?',
    answer:
      'Darwin Education é uma plataforma de preparação para o ENAMED (Exame Nacional de Avaliação da Formação Médica) que utiliza simulados adaptativos com pontuação TRI 3PL, flashcards com repetição espaçada FSRS v4, diagnóstico de lacunas por IA e modelos diagnósticos cognitivos (CDM) — tudo calibrado para a estrutura real do exame.',
  },
  {
    question: 'Como funciona a pontuação TRI?',
    answer:
      'A Teoria da Resposta ao Item (TRI) com modelo logístico de 3 parâmetros mede sua habilidade real, não apenas o número de acertos. Cada questão tem dificuldade (b), discriminação (a) e probabilidade de acerto ao acaso (c). Sua habilidade (theta) é estimada via Expected A Posteriori (EAP) e convertida para uma escala de 0 a 1000, onde 600 é o limiar de aprovação — a mesma metodologia usada no ENAMED oficial.',
  },
  {
    question: 'O que é FSRS? Como os flashcards se adaptam?',
    answer:
      'FSRS (Free Spaced Repetition Scheduler) v4 é o algoritmo de repetição espaçada mais avançado disponível. Ele calcula o intervalo ideal de revisão para cada cartão individualmente, baseado no seu histórico de recordação. Cartões que você domina aparecem com menos frequência; cartões difíceis são revisados mais vezes. O resultado: melhor retenção com menos tempo de estudo.',
  },
  {
    question: 'É gratuito? O que tem no Darwin Pro?',
    answer:
      'O plano gratuito inclui simulados com pontuação TRI, flashcards FSRS ilimitados, trilhas de estudo completas, conteúdo médico (368 doenças CID-10 + 690 medicamentos ATC) e painel de desempenho. O Darwin Pro (em breve) adicionará simulado adaptativo (CAT), diagnóstico de lacunas (DDL), orientação por IA, geração de questões (QGen), raciocínio clínico fractal (FCR) e analytics avançado.',
  },
  {
    question: 'Quantas questões estão disponíveis?',
    answer:
      'A plataforma conta com mais de 3.800 questões calibradas com parâmetros IRT (dificuldade, discriminação, acerto ao acaso), todas mapeadas por área ENAMED, CID-10 e códigos ATC. As questões passam por um pipeline de validação multi-LLM com taxa de convergência de 90,5%.',
  },
  {
    question: 'Meus dados são privados e seguros?',
    answer:
      'Sim. Utilizamos Row-Level Security (RLS) no PostgreSQL, garantindo que cada usuário acesse apenas seus próprios dados. Toda comunicação é criptografada via HTTPS. Não vendemos nem compartilhamos dados com terceiros. A plataforma é compatível com a LGPD (Lei Geral de Proteção de Dados).',
  },
  {
    question: 'Minha instituição pode usar o Darwin Education?',
    answer:
      'Sim. Oferecemos contas institucionais com analytics de coorte, gestão de turmas e exportação de dados para pesquisa acadêmica. Coordenadores podem acompanhar o desempenho de todos os alunos em tempo real, identificar estudantes em risco e alinhar o currículo às competências do ENAMED.',
  },
  {
    question: 'Em quais dispositivos funciona?',
    answer:
      'Darwin Education é uma aplicação web progressiva (PWA) acessível em qualquer navegador moderno — desktop, tablet e celular. O layout é responsivo e otimizado para todas as resoluções. Um app nativo para iOS está em desenvolvimento.',
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="px-4 pb-16 md:px-6">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={spring.gentle}
          className="mb-6 text-center"
        >
          <span className="inline-block rounded-full border border-separator/60 bg-surface-1/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.1em] text-tertiary-label">
            FAQ
          </span>
          <h2 className="mt-4 text-2xl font-semibold text-label md:text-3xl">
            Perguntas frequentes
          </h2>
        </motion.div>

        <motion.div
          className="space-y-2"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.05 } },
          }}
        >
          {faqItems.map((faq, index) => {
            const isOpen = openIndex === index

            return (
              <motion.div
                key={index}
                variants={item}
                className="rounded-2xl border border-separator/60 bg-surface-1/50 transition-colors duration-ios-fast hover:bg-surface-1/80"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-darwin-emerald/50 focus-visible:rounded-2xl"
                  aria-expanded={isOpen}
                >
                  <span className="pr-4 text-sm font-medium text-label">{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-tertiary-label transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4">
                        <p className="text-sm leading-relaxed text-secondary-label">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: spring.gentle },
}
