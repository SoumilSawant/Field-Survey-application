import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createSubmission, getSubmissionHistory, listSubmissions } from '../lib/api'

export function useSubmissions() {
  return useQuery({
    queryKey: ['submissions'],
    queryFn: listSubmissions,
    select: (data) => data.submissions,
  })
}

export function useSubmissionHistory() {
  return useQuery({
    queryKey: ['submission-history'],
    queryFn: getSubmissionHistory,
    select: (data) => data.history,
  })
}

export function useCreateSubmission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSubmission,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['submissions'] })
      await queryClient.invalidateQueries({ queryKey: ['submission-history'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}