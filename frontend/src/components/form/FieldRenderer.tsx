import clsx from 'clsx'
import type { FieldDef } from '../../lib/form-schema'

interface FieldRendererProps {
  field: FieldDef
  value: unknown
  onChange: (key: string, value: unknown) => void
  onFileChange?: (key: string, file: File | null) => void
  existingFileName?: string | null
}

const baseInputClass =
  'w-full rounded-md border border-gov-border bg-white px-3 py-2 text-sm text-gov-text outline-none transition-colors focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20'

export function FieldRenderer({ field, value, onChange, onFileChange, existingFileName }: FieldRendererProps) {
  return (
    <div className="rounded-lg border border-gov-border bg-white p-4">
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-xs font-semibold text-gov-text-muted">{field.numero}.</span>
        <span className="text-sm font-semibold text-gov-text">{field.label}</span>
        {field.required && <span className="text-gov-error">*</span>}
      </div>
      {field.description && <p className="mb-3 text-xs text-gov-text-muted">{field.description}</p>}

      {field.type === 'text' && (
        <input
          type="text"
          className={baseInputClass}
          value={(value as string) ?? ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      )}

      {field.type === 'email' && (
        <input
          type="email"
          className={baseInputClass}
          value={(value as string) ?? ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      )}

      {field.type === 'date' && (
        <input
          type="date"
          className={baseInputClass}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          className={clsx(baseInputClass, 'min-h-24 resize-y')}
          value={(value as string) ?? ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      )}

      {field.type === 'select' && (
        <select
          className={baseInputClass}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.key, e.target.value)}
        >
          <option value="">Selecione…</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {field.type === 'radio' && (
        <div className="flex flex-wrap gap-2">
          {field.options?.map((opt) => {
            const selected = value === opt
            return (
              <label
                key={opt}
                className={clsx(
                  'cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-colors',
                  selected ? 'border-gov-blue bg-gov-blue/10 text-gov-blue' : 'border-gov-border text-gov-text hover:bg-slate-50',
                )}
              >
                <input
                  type="radio"
                  name={field.key}
                  value={opt}
                  checked={selected}
                  onChange={() => onChange(field.key, opt)}
                  className="sr-only"
                />
                {opt}
              </label>
            )
          })}
        </div>
      )}

      {field.type === 'checkbox-group' && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {field.options?.map((opt) => {
            const arr = Array.isArray(value) ? (value as string[]) : []
            const checked = arr.includes(opt)
            return (
              <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm text-gov-text">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked ? arr.filter((v) => v !== opt) : [...arr, opt]
                    onChange(field.key, next)
                  }}
                />
                {opt}
              </label>
            )
          })}
        </div>
      )}

      {field.type === 'file' && (
        <div>
          <input
            type="file"
            className="block w-full text-sm text-gov-text file:mr-3 file:rounded-md file:border-0 file:bg-gov-blue file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-gov-blue-hover"
            onChange={(e) => onFileChange?.(field.key, e.target.files?.[0] ?? null)}
          />
          {existingFileName && (
            <p className="mt-1 text-xs text-gov-text-muted">
              Arquivo já enviado: <strong>{existingFileName}</strong> — envie um novo apenas se quiser substituí-lo.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
