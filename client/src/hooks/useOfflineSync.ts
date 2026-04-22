import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  type OfflineSubmission,
  type OfflineSyncStatus,
  type StoredFile,
  getAllLocalSubmissions,
  saveSubmission,
  countPendingSubmissions,
  deleteDraft,
} from '../lib/db'
import { syncEngine, type SyncEvent } from '../lib/sync'
import { getSession } from '../lib/session'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SyncState {
  isSyncing: boolean
  pendingCount: number
  lastSyncError: string | null
  submissions: OfflineSubmission[]
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOfflineSync() {
  const queryClient = useQueryClient()

  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncError: null,
    submissions: [],
  })

  // -- Refresh local state from IndexedDB ------------------------------------

  const refreshState = useCallback(async () => {
    try {
      const [all, pending] = await Promise.all([
        getAllLocalSubmissions(),
        countPendingSubmissions(),
      ])
      setState((prev) => ({
        ...prev,
        submissions: all,
        pendingCount: pending,
      }))
    } catch {
      // IndexedDB read failure — keep stale state
    }
  }, [])

  // -- Subscribe to sync engine events ---------------------------------------

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((event: SyncEvent) => {
      switch (event.type) {
        case 'sync-start':
          setState((prev) => ({ ...prev, isSyncing: true, lastSyncError: null }))
          break

        case 'sync-complete':
          setState((prev) => ({ ...prev, isSyncing: false }))
          // Invalidate React Query caches so server data refreshes
          void queryClient.invalidateQueries({ queryKey: ['submissions'] })
          void queryClient.invalidateQueries({ queryKey: ['submission-history'] })
          void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
          void refreshState()
          break

        case 'sync-error':
          setState((prev) => ({
            ...prev,
            isSyncing: false,
            lastSyncError: event.error ?? 'Unknown error',
          }))
          void refreshState()
          break

        case 'submission-synced':
        case 'submission-failed':
          void refreshState()
          break
      }
    })

    // Start the engine (idempotent — safe to call multiple times)
    syncEngine.start()
    void refreshState()

    return unsubscribe
  }, [queryClient, refreshState])

  // -- Save a submission locally (offline-first) -----------------------------

  const saveOfflineSubmission = useCallback(
    async (input: {
      templateId: string
      respondentName: string
      region: string
      notes: string
      responses: Record<string, string>
      latitude: number | null
      longitude: number | null
      mediaFiles: File[]
    }): Promise<string> => {
      const clientId = crypto.randomUUID()

      const session = getSession()
      const userEmail = session?.email ?? 'unknown'

      // Convert File objects to IndexedDB-storable blobs
      const storedFiles: StoredFile[] = await Promise.all(
        input.mediaFiles.map(async (file): Promise<StoredFile> => ({
          name: file.name,
          type: file.type,
          blob: new Blob([await file.arrayBuffer()], { type: file.type }),
        })),
      )

      const submission: OfflineSubmission = {
        clientId,
        templateId: input.templateId,
        respondentName: input.respondentName,
        region: input.region,
        notes: input.notes,
        responses: input.responses,
        latitude: input.latitude,
        longitude: input.longitude,
        files: storedFiles,
        status: 'PENDING_SYNC' as OfflineSyncStatus,
        retryCount: 0,
        createdAt: new Date().toISOString(),
        lastAttemptAt: null,
        syncedAt: null,
        errorMessage: null,
        userEmail,
      }

      await saveSubmission(submission)

      // Remove draft for this template (submission supersedes it)
      await deleteDraft(input.templateId).catch(() => {
        /* non-critical */
      })

      await refreshState()

      // Trigger immediate sync if online
      if (navigator.onLine) {
        void syncEngine.sync()
      }

      return clientId
    },
    [refreshState],
  )

  // -- Manual sync trigger ---------------------------------------------------

  const triggerSync = useCallback(() => {
    void syncEngine.sync()
  }, [])

  return {
    ...state,
    saveOfflineSubmission,
    triggerSync,
  }
}
