import { PreviewScreen } from '@/components/preview/PreviewScreen'

export default function PreviewSimuladoPage() {
  return (
    <PreviewScreen
      title="Preview — Simulado"
      description="Versao de avaliacao visual da experiencia de simulados para revisao rapida com stakeholders."
      imageSrc="/images/branding/simulado-banner-v2.png"
      imageAlt="Banner visual de simulados"
      livePath="/simulado"
      bullets={[
        'Hero comunica clareza de proposta em ate 3 segundos.',
        'Card grid com boa leitura em desktop e mobile.',
        'CTAs rapidos evidentes sem competir com lista principal.',
      ]}
    />
  )
}
