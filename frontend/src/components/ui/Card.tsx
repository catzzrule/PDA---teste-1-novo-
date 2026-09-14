import clsx from 'clsx'
import type { HTMLAttributes } from 'react'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-lg border border-gov-border bg-white p-6 shadow-sm', className)}
      {...props}
    />
  )
}
