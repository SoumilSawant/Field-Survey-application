import type { ReactNode } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { clearSession } from '../../lib/session'

const adminNavItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/surveys/data', label: 'Survey Data' },
]

type AdminLayoutProps = {
  children?: ReactNode
}

function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-outline-variant bg-surface-container-lowest md:flex md:flex-col">
        <div className="top-heartbeat-strip" />
        <div className="px-6 py-5">
          <p className="micro-label">Resilient Ledger</p>
          <h1 className="mt-1 font-headline text-xl font-semibold">Admin Console</h1>
        </div>
        <nav className="flex-1 space-y-2 px-4 pb-6">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'block rounded-radius-chip px-4 py-3 text-sm font-medium transition',
                  isActive
                    ? 'bg-primary text-white shadow-editorial'
                    : 'text-on-surface-variant hover:bg-surface-container-low',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <footer className="border-t border-outline-variant px-6 py-4 text-xs text-on-surface-variant">
          Admin workspace online
        </footer>
      </aside>

      <div className="md:ml-64">
        <header className="sticky top-0 z-20 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
            <p className="micro-label">Operations</p>
            <Link
              to="/login"
              onClick={clearSession}
              className="rounded-radius-pill border border-outline-variant bg-surface px-4 py-2 text-sm font-medium text-on-surface transition hover:border-primary hover:text-primary"
            >
              Logout
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
