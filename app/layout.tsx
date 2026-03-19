import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'EduPilot | AI Study Platform',
    template: '%s | EduPilot'
  },
  description: 'The intelligent workspace for serious learners. AI-powered notes, tutoring, planning, flashcards, and quizzes in one platform.',
  keywords: ['AI study', 'learning platform', 'AI notes', 'flashcards', 'spaced repetition', 'AI tutor', 'study planner'],
  authors: [{ name: 'EduPilot' }],
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'EduPilot | AI Study Platform',
    description: 'The intelligent workspace for serious learners.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>

        <Analytics />
      </body>
    </html>
  )
}