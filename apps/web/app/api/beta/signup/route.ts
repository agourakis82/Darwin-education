import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type BetaSignupBody = {
  name?: unknown
  email?: unknown
  password?: unknown
  inviteCode?: unknown
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function normalizeInviteCode(inviteCode: string) {
  return inviteCode.trim().replace(/\s+/g, '').toUpperCase()
}

function hashInviteCode(inviteCode: string) {
  const secret = process.env.BETA_INVITE_SECRET
  if (!secret) {
    throw new Error('Missing BETA_INVITE_SECRET')
  }

  return crypto.createHmac('sha256', secret).update(inviteCode).digest('hex')
}

function isValidEmail(value: string) {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 320) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

export async function POST(request: NextRequest) {
  try {
    let body: BetaSignupBody
    try {
      body = (await request.json()) as BetaSignupBody
    } catch {
      return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const emailRaw = typeof body.email === 'string' ? body.email : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const inviteCodeRaw = typeof body.inviteCode === 'string' ? body.inviteCode : ''

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Informe seu nome completo.' }, { status: 400 })
    }

    if (!isValidEmail(emailRaw)) {
      return NextResponse.json({ error: 'Informe um email válido.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
    }

    if (!inviteCodeRaw.trim()) {
      return NextResponse.json({ error: 'Informe o código de convite do beta.' }, { status: 400 })
    }

    const email = normalizeEmail(emailRaw)
    const inviteCode = normalizeInviteCode(inviteCodeRaw)
    const inviteHash = hashInviteCode(inviteCode)

    const admin = createAdminClient()
    const db = admin as any

    // 1) Load invite
    let invite = await db
      .from('beta_invites')
      .select('id, max_uses, use_count, expires_at, disabled')
      .eq('code_hash', inviteHash)
      .maybeSingle()

    if (invite.error) {
      return NextResponse.json({ error: 'Falha ao validar convite.' }, { status: 500 })
    }

    if (!invite.data) {
      return NextResponse.json({ error: 'Código de convite inválido.' }, { status: 403 })
    }

    if (invite.data.disabled) {
      return NextResponse.json({ error: 'Código de convite desativado.' }, { status: 403 })
    }

    if (invite.data.expires_at && new Date(invite.data.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Código de convite expirado.' }, { status: 403 })
    }

    // 2) Reserve a use (optimistic concurrency to avoid race conditions)
    let reserved = false
    for (let attempt = 0; attempt < 3; attempt++) {
      if (invite.data.use_count >= invite.data.max_uses) {
        return NextResponse.json({ error: 'Código de convite já utilizado.' }, { status: 403 })
      }

      const nextUseCount = invite.data.use_count + 1

      const updated = await db
        .from('beta_invites')
        .update({ use_count: nextUseCount })
        .eq('id', invite.data.id)
        .eq('use_count', invite.data.use_count)
        .select('id, max_uses, use_count')
        .maybeSingle()

      if (updated.error) {
        return NextResponse.json({ error: 'Falha ao reservar convite.' }, { status: 500 })
      }

      if (updated.data) {
        reserved = true
        invite.data.use_count = updated.data.use_count
        break
      }

      // Race: reload and try again
      invite = await db
        .from('beta_invites')
        .select('id, max_uses, use_count, expires_at, disabled')
        .eq('code_hash', inviteHash)
        .maybeSingle()

      if (invite.error || !invite.data) {
        return NextResponse.json({ error: 'Falha ao validar convite.' }, { status: 500 })
      }
    }

    if (!reserved) {
      return NextResponse.json({ error: 'Convite indisponível. Tente novamente.' }, { status: 409 })
    }

    // 3) Create user with a non-user-editable beta flag (app_metadata)
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
      app_metadata: {
        beta_access: true,
        beta_invite_id: invite.data.id,
      },
    })

    if (createError || !created.user) {
      // Best-effort rollback of reserved invite usage
      await db
        .from('beta_invites')
        .update({ use_count: Math.max(0, invite.data.use_count - 1) })
        .eq('id', invite.data.id)
        .eq('use_count', invite.data.use_count)

      const message = createError?.message || 'Falha ao criar usuário.'
      const isDuplicate = /already registered|already exists|duplicate/i.test(message)
      return NextResponse.json(
        { error: isDuplicate ? 'Este email já está cadastrado.' : message },
        { status: isDuplicate ? 409 : 500 }
      )
    }

    // 4) Audit log
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = request.headers.get('user-agent') || null

    await db.from('beta_invite_redemptions').insert({
      invite_id: invite.data.id,
      user_id: created.user.id,
      email,
      ip,
      user_agent: userAgent,
    })

    return NextResponse.json({
      success: true,
      userId: created.user.id,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
