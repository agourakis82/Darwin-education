import type { Metadata, Viewport } from 'next'
import './globals.css'
import { inter } from './fonts'
import { Navigation } from '@/components/Navigation'
import { BottomNav } from '@/components/BottomNav'
import { ToastProvider } from '@/components/ui/Toast'
import { PageTransition } from '@/components/ui/PageTransition'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { ThemeScript } from '@/components/theme/ThemeScript'
import { FeedbackWidget } from '@/components/FeedbackWidget'
import { createServerClient } from '@/lib/supabase/server'
import { getUserSummaryFromAccessToken, type UserSummary } from '@/lib/auth/user'
import { CommandPalette } from '@/components/ui/CommandPalette'

export const metadata: Metadata = {
  metadataBase: new URL('https://darwinhub.org'),
  title: 'Darwin Education - ENAMED Prep',
  description:
    'Plataforma de preparação para o ENAMED (Exame Nacional de Avaliação da Formação Médica)',
  keywords: ['ENAMED', 'medicina', 'prova', 'residência', 'educação médica'],
  icons: {
    icon: [
      { url: '/brand/favicon/darwin-favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/favicon/darwin-favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/brand/favicon/darwin-favicon-32.png',
    apple: '/brand/logo/darwin-appicon-master-1024.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Darwin Education',
  },
  openGraph: {
    title: 'Darwin Education - ENAMED Prep',
    description:
      'Plataforma de preparação para o ENAMED (Exame Nacional de Avaliação da Formação Médica)',
    url: 'https://darwinhub.org',
    siteName: 'Darwin Education',
    images: [
      {
        url: '/brand/logo/darwin-og-1200x630.png',
        width: 1200,
        height: 630,
        alt: 'Darwin Education',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Darwin Education - ENAMED Prep',
    description:
      'Plataforma de preparação para o ENAMED (Exame Nacional de Avaliação da Formação Médica)',
    images: ['/brand/logo/darwin-og-1200x630.png'],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  let userSummary: UserSummary | null = session?.access_token
    ? getUserSummaryFromAccessToken(session.access_token)
    : null
  const showBottomNav = Boolean(userSummary)

  return (
    <html 
      lang="pt-BR" 
      suppressHydrationWarning
      className={inter.variable}
    >
      <head>
        <ThemeScript />
      </head>
      <body 
        className="
          min-h-screen
          bg-system-background
          text-label
          antialiased
          selection:bg-darwin-emerald/35
          selection:text-label
        "
      >
        <ThemeProvider>
          <ToastProvider>
            <CommandPalette />
            <div className="relative min-h-screen">
              {/* Background gradient mesh */}
              <div 
                className="fixed inset-0 pointer-events-none -z-10"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-darwin-emerald/5 via-transparent to-system-cyan/5" />
              </div>
              
              <Navigation user={userSummary} />
              
              <main 
                id="main-content" 
                className={showBottomNav ? 'pb-16 md:pb-0' : undefined}
              >
                <PageTransition>
                  {children}
                </PageTransition>
              </main>
              
              <BottomNav user={userSummary} />
              <FeedbackWidget />
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
