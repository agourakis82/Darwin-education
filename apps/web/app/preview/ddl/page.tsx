import { PreviewScreen } from '@/components/preview/PreviewScreen'

export default function PreviewDdlPage() {
  return (
    <PreviewScreen
      title="Preview — DDL"
      description="Revisão da experiência de Diagnóstico Diferencial de Lacunas com foco em onboarding e compreensão."
      imageSrc="/images/branding/ddl-hero-apple-v1.png"
      imageAlt="Visual de diagnóstico de lacunas"
      livePath="/ddl"
      bullets={[
        'Mensagem de valor entendida antes da primeira interação.',
        'Cards de tipos de lacuna com diferenciação clara.',
        'Estados de erro e progresso visíveis sem ruído.',
      ]}
    />
  )
}
