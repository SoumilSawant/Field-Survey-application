import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import PageShell from '../components/layout/PageShell'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import TextField from '../components/ui/TextField'
import { useGeoWatermark } from '../hooks/useGeoWatermark'
import { useCreateSubmission } from '../hooks/useSubmissions'
import { useActiveSurveyTemplates, useSurveyTemplate } from '../hooks/useSurveyTemplates'

function SurveyFormPage() {
  const navigate = useNavigate()
  const { templateId } = useParams()
  const templatesQuery = useActiveSurveyTemplates()
  const activeTemplateId = useMemo(() => templateId ?? templatesQuery.data?.[0]?.id, [templateId, templatesQuery.data])
  const templateQuery = useSurveyTemplate(activeTemplateId)
  const createSubmissionMutation = useCreateSubmission()
  const { stampImage } = useGeoWatermark()
  const [respondentName, setRespondentName] = useState('')
  const [region, setRegion] = useState('')
  const [notes, setNotes] = useState('')
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [geoStatus, setGeoStatus] = useState('Locating...')
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [isStamping, setIsStamping] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!templateId && templatesQuery.data?.[0]?.id) {
      navigate(`/surveys/new/${templatesQuery.data[0].id}`, { replace: true })
    }
  }, [navigate, templateId, templatesQuery.data])

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      if (!templateQuery.data) {
        throw new Error('No template selected')
      }

      const response = await createSubmissionMutation.mutateAsync({
        templateId: templateQuery.data.id,
        respondentName,
        region,
        notes,
        responses,
        latitude,
        longitude,
        mediaFiles,
      })

      setMessage(`Saved ${response.submission.referenceCode} with status ${response.submission.status}`)
      setRespondentName('')
      setRegion('')
      setNotes('')
      setResponses({})
      setMediaFiles([])
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save submission')
    }
  }

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

  return (
    <PageShell
      sectionLabel="Field Entry"
      title={template.title}
      description="Capture household and respondent details with validation-ready fields."
      actions={<span className="status-chip">{template.schemaJson.questions.length} questions</span>}
    >
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

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={isStamping}>Save Submission</Button>
          </div>
        </form>
      </Card>
    </PageShell>
  )
}

export default SurveyFormPage
