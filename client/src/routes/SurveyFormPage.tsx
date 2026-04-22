import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import TextField from '../components/ui/TextField'
import { useGeoWatermark } from '../hooks/useGeoWatermark'
import { useActiveSurveyTemplates, useSurveyTemplate } from '../hooks/useSurveyTemplates'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { useDraftPersistence } from '../hooks/useDraftPersistence'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import type { OfflineSubmission } from '../lib/db'

function SurveyFormPage() {
  const navigate = useNavigate()
  const { templateId } = useParams()
  const templatesQuery = useActiveSurveyTemplates()
  const activeTemplateId = useMemo(() => templateId ?? templatesQuery.data?.[0]?.id, [templateId, templatesQuery.data])
  const templateQuery = useSurveyTemplate(activeTemplateId)
  const { stampImage } = useGeoWatermark()
  const { saveOfflineSubmission, pendingCount, submissions } = useOfflineSync()
  const { save: saveDraftState, restore: restoreDraft, discard: discardDraft } = useDraftPersistence(activeTemplateId)
  const isOnline = useNetworkStatus()

  const [respondentName, setRespondentName] = useState('')
  const [region, setRegion] = useState('')
  const [notes, setNotes] = useState('')
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [geoStatus, setGeoStatus] = useState('Locating...')
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [isStamping, setIsStamping] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // -- Navigate to first template if none specified -------------------------

  useEffect(() => {
    if (!templateId && templatesQuery.data?.[0]?.id) {
      navigate(`/surveys/new/${templatesQuery.data[0].id}`, { replace: true })
    }
  }, [navigate, templateId, templatesQuery.data])

  // -- Geolocation ----------------------------------------------------------

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('Geolocation unavailable')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude)
        setLongitude(position.coords.longitude)
        setGeoStatus('Location captured')
      },
      () => {
        setGeoStatus('Location blocked')
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
      },
    )
  }, [])

  // -- Restore draft on mount -----------------------------------------------

  useEffect(() => {
    if (!activeTemplateId) return

    restoreDraft().then((draft) => {
      if (draft) {
        setRespondentName(draft.respondentName)
        setRegion(draft.region)
        setNotes(draft.notes)
        setResponses(draft.responses)
        setDraftRestored(true)
      }
    }).catch(() => {
      // Non-critical
    })
  }, [activeTemplateId, restoreDraft])

  // -- Auto-save draft on every field change --------------------------------

  useEffect(() => {
    if (!activeTemplateId) return

    saveDraftState({
      respondentName,
      region,
      notes,
      responses,
    })
  }, [activeTemplateId, respondentName, region, notes, responses, saveDraftState])

  // -- Media handling with geo-watermark ------------------------------------

  async function handleMediaChange(event: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(event.target.files ?? [])
    if (newFiles.length === 0) return

    const coords = latitude !== null && longitude !== null
      ? { lat: latitude, lng: longitude }
      : null

    setIsStamping(true)
    try {
      const stamped = await Promise.all(
        newFiles.map((f) => stampImage(f, coords)),
      )
      setMediaFiles(stamped)
    } catch {
      setMediaFiles(newFiles)
    } finally {
      setIsStamping(false)
    }
  }

  // -- Offline-first submit -------------------------------------------------

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!templateQuery.data) {
      setError('No template selected')
      return
    }

    setIsSaving(true)

    try {
      const clientId = await saveOfflineSubmission({
        templateId: templateQuery.data.id,
        respondentName,
        region,
        notes,
        responses,
        latitude,
        longitude,
        mediaFiles,
      })

      // Discard draft — the submission is safely persisted
      await discardDraft()

      const statusMsg = isOnline
        ? `Saved locally & syncing now (${clientId.slice(0, 8)}…)`
        : `Saved locally — will sync when online (${clientId.slice(0, 8)}…)`
      setMessage(statusMsg)

      // Reset form for next entry
      setRespondentName('')
      setRegion('')
      setNotes('')
      setResponses({})
      setMediaFiles([])
      setDraftRestored(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save submission')
    } finally {
      setIsSaving(false)
    }
  }

  // -- Loading / error gates ------------------------------------------------

  if (templatesQuery.isLoading || templateQuery.isLoading) {
    return (
      <PageShell
        sectionLabel="Field Entry"
        title="Loading form"
        description="Fetching the selected template and its questions."
      >
        <Card className="p-6 text-sm text-on-surface-variant">Loading template...</Card>
      </PageShell>
    )
  }

  if (templatesQuery.isError || templateQuery.isError) {
    return <Navigate to="/dashboard" replace />
  }

  if (!templateQuery.data) {
    return <Navigate to="/dashboard" replace />
  }

  const template = templateQuery.data

  // -- Pending local submissions for this template --------------------------

  const localPending = submissions.filter(
    (s) => s.templateId === template.id && s.status !== 'SYNCED',
  )

  return (
    <PageShell
      sectionLabel="Field Entry"
      title={template.title}
      description="Capture household and respondent details with validation-ready fields."
      actions={
        <div className="flex items-center gap-2">
          {pendingCount > 0 ? (
            <span className="status-chip bg-[var(--color-tertiary-fixed)] text-[var(--color-tertiary)]">
              {pendingCount} queued
            </span>
          ) : null}
          <span className="status-chip">{template.schemaJson.questions.length} questions</span>
        </div>
      }
    >
      {/* Draft restored indicator */}
      {draftRestored ? (
        <div className="mb-4 rounded-radius-card border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
          📝 Draft restored from a previous session.
        </div>
      ) : null}

      <Card className="p-6 shadow-editorial">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <TextField label="Respondent Name" value={respondentName} onChange={(event) => setRespondentName(event.target.value)} />
          <TextField label="Ward / Region" value={region} onChange={(event) => setRegion(event.target.value)} />

          <article className="rounded-radius-card border border-outline-variant bg-surface-container-lowest p-4 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-on-surface">Geolocation</p>
              <span className="status-chip">{geoStatus}</span>
            </div>
            <p className="mt-2 text-sm text-on-surface-variant">
              {latitude !== null && longitude !== null
                ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                : 'Waiting for browser location permission.'}
            </p>
          </article>

          {template.schemaJson.questions.map((question) => {
            const value = responses[question.id] ?? ''

            if (question.type === 'dropdown') {
              return (
                <label key={question.id} className="text-sm font-medium md:col-span-2">
                  <span className="mb-1 block text-on-surface">{question.label}</span>
                  <select
                    value={value}
                    onChange={(event) => setResponses((current) => ({ ...current, [question.id]: event.target.value }))}
                    className="w-full rounded-radius-chip border border-outline-variant bg-surface px-3 py-2 font-body text-sm outline-none transition focus:border-primary"
                  >
                    <option value="">Select an option</option>
                    {question.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              )
            }

            if (question.type === 'radio') {
              return (
                <fieldset key={question.id} className="rounded-radius-card border border-outline-variant bg-surface-container-lowest p-4 md:col-span-2">
                  <legend className="px-1 text-sm font-medium text-on-surface">{question.label}</legend>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {question.options.map((option) => (
                      <label key={option} className="flex items-center gap-2 rounded-radius-chip border border-outline-variant bg-surface px-3 py-2 text-sm">
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={value === option}
                          onChange={(event) => setResponses((current) => ({ ...current, [question.id]: event.target.value }))}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )
            }

            return (
              <TextField
                key={question.id}
                label={question.label}
                value={value}
                onChange={(event) => setResponses((current) => ({ ...current, [question.id]: event.target.value }))}
                className="md:col-span-2"
              />
            )
          })}

          <label className="text-sm font-medium md:col-span-2">
            <span className="mb-1 block">Survey Notes</span>
            <textarea
              rows={5}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full rounded-radius-card border border-outline-variant bg-surface px-3 py-2 font-body"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-on-surface">Camera / File Upload</span>
            <div className="rounded-radius-card border border-outline-variant bg-surface-container-lowest p-4">
              <input
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                multiple
                onChange={handleMediaChange}
                className="w-full rounded-radius-chip border border-outline-variant bg-surface px-3 py-2 font-body text-sm"
              />
              <p className="mt-2 text-xs text-on-surface-variant">
                Mobile devices can open camera directly. Desktop opens file picker.
              </p>

              {isStamping ? (
                <p className="mt-2 flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)]">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
                  Processing image…
                </p>
              ) : null}

              {mediaFiles.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {mediaFiles.map((file) => {
                    const isImage = file.type.startsWith('image/')
                    return (
                      <div key={file.name + file.size} className="rounded-radius-card border border-outline-variant bg-surface p-3">
                        <p className="truncate text-xs font-medium text-on-surface">{file.name}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">{Math.round(file.size / 1024)} KB</p>
                        {isImage ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="mt-2 h-28 w-full rounded-radius-card object-cover"
                          />
                        ) : (
                          <div className="mt-2 rounded-radius-card border border-outline-variant bg-surface-container-low p-3 text-xs text-on-surface-variant">
                            PDF preview unavailable
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          </label>

          {message ? <p className="md:col-span-2 rounded-radius-card border border-outline-variant bg-surface-container-lowest p-3 text-sm text-on-surface-variant">{message}</p> : null}
          {error ? <p className="md:col-span-2 rounded-radius-card border border-[var(--color-error)] bg-[var(--color-error-container)] p-3 text-sm text-[var(--color-error)]">{error}</p> : null}

          <div className="md:col-span-2 flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">
              {!isOnline ? '⚡ Offline mode — data saved locally' : ''}
            </p>
            <Button type="submit" disabled={isStamping || isSaving}>
              {isSaving ? 'Saving…' : 'Save Submission'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Local sync queue for this template */}
      {localPending.length > 0 ? (
        <Card className="mt-6 p-5">
          <p className="micro-label">Local Queue</p>
          <h3 className="mt-1 font-headline text-lg font-semibold">Pending Submissions</h3>
          <div className="mt-4 space-y-3">
            {localPending.map((sub) => (
              <SyncStatusRow key={sub.clientId} submission={sub} />
            ))}
          </div>
        </Card>
      ) : null}
    </PageShell>
  )
}

// ---------------------------------------------------------------------------
// Inline sub-component: per-submission sync status
// ---------------------------------------------------------------------------

function SyncStatusRow({ submission }: { submission: OfflineSubmission }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    PENDING_SYNC: { label: 'Not Synced', color: 'text-[var(--color-tertiary)]' },
    SYNCING: { label: 'Syncing…', color: 'text-[var(--color-primary)]' },
    SYNCED: { label: 'Synced', color: 'text-green-600' },
    FAILED: { label: 'Retry pending', color: 'text-[var(--color-error)]' },
  }

  const config = statusConfig[submission.status] ?? statusConfig.PENDING_SYNC

  return (
    <article className="flex items-center justify-between rounded-radius-card border border-outline-variant bg-surface-container-lowest p-3">
      <div>
        <p className="text-sm font-medium text-on-surface">
          {submission.respondentName || 'Unnamed'} · {submission.region || 'No region'}
        </p>
        <p className="mt-0.5 text-xs text-on-surface-variant">
          {new Date(submission.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          {submission.files.length > 0 ? ` · ${submission.files.length} file${submission.files.length > 1 ? 's' : ''}` : ''}
        </p>
        {submission.errorMessage ? (
          <p className="mt-1 text-xs text-[var(--color-error)]">{submission.errorMessage}</p>
        ) : null}
      </div>
      <span className={`text-xs font-semibold ${config.color}`}>
        {submission.status === 'SYNCING' ? (
          <span className="mr-1 inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {config.label}
      </span>
    </article>
  )
}

export default SurveyFormPage
