"use client"

import { useEffect, useState } from "react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { UserProvider } from '@/context/UserContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return <>{children}</>

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
			<UserProvider>
				{children}
			</UserProvider>
      <Toaster />
    </ThemeProvider>
  )
}
