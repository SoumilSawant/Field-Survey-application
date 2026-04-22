import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { clearSession } from '../../lib/session'
import OfflineBanner from '../ui/OfflineBanner'

const fieldNavItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/surveys/new', label: 'New Entry' },
  { to: '/surveys/history', label: 'History' },
]

type FieldLayoutProps = {
  children?: ReactNode
}

function FieldLayout({ children }: FieldLayoutProps) {
  return (
    <div className="min-h-screen bg-surface pb-20 text-on-surface md:pb-0">
      <header className="sticky top-0 z-20 border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16 md:px-8">
          <div>
            <p className="micro-label">Employee Workspace</p>
            <h1 className="font-headline text-lg font-semibold">Form Intake</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="status-chip">Forms ready</span>
            <NavLink to="/login" onClick={clearSession} className="text-sm font-medium text-on-surface-variant hover:text-primary">
              Logout
            </NavLink>
          </div>
        </div>
      </header>

      <OfflineBanner />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
        {children ?? <Outlet />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-outline-variant bg-surface-container-lowest p-2 md:hidden">
        <div className="grid grid-cols-3 gap-2">
          {fieldNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'rounded-radius-chip px-3 py-2 text-center text-xs font-semibold',
                  isActive ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default FieldLayout
