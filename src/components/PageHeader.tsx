import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  /** Right-side content (e.g. date, primary button) */
  actions?: ReactNode
  className?: string
}

const HEADER_CLASS =
  'sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4'

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn(HEADER_CLASS, className)}>
      <div className={cn('flex items-center justify-between', !actions && 'flex')}>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {description && (
            <p className="text-slate-600 text-sm mt-0.5">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center shrink-0">{actions}</div>}
      </div>
    </header>
  )
}
