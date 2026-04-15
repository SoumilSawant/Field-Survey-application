import { Outlet } from 'react-router-dom'

function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="grid min-h-screen md:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary-container to-secondary p-12 text-white md:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.22),transparent_35%)]" />
          <div className="relative z-10 mx-auto flex h-full max-w-md flex-col justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-white/80">Field Intelligence</p>
              <h1 className="mt-4 font-headline text-4xl font-semibold leading-tight">
                Survey operations that stay in sync.
              </h1>
            </div>
            <div className="rounded-radius-card border border-white/30 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm text-white/90">
                Real-time dashboards, submissions, and reconciliation from field to HQ.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 md:px-12">
          <Outlet />
        </section>
      </div>
    </div>
  )
}

export default AuthLayout
