import axios from 'axios'
import { getSession } from './session'
import type { DashboardSummary, HistoryItem, SessionUser, SurveySubmission, SurveyTemplate } from './types'

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const session = getSession()

  if (session) {
    config.headers = config.headers ?? {}
    config.headers['x-user-email'] = session.email
    config.headers['x-user-role'] = session.role
  }

  return config
})

async function unwrap<T>(promise: Promise<{ data: T }>): Promise<T> {
  const response = await promise
  return response.data
}

export async function loginUser(email: string, password: string) {
  return unwrap<{ user: SessionUser }>(apiClient.post('/api/auth/login', { email, password }))
}

export async function getDashboardSummary() {
  return unwrap<DashboardSummary>(apiClient.get('/api/dashboard/summary'))
}

export async function getActiveSurveyTemplates() {
  return unwrap<{ templates: SurveyTemplate[] }>(apiClient.get('/api/surveys/templates/active'))
}

export async function getSurveyTemplate(templateId: string) {
  return unwrap<{ template: SurveyTemplate }>(apiClient.get(`/api/surveys/templates/${templateId}`))
}

export async function createSurveyTemplate(input: {
  title: string
  schemaJson: { questions: Array<{ id: string; label: string; type: 'text' | 'dropdown' | 'radio'; required: boolean; options: string[] }> }
  isActive: boolean
}) {
  return unwrap<{ template: SurveyTemplate }>(apiClient.post('/api/surveys/templates', input))
}

export async function listSubmissions() {
  return unwrap<{ submissions: SurveySubmission[] }>(apiClient.get('/api/submissions'))
}

export async function createSubmission(input: {
  templateId: string
  respondentName: string
  region: string
  notes: string
  responses: Record<string, unknown>
  latitude?: number | null
  longitude?: number | null
  mediaFiles?: File[]
}) {
  const formData = new FormData()
  formData.append('templateId', input.templateId)
  formData.append('respondentName', input.respondentName)
  formData.append('region', input.region)
  formData.append('notes', input.notes)
  formData.append('responses', JSON.stringify(input.responses ?? {}))

  if (typeof input.latitude === 'number') {
    formData.append('latitude', String(input.latitude))
  }

  if (typeof input.longitude === 'number') {
    formData.append('longitude', String(input.longitude))
  }

  for (const file of input.mediaFiles ?? []) {
    formData.append('mediaFiles', file)
  }

  return unwrap<{ submission: SurveySubmission }>(apiClient.post('/api/submissions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }))
}

export async function getSubmissionHistory() {
  return unwrap<{ history: HistoryItem[] }>(apiClient.get('/api/submissions/history'))
}