import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { InsertTables } from '@/lib/supabase'

const CATEGORIES = ['bug', 'feature', 'usability', 'content', 'general'] as const
type Category = (typeof CATEGORIES)[number]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category, message, rating, page_url } = body as {
      category?: string
      message?: string
      rating?: number
      page_url?: string
    }

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return NextResponse.json(
        { error: 'Mensagem deve ter pelo menos 5 caracteres.' },
        { status: 400 }
      )
    }

    const validCategory: Category = CATEGORIES.includes(category as Category)
      ? (category as Category)
      : 'general'

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const row: InsertTables<'beta_feedback'> = {
      user_id: user?.id ?? null,
      email: user?.email ?? null,
      category: validCategory,
      message: message.trim().slice(0, 5000),
      page_url: page_url || null,
      user_agent: request.headers.get('user-agent') || null,
      rating: rating ?? null,
    }

    const { error } = await supabase.from('beta_feedback').insert(row as never)

    if (error) {
      console.error('Failed to insert feedback:', error)
      return NextResponse.json(
        { error: 'Erro ao salvar feedback.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Erro interno.' },
      { status: 500 }
    )
  }
}
