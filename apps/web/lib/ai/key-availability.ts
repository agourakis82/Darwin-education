import { NextResponse } from 'next/server'

const MINIMAX_API_KEY_NAMES = ['MINIMAX_API_KEY', 'XAI_API_KEY', 'GROK_API_KEY']
const GROK_COMPATIBLE_KEY_NAMES = ['XAI_API_KEY', 'GROK_API_KEY']
const QGEN_API_KEY_NAMES = ['GROK_API_KEY', 'XAI_API_KEY']
const XAI_API_KEY_NAME = 'XAI_API_KEY'

function formatKeyList(keys: string[]): string {
  if (keys.length === 0) return ''
  if (keys.length === 1) return keys[0]
  if (keys.length === 2) return `${keys[0]} ou ${keys[1]}`
  const list = keys.slice(0, -1).join(', ')
  return `${list} ou ${keys[keys.length - 1]}`
}

function aiServiceUnavailable(feature: string, keys: string[]): NextResponse {
  const formattedKeys = formatKeyList(keys)
  return NextResponse.json(
    {
      success: false,
      error: 'servico_de_ia_indisponivel',
      message: `Serviço ${feature} temporariamente indisponível.`,
      instructions: `Defina ${formattedKeys} no ambiente (ex.: .env.local ou variáveis do deployment) e tente novamente.`,
      requiredKeys: keys,
    },
    { status: 503 }
  )
}

export function hasMinimaxApiKey(): boolean {
  return MINIMAX_API_KEY_NAMES.some((key) => Boolean(process.env[key]))
}

export function minimaxServiceUnavailable(featureLabel: string): NextResponse {
  return aiServiceUnavailable(featureLabel, MINIMAX_API_KEY_NAMES)
}

export function hasQGenApiKey(): boolean {
  return QGEN_API_KEY_NAMES.some((key) => Boolean(process.env[key]))
}

export function qgenServiceUnavailable(featureLabel: string): NextResponse {
  return aiServiceUnavailable(featureLabel, QGEN_API_KEY_NAMES)
}

export function hasGrokCompatibleApiKey(): boolean {
  return GROK_COMPATIBLE_KEY_NAMES.some((key) => Boolean(process.env[key]))
}

export function grokServiceUnavailable(featureLabel: string): NextResponse {
  return aiServiceUnavailable(featureLabel, GROK_COMPATIBLE_KEY_NAMES)
}

export function hasXaiApiKey(): boolean {
  return Boolean(process.env[XAI_API_KEY_NAME])
}

export function xaiServiceUnavailable(featureLabel: string): NextResponse {
  return aiServiceUnavailable(featureLabel, [XAI_API_KEY_NAME])
}
