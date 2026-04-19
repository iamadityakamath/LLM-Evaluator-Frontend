'use client'

import { Sidebar, MobileNav } from './sidebar'

interface AppShellProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function AppShell({ children, title, description }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Nav */}
      <MobileNav />

      {/* Main Content */}
      <main className="pb-20 md:ml-64 md:pb-0">
        <div className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="px-6 py-6 md:px-8">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
