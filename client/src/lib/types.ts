export type UserRole = 'ADMIN' | 'EMPLOYEE'

export type SessionUser = {
  id: string
  email: string
  name: string | null
  role: UserRole
}

export type TemplateQuestionType = 'text' | 'dropdown' | 'radio'

export type TemplateQuestion = {
  id: string
  label: string
  type: TemplateQuestionType
  required: boolean
  options: string[]
}

export type SurveyTemplate = {
  id: string
  title: string
  schemaJson: {
    questions: TemplateQuestion[]
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type SubmissionStatus = 'DRAFT' | 'PENDING_SYNC' | 'SYNCED' | 'APPROVED' | 'REJECTED'

export type SurveySubmission = {
  id: string
  referenceCode: string
  respondentName: string
  region: string
  notes: string
  responseJson: Record<string, unknown> | null
  latitude: number | null
  longitude: number | null
  mediaUrls: string[]
  status: SubmissionStatus
  syncedAt: string | null
  createdAt: string
  updatedAt: string
  template: Pick<SurveyTemplate, 'id' | 'title'> | null
  creator: {
    name: string | null
    email: string
    role: UserRole
  } | null
}

export type DashboardSummary = {
  metrics: {
    totalForms: number
    totalSubmissions: number
    todaySubmissions: number
    pendingSync: number
    activeEmployees: number
  }
  recentSubmissions: Array<{
    referenceCode: string
    respondentName: string
    region: string
    status: SubmissionStatus
    templateTitle: string
    updatedAt: string
  }>
}

export type HistoryItem = {
  id: string
  referenceCode: string
  status: SubmissionStatus
  detail: string
  updatedAt: string
}