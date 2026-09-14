import clsx from 'clsx'
import type { ReactNode } from 'react'

export function Alert({ children, variant = 'error' }: { children: ReactNode; variant?: 'error' | 'success' | 'info' }) {
  const classes = {
    error: 'bg-red-50 text-gov-error border-red-200',
    success: 'bg-green-50 text-gov-green-hover border-green-200',
    info: 'bg-blue-50 text-gov-blue-hover border-blue-200',
  }[variant]

  return <div className={clsx('rounded-md border px-3 py-2 text-sm', classes)}>{children}</div>
}
