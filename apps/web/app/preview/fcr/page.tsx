import { PreviewScreen } from '@/components/preview/PreviewScreen'

export default function PreviewFcrPage() {
  return (
    <PreviewScreen
      title="Preview — FCR"
      description="Validacao de narrativa visual e orientacao de fluxo para Raciocinio Clinico Fractal."
      imageSrc="/images/branding/fcr-hero-apple-v1.png"
      imageAlt="Visual de raciocinio clinico"
      livePath="/fcr"
      bullets={[
        'Hero reforca tema clinico sem poluicao visual.',
        'Cards de recomendacao e filtros mantem contraste adequado.',
        'Call-to-action inicial fica claro para primeiro uso.',
      ]}
    />
  )
}
