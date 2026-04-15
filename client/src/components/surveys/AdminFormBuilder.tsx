import { useEffect, useState } from 'react'
import { useCreateSurveyTemplate } from '../../hooks/useSurveyTemplates'
import Button from '../ui/Button'
import Card from '../ui/Card'
import TextField from '../ui/TextField'

type QuestionType = 'text' | 'dropdown' | 'radio'

type BuilderQuestion = {
  id: string
  label: string
  type: QuestionType
  required: boolean
  optionsText: string
}

const emptyQuestion = (): BuilderQuestion => ({
  id: `question-${Math.random().toString(36).slice(2, 8)}`,
  label: '',
  type: 'text',
  required: false,
  optionsText: '',
})

function AdminFormBuilder() {
  const createTemplateMutation = useCreateSurveyTemplate()
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<BuilderQuestion[]>([emptyQuestion()])
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (createTemplateMutation.isSuccess) {
      setTitle('')
      setQuestions([emptyQuestion()])
      setFeedback('Form template saved.')
    }
  }, [createTemplateMutation.isSuccess])

  function updateQuestion(questionId: string, field: keyof BuilderQuestion, value: string | boolean) {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question) => (question.id === questionId ? { ...question, [field]: value } : question)),
    )
  }

  function addQuestion() {
    setQuestions((currentQuestions) => [...currentQuestions, emptyQuestion()])
  }

  function removeQuestion(questionId: string) {
    setQuestions((currentQuestions) => (currentQuestions.length === 1 ? currentQuestions : currentQuestions.filter((question) => question.id !== questionId)))
  }

  async function handleSave() {
    setFeedback('')

    await createTemplateMutation.mutateAsync({
      title,
      isActive: true,
      schemaJson: {
        questions: questions.map((question) => ({
          id: question.id,
          label: question.label,
          type: question.type,
          required: question.required,
          options: question.optionsText
            .split(',')
            .map((option) => option.trim())
            .filter(Boolean),
        })),
      },
    })
  }

  return (
    <Card className="rounded-radius-card border border-outline-variant bg-surface-container-lowest p-5 shadow-editorial">
      <div id="create-form" className="space-y-5">
        <div className="flex flex-col gap-1">
          <p className="micro-label">Create New Form</p>
          <h3 className="font-headline text-xl font-semibold">Form Builder</h3>
          <p className="text-sm text-on-surface-variant">Compose a template with text, dropdown, and radio questions.</p>
        </div>

        <TextField label="Form Title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Community Intake Form" />

        <div className="space-y-4">
          {questions.map((question, index) => (
            <article key={question.id} className="rounded-radius-card border border-outline-variant bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-on-surface">Question {index + 1}</p>
                <button type="button" onClick={() => removeQuestion(question.id)} className="text-xs font-semibold text-tertiary hover:underline">
                  Remove
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TextField
                  label="Question Label"
                  value={question.label}
                  onChange={(event) => updateQuestion(question.id, 'label', event.target.value)}
                  placeholder="What is the household size?"
                />

                <label className="block text-sm font-medium">
                  <span className="mb-1 block text-on-surface">Question Type</span>
                  <select
                    value={question.type}
                    onChange={(event) => updateQuestion(question.id, 'type', event.target.value)}
                    className="w-full rounded-radius-chip border border-outline-variant bg-surface px-3 py-2 font-body text-sm outline-none transition focus:border-primary"
                  >
                    <option value="text">Text</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="radio">Radio</option>
                  </select>
                </label>

                <TextField
                  label="Answer Options"
                  value={question.optionsText}
                  onChange={(event) => updateQuestion(question.id, 'optionsText', event.target.value)}
                  placeholder="Option 1, Option 2, Option 3"
                  className="md:col-span-2"
                />

                <label className="flex items-center gap-3 text-sm font-medium text-on-surface md:col-span-2">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(event) => updateQuestion(question.id, 'required', event.target.checked)}
                    className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  Required field
                </label>
              </div>
            </article>
          ))}
        </div>

        {feedback ? <p className="rounded-radius-card border border-outline-variant bg-surface-container-low p-3 text-sm text-on-surface-variant">{feedback}</p> : null}
        {createTemplateMutation.isError ? (
          <p className="rounded-radius-card border border-[var(--color-error)] bg-[var(--color-error-container)] p-3 text-sm text-[var(--color-error)]">
            {createTemplateMutation.error instanceof Error ? createTemplateMutation.error.message : 'Unable to save template'}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={addQuestion}>
            Add Question
          </Button>
          <Button type="button" onClick={handleSave} disabled={createTemplateMutation.isPending || !title.trim()}>
            {createTemplateMutation.isPending ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default AdminFormBuilder