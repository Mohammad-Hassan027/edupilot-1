import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

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
    description: 'The intelligent workspace for serious learners. AI-powered notes, tutoring, planning, flashcards, and quizzes.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
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
