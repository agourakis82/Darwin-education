import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getUserSummaryFromAccessToken } from '@/lib/auth/user'

// Routes that require authentication
const protectedRoutes = ['/simulado', '/flashcards', '/trilhas', '/montar-prova', '/desempenho', '/gerar-questao', '/qgen', '/ia-orientacao', '/pesquisa', '/caso-clinico', '/admin', '/fcr', '/ddl', '/cip']

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/signup']

function parseCsv(value?: string) {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

const allowedEmails = parseCsv(process.env.BETA_TESTER_EMAILS)
const allowedDomains = parseCsv(process.env.BETA_TESTER_DOMAINS).map((domain) =>
  domain.replace(/^@/, '').replace(/^\./, '')
)

const betaGateEnabled = allowedEmails.length > 0 || allowedDomains.length > 0

function isBetaAllowed(email: string | null) {
  if (!betaGateEnabled) return true
  if (!email) return false

  const normalized = email.trim().toLowerCase()
  if (!normalized) return false

  if (allowedEmails.includes(normalized)) return true

  const at = normalized.lastIndexOf('@')
  if (at === -1) return false
  const domain = normalized.slice(at + 1)
  if (!domain) return false

  return allowedDomains.some((allowed) => domain === allowed || domain.endsWith(`.${allowed}`))
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Use session-based auth to avoid rate-limiting `auth.getUser()` in middleware.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !session) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Closed beta gate (simplified): allowlist by email/domain.
  if (isProtectedRoute && session && betaGateEnabled) {
    const summary =
      typeof session.access_token === 'string' ? getUserSummaryFromAccessToken(session.access_token) : null

    if (!isBetaAllowed(summary?.email ?? null)) {
      const url = request.nextUrl.clone()
      url.pathname = '/beta'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
  }

  // Redirect to home if accessing auth routes while authenticated
  if (isAuthRoute && session) {
    if (betaGateEnabled) {
      const summary =
        typeof session.access_token === 'string'
          ? getUserSummaryFromAccessToken(session.access_token)
          : null

      // Let non-beta users reach /login and /signup so they can switch accounts.
      if (!isBetaAllowed(summary?.email ?? null)) {
        return supabaseResponse
      }
    }

    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
