'use client'

import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { spring } from '@/lib/motion'
import {
  Timer,
  Brain,
  Network,
  HelpCircle,
  Users,
  CalendarDays,
  ArrowLeft,
  BookOpen,
  Lightbulb,
  ListChecks,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { PomodoroTimer } from '../pomodoro/components/PomodoroTimer'
import { WeeklyPlanner } from '../gestao-tempo/components/WeeklyPlanner'

interface MethodContent {
  title: string
  icon: ReactNode
  color: 'emerald' | 'purple'
  base_cientifica: string
  passo_a_passo: string[]
  dicas_enamed: string
  relatedHref?: string
  relatedLabel?: string
  tool?: 'pomodoro' | 'planner'
}

const METHODS: Record<string, MethodContent> = {
  pomodoro: {
    title: 'Técnica Pomodoro',
    icon: <Timer className="w-6 h-6" />,
    color: 'emerald',
    base_cientifica:
      'A Técnica Pomodoro, desenvolvida por Francesco Cirillo na década de 1980, baseia-se no princípio de que intervalos curtos de foco intenso melhoram a concentração e reduzem a fadiga mental. Estudos em neurociência demonstram que o cérebro humano mantém alta performance por cerca de 25 minutos antes de necessitar de pausas para restaurar a atenção. Para estudantes de medicina, que lidam com volumes extensos de conteúdo clínico, essa técnica otimiza o aprendizado ao dividir sessões longas em ciclos gerenciáveis, prevenindo o esgotamento e promovendo retenção de informações como anatomia e fisiopatologia. A base científica apoia-se em evidências de que pausas regulares ativam o sistema de recompensa dopaminérgico, aumentando a motivação para tarefas complexas.',
    passo_a_passo: [
      'Escolha uma tarefa específica, como revisar um capítulo de farmacologia.',
      'Defina um timer para 25 minutos de foco absoluto, sem interrupções.',
      'Trabalhe intensamente até o alarme soar.',
      'Realize uma pausa de 5 minutos para alongar-se ou hidratar-se.',
      'Após quatro ciclos, faça uma pausa longa de 15-30 minutos.',
      'Registre o número de pomodoros completados para monitorar o progresso.',
    ],
    dicas_enamed:
      'Para o ENAMED, aplique a técnica em blocos de estudo de casos clínicos ou questões de residência. Foque em áreas fracas, como semiologia, por 25 minutos, e use pausas para revisar respostas erradas. Integre o timer abaixo para rastrear tempo, ajudando a cobrir os 5 eixos do exame (clínica, cirurgia, pediatria, ginecologia e saúde coletiva) de forma equilibrada, maximizando a eficiência em maratonas de estudo pré-prova.',
    tool: 'pomodoro',
  },
  'revisao-espacada': {
    title: 'Revisão Espaçada',
    icon: <Brain className="w-6 h-6" />,
    color: 'purple',
    base_cientifica:
      'A Revisão Espaçada, inspirada na curva do esquecimento de Hermann Ebbinghaus (1885) e aprimorada pelo algoritmo SM-2 de Piotr Wozniak nos anos 1980, explora o espaçamento de revisões para otimizar a memória de longo prazo. Ebbinghaus demonstrou que o esquecimento ocorre rapidamente sem reforço, mas intervalos crescentes fortalecem sinapses neurais. Para estudantes de medicina, isso é ideal para reter fatos como dosagens de medicamentos, critérios diagnósticos e protocolos terapêuticos, pois o SM-2 ajusta intervalos com base na facilidade de recall. Meta-análises em educação médica mostram ganhos de até 200% na retenção comparado a estudo massivo.',
    passo_a_passo: [
      'Crie flashcards com perguntas e respostas sobre tópicos médicos.',
      'Revise diariamente, classificando cada item como fácil (intervalo longo) ou difícil (revisão frequente).',
      'Use o sistema de flashcards do Darwin Education para automatizar intervalos SM-2.',
      'Aumente progressivamente os espaços: dia 1, dia 3, semana 1, mês 1.',
      'Monitore acertos para refinar o deck e identificar lacunas.',
    ],
    dicas_enamed:
      'No ENAMED, foque em flashcards para dosagens de antibióticos, critérios diagnósticos e protocolos terapêuticos. Integre com o currículo dos 5 eixos, revisando cada área semanalmente. Comece com 50 cards diários para construir hábito, garantindo recall preciso em questões de múltipla escolha que testam memória factual.',
    relatedHref: '/flashcards',
    relatedLabel: 'Ir para Flashcards',
  },
  'mapas-mentais': {
    title: 'Mapas Mentais',
    icon: <Network className="w-6 h-6" />,
    color: 'emerald',
    base_cientifica:
      'Desenvolvidos por Tony Buzan na década de 1970, os Mapas Mentais utilizam a estrutura radial do cérebro para organizar informações visualmente, baseando-se na teoria de que o hemisfério direito processa imagens e associações melhor que listas lineares. Estudos de Buzan e pesquisas em cognição, como a dual-coding theory de Paivio, mostram que essa técnica melhora a compreensão e retenção em 10-15% para conteúdos complexos. Em medicina, conecta sintomas a diagnósticos diferenciais e algoritmos de tratamento, facilitando a navegação em redes conceituais como árvores de decisão em cardiologia.',
    passo_a_passo: [
      'Coloque o tema central (ex.: "Insuficiência Cardíaca") no centro da página.',
      'Desenhe ramos principais para subtópicos: etiologia, sintomas, diagnóstico, tratamento.',
      'Adicione sub-ramos com detalhes, usando cores diferentes para cada categoria.',
      'Conecte elementos relacionados com setas para criar associações.',
      'Revise e refine o mapa periodicamente, adicionando novos insights.',
    ],
    dicas_enamed:
      'Para o ENAMED, crie mapas para diagnósticos diferenciais em clínica médica ou fluxogramas cirúrgicos. Use para os 5 eixos, como ligar vacinas e calendário vacinal em saúde coletiva. Revise antes de simulados para visualizar conexões em questões integradas que exigem raciocínio clínico transversal.',
  },
  'questoes-ativas': {
    title: 'Questões Ativas (Recall Ativo)',
    icon: <HelpCircle className="w-6 h-6" />,
    color: 'purple',
    base_cientifica:
      'O Recall Ativo, ou efeito de teste, foi demonstrado por Roediger e Karpicke (2006) em estudos que mostram superioridade do auto-teste sobre re-leitura para retenção de longo prazo, com ganhos de 50% em memória. Baseia-se na consolidação ativa de memórias durante a recuperação, fortalecendo trilhas neurais. Em educação médica, meta-análises confirmam que prática de testes melhora significativamente o desempenho em exames como o ENAMED, especialmente para conceitos clínicos onde a aplicação supera a passividade da leitura repetitiva.',
    passo_a_passo: [
      'Após ler um tópico, feche o material completamente.',
      'Escreva ou responda perguntas sobre o conteúdo estudado.',
      'Verifique respostas e corrija erros, anotando pontos fracos.',
      'Repita testes em intervalos crescentes para consolidação.',
      'Analise padrões de falhas para direcionar revisões futuras.',
    ],
    dicas_enamed:
      'Aplique em bancos de questões do ENAMED, simulando o formato real do exame com os 5 eixos. Foque em recall de tratamentos e condutas; evite re-leitura passiva de resumos. Use simulados e questões comentadas diariamente, elevando acertos progressivamente e preparando-se para cenários clínicos reais.',
    relatedHref: '/simulado',
    relatedLabel: 'Ir para Simulados',
  },
  'estudo-grupo': {
    title: 'Estudo em Grupo',
    icon: <Users className="w-6 h-6" />,
    color: 'emerald',
    base_cientifica:
      'Inspirado na Zona de Desenvolvimento Proximal (ZPD) de Vygotsky (1978), o estudo em grupo promove aprendizado colaborativo onde pares mais experientes guiam discussões e expandem o potencial de aprendizado coletivo. Em educação médica, o Team-Based Learning (TBL) de Michaelsen et al. (2002) evidencia ganhos em raciocínio clínico, com estudos mostrando 20-30% de melhoria em retenção via debates estruturados. Facilita discussões de casos clínicos, integrando conhecimentos em diagnósticos e tratamentos entre diferentes especialidades.',
    passo_a_passo: [
      'Forme um grupo de 4-6 estudantes com níveis variados de conhecimento.',
      'Atribua papéis claros: líder da discussão, relator, mediador.',
      'Discuta casos clínicos estruturados por 45 minutos.',
      'Resolva questões coletivamente e debata discordâncias com embasamento.',
      'Registre insights e divida tarefas de estudo para a próxima sessão.',
    ],
    dicas_enamed:
      'Para o ENAMED, use grupos para discutir casos integrados nos 5 eixos, como emergências em ginecologia-obstetrícia ou casos pediátricos com interface cirúrgica. Limite sessões a 2 horas semanais para manter o foco. Incorpore TBL com quizzes pré-discussão para garantir preparação individual antes do debate coletivo.',
  },
  'gestao-tempo': {
    title: 'Gestão de Tempo',
    icon: <CalendarDays className="w-6 h-6" />,
    color: 'purple',
    base_cientifica:
      'A Gestão de Tempo utiliza a Matriz de Eisenhower para priorizar tarefas por urgência e importância, e o Princípio de Pareto (80/20) para focar em esforços de alto impacto. Estudos em produtividade mostram que uma boa gestão do tempo reduz estresse e aumenta eficiência em até 40%. Para o ENAMED, a distribuição inteligente de horas de estudo pelos 5 eixos (clínica médica, cirurgia, pediatria, ginecologia-obstetrícia e saúde coletiva) com base em fraquezas individuais otimiza a preparação para o exame abrangente.',
    passo_a_passo: [
      'Liste suas tarefas e classifique na Matriz Eisenhower (urgente/importante).',
      'Identifique os 20% das atividades que geram 80% dos resultados.',
      'Crie um cronograma semanal, alocando tempo proporcional por eixo.',
      'Use o planejador abaixo para rastrear e organizar sua semana.',
      'Revise e ajuste mensalmente com base em simulados e autoavaliações.',
    ],
    dicas_enamed:
      'No ENAMED, priorize eixos mais fracos alocando mais tempo de estudo para eles. Use o Princípio de Pareto para focar em temas de alta incidência como síndromes coronarianas, trauma e pré-natal. Integre com simulados semanais para acompanhar o progresso; reserve blocos de 2 horas por eixo para cobertura equilibrada e redução de ansiedade pré-prova.',
    tool: 'planner',
  },
}

export default function MethodPage() {
  const params = useParams()
  const slug = params.method as string
  const method = METHODS[slug]

  if (!method) {
    notFound()
  }

  const iconBg = method.color === 'emerald' ? 'bg-emerald-500/10' : 'bg-purple-500/10'
  const iconText = method.color === 'emerald' ? 'text-emerald-400' : 'text-purple-400'
  const accentBorder = method.color === 'emerald' ? 'border-emerald-800' : 'border-purple-800'

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <header className="border-b border-separator bg-surface-1/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/metodos-estudo"
            className="inline-flex items-center gap-2 text-sm text-label-secondary hover:text-label-primary transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Métodos de Estudo
          </Link>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.gentle}
          >
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center ${iconText}`}>
              {method.icon}
            </div>
            <h1 className="text-2xl font-bold">{method.title}</h1>
          </motion.div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Base Científica */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-label-tertiary" />
            <h2 className="text-lg font-semibold">Base Científica</h2>
          </div>
          <p className="text-label-secondary leading-relaxed">
            {method.base_cientifica}
          </p>
        </motion.section>

        {/* Passo a Passo */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="w-5 h-5 text-label-tertiary" />
            <h2 className="text-lg font-semibold">Passo a Passo</h2>
          </div>
          <ol className="space-y-3">
            {method.passo_a_passo.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className={`flex-shrink-0 w-7 h-7 rounded-full ${iconBg} ${iconText} flex items-center justify-center text-sm font-medium`}>
                  {i + 1}
                </span>
                <p className="text-label-secondary pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </motion.section>

        {/* Dicas ENAMED */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 0.3 }}
          className={`p-6 rounded-xl bg-surface-1 border ${accentBorder}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-semibold">Dicas para o ENAMED</h2>
          </div>
          <p className="text-label-secondary leading-relaxed">
            {method.dicas_enamed}
          </p>
          {method.relatedHref && (
            <Link
              href={method.relatedHref}
              className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {method.relatedLabel}
              <ArrowLeft className="w-3 h-3 rotate-180" />
            </Link>
          )}
        </motion.section>

        {/* Embedded Tool */}
        {method.tool === 'pomodoro' && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.4 }}
          >
            <h2 className="text-lg font-semibold mb-4">Timer Pomodoro</h2>
            <PomodoroTimer />
          </motion.section>
        )}

        {method.tool === 'planner' && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 0.4 }}
          >
            <h2 className="text-lg font-semibold mb-4">Planejador Semanal</h2>
            <WeeklyPlanner />
          </motion.section>
        )}
      </main>
    </div>
  )
}
