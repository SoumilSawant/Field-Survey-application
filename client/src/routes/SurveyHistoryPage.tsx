import PageShell from '../components/layout/PageShell'
import { useSubmissionHistory } from '../hooks/useSubmissions'

function SurveyHistoryPage() {
  const historyQuery = useSubmissionHistory()

  return (
    <PageShell
      sectionLabel="Submission History"
      title="Recent Activity"
      description="Audit-ready trail of updates, sync retries, and approvals."
    >
      {historyQuery.isError ? (
        <p className="rounded-radius-card border border-[var(--color-error)] bg-[var(--color-error-container)] p-4 text-sm text-[var(--color-error)]">
          {historyQuery.error instanceof Error ? historyQuery.error.message : 'Unable to load submission history'}
        </p>
      ) : null}

      <div className="space-y-3">
        {(historyQuery.data ?? []).map((item) => (
          <article key={item.id} className="rounded-radius-card border border-outline-variant bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-on-surface">{item.referenceCode}</p>
              <span className="status-chip">{item.status.replaceAll('_', ' ')}</span>
            </div>
            <p className="mt-2">{item.detail}</p>
            <p className="mt-2 text-xs text-on-surface-variant">
              {new Date(item.updatedAt).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </article>
        ))}
      </div>
    </PageShell>
  )
}

export default SurveyHistoryPage
