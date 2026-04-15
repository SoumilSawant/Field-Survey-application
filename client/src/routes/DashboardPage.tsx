import { Navigate } from 'react-router-dom'
import AdminLayout from '../components/layout/AdminLayout'
import FieldLayout from '../components/layout/FieldLayout'
import PageShell from '../components/layout/PageShell'
import StatusChip from '../components/ui/StatusChip'
import Button from '../components/ui/Button'
import AdminFormBuilder from '../components/surveys/AdminFormBuilder'
import FormSelector from '../components/surveys/FormSelector'
import { useDashboardSummary } from '../hooks/useDashboardSummary'
import { getSession } from '../lib/session'

const metricLabels = [
  { key: 'totalForms', label: 'Total Forms' },
  { key: 'totalSubmissions', label: 'Total Submissions' },
  { key: 'todaySubmissions', label: 'Today Submissions' },
  { key: 'pendingSync', label: 'Pending Sync' },
  { key: 'activeEmployees', label: 'Active Employees' },
] as const

function DashboardPage() {
  const session = getSession()
  const summaryQuery = useDashboardSummary()

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (session.role === 'ADMIN') {
    return (
      <AdminLayout>
        <PageShell
          sectionLabel="Admin Dashboard"
          title="Form Management Console"
          description="Create templates, review submissions, and monitor the active form catalog."
          actions={
            <Button variant="secondary" onClick={() => document.getElementById('create-form')?.scrollIntoView({ behavior: 'smooth' })}>
              Create New Form
            </Button>
          }
        >
          {summaryQuery.isError ? (
            <p className="rounded-radius-card border border-[var(--color-error)] bg-[var(--color-error-container)] p-4 text-sm text-[var(--color-error)]">
              {summaryQuery.error instanceof Error ? summaryQuery.error.message : 'Unable to load dashboard'}
            </p>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metricLabels.map((metric) => (
              <article key={metric.key} className="rounded-radius-card border border-outline-variant bg-surface-container-lowest p-5">
                <p className="micro-label">{metric.label}</p>
                <p className="mt-3 font-headline text-3xl font-semibold text-primary">
                  {summaryQuery.data ? summaryQuery.data.metrics[metric.key].toLocaleString() : '—'}
                </p>
              </article>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <article className="editorial-card">
              <p className="micro-label">Recent Activity</p>
              <h3 className="mt-1 font-headline text-xl font-semibold">Latest submissions</h3>

              <div className="mt-5 space-y-3">
                {(summaryQuery.data?.recentSubmissions ?? []).map((submission) => (
                  <div key={submission.referenceCode} className="rounded-radius-card border border-outline-variant bg-surface-container-lowest p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{submission.referenceCode}</p>
                        <p className="text-sm text-on-surface-variant">
                          {submission.respondentName} · {submission.region}
                        </p>
                      </div>
                      <StatusChip>{submission.status.replaceAll('_', ' ')}</StatusChip>
                    </div>
                    <p className="mt-2 text-xs text-on-surface-variant">
                      Form: {submission.templateTitle} · Updated {new Date(submission.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="editorial-card">
              <p className="micro-label">Workspace Snapshot</p>
              <h3 className="mt-1 font-headline text-xl font-semibold">Forms and sync health</h3>
              <div className="mt-5 space-y-4 text-sm text-on-surface-variant">
                <p>Active forms are published to employees immediately after save.</p>
                <p>Templates are stored as structured JSON and can be reused across dashboards and mobile flows.</p>
                <div className="rounded-radius-card border border-outline-variant bg-surface-container-lowest p-4">
                  <p className="micro-label">Platform</p>
                  <p className="mt-2 text-on-surface">
                    {summaryQuery.data ? `${summaryQuery.data.metrics.totalForms} forms are active right now.` : 'Loading platform metrics...'}
                  </p>
                </div>
              </div>
            </article>
          </section>

          <section id="create-form">
            <AdminFormBuilder />
          </section>
        </PageShell>
      </AdminLayout>
    )
  }

  return (
    <FieldLayout>
      <PageShell
        sectionLabel="Employee Dashboard"
        title="Available Forms"
        description="Pick an active template and open the intake form for that assignment."
        actions={<StatusChip>{summaryQuery.data ? `${summaryQuery.data.metrics.totalForms} active forms` : 'Loading forms'}</StatusChip>}
      >
        {summaryQuery.isError ? (
          <p className="rounded-radius-card border border-[var(--color-error)] bg-[var(--color-error-container)] p-4 text-sm text-[var(--color-error)]">
            {summaryQuery.error instanceof Error ? summaryQuery.error.message : 'Unable to load dashboard'}
          </p>
        ) : null}

        <FormSelector />

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-radius-card border border-outline-variant bg-surface-container-lowest p-5">
            <p className="micro-label">Today Submissions</p>
            <p className="mt-3 font-headline text-3xl font-semibold text-primary">{summaryQuery.data ? summaryQuery.data.metrics.todaySubmissions : '—'}</p>
          </article>
          <article className="rounded-radius-card border border-outline-variant bg-surface-container-lowest p-5">
            <p className="micro-label">Pending Sync</p>
            <p className="mt-3 font-headline text-3xl font-semibold text-primary">{summaryQuery.data ? summaryQuery.data.metrics.pendingSync : '—'}</p>
          </article>
          <article className="rounded-radius-card border border-outline-variant bg-surface-container-lowest p-5">
            <p className="micro-label">Active Employees</p>
            <p className="mt-3 font-headline text-3xl font-semibold text-primary">{summaryQuery.data ? summaryQuery.data.metrics.activeEmployees : '—'}</p>
          </article>
        </section>
      </PageShell>
    </FieldLayout>
  )
}

export default DashboardPage
