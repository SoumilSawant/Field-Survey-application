import { Link } from 'react-router-dom'
import { useActiveSurveyTemplates } from '../../hooks/useSurveyTemplates'
import Card from '../ui/Card'

function FormSelector() {
  const templatesQuery = useActiveSurveyTemplates()

  if (templatesQuery.isLoading) {
    return <Card className="p-5 text-sm text-on-surface-variant">Loading available forms...</Card>
  }

  if (templatesQuery.isError) {
    return (
      <Card className="p-5 text-sm text-[var(--color-error)]">
        {templatesQuery.error instanceof Error ? templatesQuery.error.message : 'Unable to load active forms'}
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {templatesQuery.data?.map((template) => (
        <Link key={template.id} to={`/surveys/new/${template.id}`} className="group block">
          <Card className="h-full p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-editorial">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="micro-label">Available Form</p>
                <h3 className="mt-1 font-headline text-lg font-semibold text-on-surface group-hover:text-primary">{template.title}</h3>
              </div>
              <span className="status-chip">Open</span>
            </div>

            <p className="mt-4 text-sm text-on-surface-variant">
              {template.schemaJson.questions.length} questions ready for employee capture.
            </p>
          </Card>
        </Link>
      ))}
    </div>
  )
}

export default FormSelector