import type { ReactNode } from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from '@/components/app-sidebar'
import { HealthBanner } from '@/components/pipeline/health-banner'
import { RetirementModal } from '@/components/retirement-modal'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 min-h-screen bg-background text-foreground">
          <HealthBanner />
          {children}
        </main>
        <RetirementModal />
      </SidebarProvider>
    </TooltipProvider>
  )
}
