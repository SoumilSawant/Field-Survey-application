import type { ReactNode } from 'react'

type PageShellProps = {
  sectionLabel: string
  title: string
  description: string
  actions?: ReactNode
  children?: ReactNode
}

function PageShell({ sectionLabel, title, description, actions, children }: PageShellProps) {
  return (
    <section className="space-y-6">
      <header className="editorial-card">
        <p className="micro-label">{sectionLabel}</p>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-headline text-2xl font-semibold md:text-3xl">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm text-on-surface-variant md:text-base">{description}</p>
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </header>
      {children}
    </section>
  )
}

export default PageShell
