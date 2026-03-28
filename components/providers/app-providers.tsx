// "use client"

// import type { ReactNode } from "react"
// import { ThemeProvider } from "@/components/theme-provider"
// import { SessionTimeoutManager } from "@/components/session-timeout-manager"
// import { UserDataProvider } from "@/hooks/use-user"

// export function AppProviders({ children }: { children: ReactNode }) {
//   return (
//     <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
//       <UserDataProvider>
//         <SessionTimeoutManager />
//         {children}
//       </UserDataProvider>
//     </ThemeProvider>
//   )
// }
"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionTimeoutManager } from "@/components/session-timeout-manager"
import { UserDataProvider } from "@/hooks/use-user"
import { EduPilotGuideChatbot } from "@/components/edupilot-guide-chatbot"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <UserDataProvider>
        <SessionTimeoutManager />
        {children}
        <EduPilotGuideChatbot />
      </UserDataProvider>
    </ThemeProvider>
  )
}