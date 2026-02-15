import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Base card style used for all page content cards - same look and size everywhere */
const CARD_BASE =
  'bg-white rounded-lg border border-gray-200 shadow-sm'

interface PageCardProps {
  children: ReactNode
  /** Use for clickable/list cards (adds hover, overflow-hidden) */
  interactive?: boolean
  className?: string
}

export function PageCard({
  children,
  interactive,
  className,
}: PageCardProps) {
  return (
    <div
      className={cn(
        CARD_BASE,
        interactive && 'hover:shadow-md transition-all duration-200 overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  )
}

/** Shared class for sections (filters, search) - card with padding */
export const PAGE_SECTION_CLASS = `${CARD_BASE} p-4`
