import { PreviewScreen } from '@/components/preview/PreviewScreen'

export default function PreviewCasoClinicoPage() {
  return (
    <PreviewScreen
      title="Preview — Caso Clinico"
      description="Pagina de auditoria visual do fluxo de configuracao de casos clinicos para estudo guiado."
      imageSrc="/images/branding/caso-clinico-hero-apple-v1.png"
      imageAlt="Visual de caso clinico interativo"
      livePath="/caso-clinico"
      bullets={[
        'Configuracao inicial com leitura rapida de area e dificuldade.',
        'Espacamento entre campos favorece uso mobile.',
        'CTA principal evidente para inicio de caso.',
      ]}
    />
  )
}
