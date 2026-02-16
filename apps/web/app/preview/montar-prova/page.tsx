import { PreviewScreen } from '@/components/preview/PreviewScreen'

export default function PreviewMontarProvaPage() {
  return (
    <PreviewScreen
      title="Preview — Montar Prova"
      description="Inspecao visual da tela de configuracao de prova para validar hierarquia, densidade e foco."
      imageSrc="/images/branding/montar-prova-hero-apple-v1.png"
      imageAlt="Visual premium da tela de montar prova"
      livePath="/montar-prova"
      bullets={[
        'Hierarquia entre titulo, filtros e acao principal.',
        'Legibilidade do hero sem prejudicar conteudo funcional.',
        'Feedback de erro e estados de indisponibilidade bem destacados.',
      ]}
    />
  )
}
