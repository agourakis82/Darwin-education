import Image from 'next/image'
import Link from 'next/link'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { CURRENT_EULA_VERSION } from '@/lib/legal/eula'

export default function EulaPage() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-24 pt-10 md:px-6 md:py-14">
      <Image
        src="/images/branding/auth-bg-v2.png"
        alt="Fundo visual"
        fill
        sizes="100vw"
        priority
        className="object-cover object-center opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-surface-0/70 via-surface-0/90 to-surface-0/95" />

      <div className="relative mx-auto w-full max-w-3xl">
        <div className="darwin-panel-strong border border-separator/80 p-6 md:p-8">
          <BrandLogo variant="horizontal" size="lg" className="mb-4" priority />

          <h1 className="text-2xl font-semibold text-label-primary">EULA (Termos de Uso)</h1>
          <p className="mt-2 text-sm text-label-secondary">
            Versão <span className="font-medium text-label-primary">{CURRENT_EULA_VERSION}</span>
          </p>

          <div className="mt-6 space-y-6 text-sm text-label-secondary">
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-label-primary">1. Aceitação</h2>
              <p>
                Ao criar uma conta e/ou utilizar a plataforma Darwin Education (&quot;Plataforma&quot;), você
                declara que leu e concorda com estes Termos de Uso.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-label-primary">2. Finalidade educacional</h2>
              <p>
                A Plataforma é voltada para estudo e preparação acadêmica. Ela não substitui orientação médica,
                nem deve ser utilizada para diagnóstico, decisão terapêutica ou atendimento clínico.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-label-primary">3. Conta e segurança</h2>
              <p>
                Você é responsável por manter a confidencialidade de suas credenciais e por toda atividade
                realizada em sua conta. Em caso de suspeita de uso indevido, entre em contato com o time.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-label-primary">4. Conteúdo e propriedade intelectual</h2>
              <p>
                A Plataforma, seus textos, layouts, marcas e funcionalidades podem ser protegidos por direitos de
                propriedade intelectual. Você recebe uma licença limitada, revogável e não exclusiva para acesso
                e uso pessoal/educacional, conforme estes Termos.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-label-primary">5. Dados e melhorias</h2>
              <p>
                Podemos coletar e processar dados relacionados ao uso da Plataforma (por exemplo: eventos de
                navegação, desempenho, respostas, estatísticas de estudo e feedback) para operar, manter e
                melhorar o produto, sempre buscando minimizar dados e aplicar boas práticas de segurança.
              </p>
            </section>

            <section id="pesquisa-academica" className="space-y-2 scroll-mt-24">
              <h2 className="text-base font-semibold text-label-primary">6. Consentimento para pesquisa acadêmica</h2>
              <p>
                Opcionalmente, você pode autorizar o uso dos seus dados para fins de pesquisa acadêmica. Quando
                habilitado, os dados poderão ser utilizados para análises científicas sobre aprendizagem, item
                response theory, desempenho e melhoria de experiência educacional.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Buscamos utilizar dados agregados e/ou pseudonimizados sempre que possível, e limitar o acesso
                  apenas a pessoas autorizadas.
                </li>
                <li>
                  Você pode retirar o consentimento a qualquer momento, e isso passa a valer para usos futuros.
                </li>
              </ul>
              <p className="text-xs text-label-tertiary">
                Observação: este texto é um modelo operacional e não substitui aconselhamento jurídico ou de comitê
                de ética (CEP/IRB) quando aplicável.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-label-primary">7. Alterações destes Termos</h2>
              <p>
                Podemos atualizar estes Termos periodicamente. Quando uma atualização exigir nova aceitação, você
                poderá ser solicitado(a) a revisar e aceitar a versão vigente para continuar usando áreas
                autenticadas.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-label-primary">8. Contato</h2>
              <p>
                Em caso de dúvidas, solicite esclarecimentos ao time Darwin. Se você foi redirecionado(a) aqui por
                um bloqueio de acesso, volte para a tela de consentimento.
              </p>
            </section>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/legal/consent"
              className="darwin-focus-ring darwin-nav-link inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-elevation-2 shadow-inner-shine hover:from-emerald-400 hover:to-emerald-500"
            >
              Ir para consentimento
            </Link>
            <Link
              href="/"
              className="darwin-focus-ring darwin-nav-link inline-flex items-center justify-center rounded-xl border border-separator/80 bg-surface-2/65 px-5 py-3 text-sm font-medium text-label-primary hover:bg-surface-3/70"
            >
              Voltar para início
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

