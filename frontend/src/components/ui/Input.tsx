import clsx from 'clsx'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, id, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gov-text">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={clsx(
          'rounded-md border border-gov-border bg-white px-3 py-2 text-sm text-gov-text outline-none transition-colors focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20',
          error && 'border-gov-error focus:border-gov-error focus:ring-gov-error/20',
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-gov-error">{error}</span>}
    </div>
  )
})
Input.displayName = 'Input'
