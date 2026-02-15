import { createContext, useContext, useState, useEffect,type ReactNode } from 'react'

interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (value: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage or default to false (expanded)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved === 'true'
  })

  // Sync with localStorage and CSS variable whenever state changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isCollapsed))
    const width = isCollapsed ? '4rem' : '16rem'
    document.documentElement.style.setProperty('--sidebar-width', width)
  }, [isCollapsed])

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev)
  }

  const setSidebarCollapsed = (value: boolean) => {
    setIsCollapsed(value)
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, setSidebarCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
