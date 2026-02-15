import type { ReactNode } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { useSidebar } from '@/contexts/SidebarContext'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="w-full min-h-screen min-h-dvh bg-gray-50 flex flex-col">
      <Sidebar />
      <main
        className="transition-all duration-300 ease-in-out min-h-screen min-h-dvh flex-1 relative z-0 flex flex-col"
        style={{ 
          marginLeft: isCollapsed ? '4rem' : '16rem',
          width: `calc(100% - ${isCollapsed ? '4rem' : '16rem'})`,
          maxWidth: '100vw',
        }}
      >
        {children}
      </main>
    </div>
  )
}
