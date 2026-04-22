import { API_BASE_URL } from './api'
import {
  type OfflineSubmission,
  getPendingSubmissions,
  getFailedSubmissions,
  updateSubmissionStatus,
  purgeSyncedSubmissions,
} from './db'
import { getSession } from './session'

// ---------------------------------------------------------------------------
// Event system
// ---------------------------------------------------------------------------

export type SyncEventType =
  | 'sync-start'
  | 'sync-complete'
  | 'sync-error'
  | 'submission-synced'
  | 'submission-failed'

export interface SyncEvent {
  type: SyncEventType
  clientId?: string
  error?: string
  totalPending?: number
  totalSynced?: number
}

type SyncListener = (event: SyncEvent) => void

// ---------------------------------------------------------------------------
// Sync engine (singleton)
// ---------------------------------------------------------------------------

class SyncEngine {
  private isRunning = false
  private intervalId: ReturnType<typeof setInterval> | null = null
  private listeners: Set<SyncListener> = new Set()

  private static readonly SYNC_INTERVAL_MS = 30_000
  private static readonly MAX_RETRIES = 10
  private static readonly BASE_BACKOFF_MS = 1_000
  private static readonly MAX_BACKOFF_MS = 60_000
  private static readonly UPLOAD_TIMEOUT_MS = 30_000

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  start(): void {
    if (this.intervalId !== null) return

    // Initial sync attempt
    void this.sync()

    // Periodic sync
    this.intervalId = setInterval(() => {
      if (navigator.onLine) {
        void this.sync()
      }
    }, SyncEngine.SYNC_INTERVAL_MS)

    window.addEventListener('online', this.handleOnline)
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    window.removeEventListener('online', this.handleOnline)
  }

  // -----------------------------------------------------------------------
  // Event subscription
  // -----------------------------------------------------------------------

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private emit(event: SyncEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch {
        // Listener errors must never break the engine
      }
    }
  }

  // -----------------------------------------------------------------------
  // Core sync logic
  // -----------------------------------------------------------------------

  private handleOnline = (): void => {
    void this.sync()
  }

  async sync(): Promise<void> {
    // Mutex — prevent concurrent sync runs
    if (this.isRunning) return
    if (!navigator.onLine) return

    // Don't attempt sync without an active session
    const session = getSession()
    if (!session) return

    this.isRunning = true

    try {
      // Collect sync-eligible submissions
      const pending = await getPendingSubmissions()
      const failed = await getFailedSubmissions()
      const retryable = failed.filter((sub) => this.isEligibleForRetry(sub))

      // Promote retryable FAILED → PENDING_SYNC
      for (const sub of retryable) {
        await updateSubmissionStatus(sub.clientId, 'PENDING_SYNC')
      }

      const queue = [...pending, ...retryable]
      if (queue.length === 0) {
        // Housekeeping: purge old synced records
        await purgeSyncedSubmissions().catch(() => {
          /* non-critical */
        })
        return
      }

      this.emit({ type: 'sync-start', totalPending: queue.length })

      let syncedCount = 0

      // Sequential processing — no parallel race conditions
      for (const submission of queue) {
        if (!navigator.onLine) break // Lost connectivity mid-sync

        try {
          await this.syncOneSubmission(submission)
          syncedCount++
          this.emit({ type: 'submission-synced', clientId: submission.clientId })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown sync error'
          await updateSubmissionStatus(submission.clientId, 'FAILED', message)
          this.emit({ type: 'submission-failed', clientId: submission.clientId, error: message })
        }
      }

      this.emit({ type: 'sync-complete', totalSynced: syncedCount })

      // Housekeeping
      await purgeSyncedSubmissions().catch(() => {
        /* non-critical */
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync engine error'
      this.emit({ type: 'sync-error', error: message })
    } finally {
      this.isRunning = false
    }
  }

  // -----------------------------------------------------------------------
  // Single-submission sync
  // -----------------------------------------------------------------------

  private async syncOneSubmission(submission: OfflineSubmission): Promise<void> {
    await updateSubmissionStatus(submission.clientId, 'SYNCING')

    const session = getSession()
    if (!session) {
      throw new Error('No active session — cannot sync')
    }

    // Reconstruct multipart/form-data matching existing Multer contract
    const formData = new FormData()
    formData.append('clientId', submission.clientId)
    formData.append('templateId', submission.templateId)
    formData.append('respondentName', submission.respondentName)
    formData.append('region', submission.region)
    formData.append('notes', submission.notes)
    formData.append('responses', JSON.stringify(submission.responses))

    if (submission.latitude !== null) {
      formData.append('latitude', String(submission.latitude))
    }
    if (submission.longitude !== null) {
      formData.append('longitude', String(submission.longitude))
    }

    // Rebuild File objects from stored Blobs
    for (const stored of submission.files) {
      const file = new File([stored.blob], stored.name, { type: stored.type })
      formData.append('mediaFiles', file)
    }

    // Timeout via AbortController
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), SyncEngine.UPLOAD_TIMEOUT_MS)

    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions`, {
        method: 'POST',
        headers: {
          'x-user-email': session.email,
          'x-user-role': session.role,
        },
        body: formData,
        signal: controller.signal,
      })

      if (response.status === 201) {
        // Created successfully
        await updateSubmissionStatus(submission.clientId, 'SYNCED')
        return
      }

      if (response.status === 409) {
        // Duplicate — already synced on a prior attempt.  Mark local as SYNCED.
        await updateSubmissionStatus(submission.clientId, 'SYNCED')
        return
      }

      // Any other status is a failure
      const body = await response.json().catch(() => ({ message: 'Unknown server error' }))
      const parsed = body as { message?: string; issues?: Array<{ path: string[]; message: string }> }

      // Handle Zod validation errors (Express returns issues array)
      if (Array.isArray(parsed.issues) && parsed.issues.length > 0) {
        const fieldErrors = parsed.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ')
        throw new Error(`Validation failed — ${fieldErrors}`)
      }

      throw new Error(parsed.message ?? `HTTP ${response.status}`)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Upload timed out after 30 seconds')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  // -----------------------------------------------------------------------
  // Exponential backoff
  // -----------------------------------------------------------------------

  private isEligibleForRetry(submission: OfflineSubmission): boolean {
    if (submission.retryCount >= SyncEngine.MAX_RETRIES) return false
    if (!submission.lastAttemptAt) return true

    const elapsed = Date.now() - new Date(submission.lastAttemptAt).getTime()
    return elapsed >= this.calculateBackoff(submission.retryCount)
  }

  private calculateBackoff(retryCount: number): number {
    // 1s, 2s, 4s, 8s, 16s, 32s, capped at 60s
    const ms = SyncEngine.BASE_BACKOFF_MS * Math.pow(2, retryCount)
    return Math.min(ms, SyncEngine.MAX_BACKOFF_MS)
  }

  get running(): boolean {
    return this.isRunning
  }
}

export const syncEngine = new SyncEngine()
