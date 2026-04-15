import PageShell from '../components/layout/PageShell'
import StatusChip from '../components/ui/StatusChip'
import { useSubmissions } from '../hooks/useSubmissions'
import type { SurveySubmission } from '../lib/types'
import { API_BASE_URL } from '../lib/api'

function statusLabel(status: SurveySubmission['status']) {
  return status.replaceAll('_', ' ')
}

function toAbsoluteMediaUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  return `${API_BASE_URL}${path}`
}

function SurveyDataPage() {
  const submissionsQuery = useSubmissions()

  return (
    <PageShell
      sectionLabel="Survey Repository"
      title="Submission Data Table"
      description="Structured records for filtering, review, and export actions."
    >
      {submissionsQuery.isError ? (
        <p className="rounded-radius-card border border-[var(--color-error)] bg-[var(--color-error-container)] p-4 text-sm text-[var(--color-error)]">
          {submissionsQuery.error instanceof Error ? submissionsQuery.error.message : 'Unable to load submissions'}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-radius-card border border-outline-variant bg-surface-container-lowest">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-container-low text-on-surface-variant">
            <tr>
              <th className="px-4 py-3 font-medium">Submission ID</th>
              <th className="px-4 py-3 font-medium">Respondent</th>
              <th className="px-4 py-3 font-medium">Region</th>
              <th className="px-4 py-3 font-medium">Survey</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(submissionsQuery.data ?? []).map((submission) => (
              <tr key={submission.id} className="border-t border-outline-variant align-top">
                <td className="px-4 py-3 font-medium">{submission.referenceCode}</td>
                <td className="space-y-2 px-4 py-3">
                  <p>{submission.respondentName}</p>
                  {submission.latitude !== null && submission.longitude !== null ? (
                    <div className="rounded-radius-card border border-outline-variant bg-surface-container-low p-2 text-xs text-on-surface-variant">
                      <p className="font-semibold text-on-surface">Location Pin</p>
                      <p>{submission.latitude.toFixed(6)}, {submission.longitude.toFixed(6)}</p>
                      <a
                        href={`https://maps.google.com/?q=${submission.latitude},${submission.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-primary hover:underline"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-on-surface-variant">No location captured</p>
                  )}
                </td>
                <td className="px-4 py-3">{submission.region}</td>
                <td className="px-4 py-3 text-on-surface-variant">{submission.template?.title ?? 'Legacy survey'}</td>
                <td className="space-y-2 px-4 py-3">
                  <StatusChip>{statusLabel(submission.status)}</StatusChip>
                  {submission.mediaUrls.length > 0 ? (
                    <div className="grid gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        {submission.mediaUrls.slice(0, 4).map((filePath) => {
                          const url = toAbsoluteMediaUrl(filePath)
                          const isImage = /\.(png|jpg|jpeg|webp|gif)$/i.test(filePath)

                          return isImage ? (
                            <a key={filePath} href={url} target="_blank" rel="noreferrer" className="block">
                              <img src={url} alt="Submission media" className="h-20 w-full rounded-radius-card border border-outline-variant object-cover" />
                            </a>
                          ) : (
                            <a
                              key={filePath}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex h-20 items-center justify-center rounded-radius-card border border-outline-variant bg-surface text-xs font-medium text-primary hover:underline"
                            >
                              Download file
                            </a>
                          )
                        })}
                      </div>
                      {submission.mediaUrls.map((filePath) => {
                        const url = toAbsoluteMediaUrl(filePath)
                        return (
                          <a
                            key={`${filePath}-download`}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Download attachment
                          </a>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-on-surface-variant">No media attached</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}

export default SurveyDataPage
