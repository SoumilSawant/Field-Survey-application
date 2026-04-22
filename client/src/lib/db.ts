import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OfflineSyncStatus = 'PENDING_SYNC' | 'SYNCING' | 'SYNCED' | 'FAILED'

export interface StoredFile {
  name: string
  type: string
  blob: Blob
}

export interface OfflineSubmission {
  clientId: string
  templateId: string
  respondentName: string
  region: string
  notes: string
  responses: Record<string, string>
  latitude: number | null
  longitude: number | null
  files: StoredFile[]
  status: OfflineSyncStatus
  retryCount: number
  createdAt: string
  lastAttemptAt: string | null
  syncedAt: string | null
  errorMessage: string | null
  userEmail: string
}

export interface DraftFormState {
  templateId: string
  respondentName: string
  region: string
  notes: string
  responses: Record<string, string>
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Database schema
// ---------------------------------------------------------------------------

interface FieldSurveyDB extends DBSchema {
  submissions: {
    key: string
    value: OfflineSubmission
    indexes: {
      'by-status': OfflineSyncStatus
      'by-createdAt': string
    }
  }
  drafts: {
    key: string
    value: DraftFormState
  }
}

// ---------------------------------------------------------------------------
// Singleton connection
// ---------------------------------------------------------------------------

let dbInstance: IDBPDatabase<FieldSurveyDB> | null = null

export async function getDB(): Promise<IDBPDatabase<FieldSurveyDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<FieldSurveyDB>('field-survey-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('submissions')) {
        const store = db.createObjectStore('submissions', { keyPath: 'clientId' })
        store.createIndex('by-status', 'status')
        store.createIndex('by-createdAt', 'createdAt')
      }
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts', { keyPath: 'templateId' })
      }
    },
  })

  return dbInstance
}

// ---------------------------------------------------------------------------
// Submission CRUD
// ---------------------------------------------------------------------------

export async function saveSubmission(submission: OfflineSubmission): Promise<void> {
  const db = await getDB()
  await db.put('submissions', submission)
}

export async function getSubmission(clientId: string): Promise<OfflineSubmission | undefined> {
  const db = await getDB()
  return db.get('submissions', clientId)
}

export async function getPendingSubmissions(): Promise<OfflineSubmission[]> {
  const db = await getDB()
  return db.getAllFromIndex('submissions', 'by-status', 'PENDING_SYNC')
}

export async function getFailedSubmissions(): Promise<OfflineSubmission[]> {
  const db = await getDB()
  return db.getAllFromIndex('submissions', 'by-status', 'FAILED')
}

export async function getAllLocalSubmissions(): Promise<OfflineSubmission[]> {
  const db = await getDB()
  return db.getAll('submissions')
}

export async function updateSubmissionStatus(
  clientId: string,
  status: OfflineSyncStatus,
  errorMessage?: string | null,
): Promise<void> {
  const db = await getDB()
  const submission = await db.get('submissions', clientId)
  if (!submission) return

  submission.status = status

  if (status === 'SYNCED') {
    submission.syncedAt = new Date().toISOString()
    submission.errorMessage = null
  }

  if (status === 'SYNCING' || status === 'FAILED') {
    submission.lastAttemptAt = new Date().toISOString()
  }

  if (status === 'FAILED') {
    submission.retryCount += 1
  }

  if (errorMessage !== undefined) {
    submission.errorMessage = errorMessage
  }

  await db.put('submissions', submission)
}

export async function countPendingSubmissions(): Promise<number> {
  const db = await getDB()
  const pending = await db.countFromIndex('submissions', 'by-status', 'PENDING_SYNC')
  const syncing = await db.countFromIndex('submissions', 'by-status', 'SYNCING')
  const failed = await db.countFromIndex('submissions', 'by-status', 'FAILED')
  return pending + syncing + failed
}

export async function purgeSyncedSubmissions(): Promise<void> {
  const db = await getDB()
  const synced = await db.getAllFromIndex('submissions', 'by-status', 'SYNCED')
  const tx = db.transaction('submissions', 'readwrite')
  const cutoff = Date.now() - 24 * 60 * 60 * 1000 // 24 hours

  for (const sub of synced) {
    if (sub.syncedAt && new Date(sub.syncedAt).getTime() < cutoff) {
      await tx.store.delete(sub.clientId)
    }
  }

  await tx.done
}

// ---------------------------------------------------------------------------
// Draft CRUD
// ---------------------------------------------------------------------------

export async function saveDraft(draft: DraftFormState): Promise<void> {
  const db = await getDB()
  await db.put('drafts', draft)
}

export async function getDraft(templateId: string): Promise<DraftFormState | undefined> {
  const db = await getDB()
  return db.get('drafts', templateId)
}

export async function deleteDraft(templateId: string): Promise<void> {
  const db = await getDB()
  await db.delete('drafts', templateId)
}
