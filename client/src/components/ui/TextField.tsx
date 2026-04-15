import type { InputHTMLAttributes } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

function TextField({ label, className = '', ...props }: TextFieldProps) {
  return (
    <label className="block text-sm font-medium">
      <span className="mb-1 block text-on-surface">{label}</span>
      <input
        className={[
          'w-full rounded-radius-chip border border-outline-variant bg-surface px-3 py-2 font-body text-sm outline-none transition focus:border-primary',
          className,
        ].join(' ')}
        {...props}
      />
    </label>
  )
}

export default TextField
