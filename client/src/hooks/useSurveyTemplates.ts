import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createSurveyTemplate, getActiveSurveyTemplates, getSurveyTemplate } from '../lib/api'

export function useActiveSurveyTemplates() {
  return useQuery({
    queryKey: ['survey-templates', 'active'],
    queryFn: getActiveSurveyTemplates,
    select: (data) => data.templates,
  })
}

export function useSurveyTemplate(templateId?: string) {
  return useQuery({
    queryKey: ['survey-template', templateId],
    queryFn: () => {
      if (!templateId) {
        throw new Error('Template id is required')
      }

      return getSurveyTemplate(templateId)
    },
    enabled: Boolean(templateId),
    select: (data) => data.template,
  })
}

export function useCreateSurveyTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSurveyTemplate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['survey-templates'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}