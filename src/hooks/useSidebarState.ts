import { useSidebar } from '@/contexts/SidebarContext'

/**
 * Hook to track sidebar collapsed state
 * Now uses SidebarContext for reliable state management
 */
export function useSidebarState() {
  const { isCollapsed } = useSidebar()
  return isCollapsed
}
