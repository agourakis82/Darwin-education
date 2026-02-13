import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type CreateInviteBody = {
  label?: unknown
  maxUses?: unknown
  expiresAt?: unknown
  metadata?: unknown
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

function isAuthorized(request: NextRequest) {
  const expected = process.env.BETA_ADMIN_API_KEY
  if (!expected) return false
  const provided = request.headers.get('x-beta-admin-key') || ''

  const expectedBuf = Buffer.from(expected)
  const providedBuf = Buffer.from(provided)
  if (expectedBuf.length === 0 || providedBuf.length !== expectedBuf.length) return false

  return crypto.timingSafeEqual(providedBuf, expectedBuf)
}

function generateInviteCode() {
  // 16 bytes => 22 chars base64url (no padding); uppercasing keeps it copy-friendly.
  const token = crypto.randomBytes(16).toString('base64url')
  return `DARWIN-${token}`.toUpperCase()
}

function toIsoOrNull(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const d = new Date(trimmed)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as CreateInviteBody

    const label = typeof body.label === 'string' ? body.label.trim().slice(0, 140) : null
    const maxUsesRaw = typeof body.maxUses === 'number' ? body.maxUses : 1
    const maxUses = Number.isFinite(maxUsesRaw) ? Math.max(1, Math.floor(maxUsesRaw)) : 1

    const expiresAt = toIsoOrNull(body.expiresAt)

    const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {}

    const admin = createAdminClient()
    const db = admin as any

    for (let attempt = 0; attempt < 3; attempt++) {
      const code = normalizeInviteCode(generateInviteCode())
      const codeHash = hashInviteCode(code)

      const { data, error } = await db
        .from('beta_invites')
        .insert({
          code_hash: codeHash,
          label,
          max_uses: maxUses,
          expires_at: expiresAt,
          metadata,
        })
        .select('id')
        .single()

      if (!error) {
        return NextResponse.json({
          success: true,
          inviteId: data.id,
          code,
          maxUses,
          expiresAt,
        })
      }

      // Rare collision: try again with a new code
      if (String(error?.code || '').toLowerCase() !== '23505') {
        return NextResponse.json({ error: error.message || 'Failed to create invite' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Failed to create invite. Try again.' }, { status: 500 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
