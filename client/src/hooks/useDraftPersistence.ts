import { useCallback, useEffect, useRef } from 'react'
import { type DraftFormState, saveDraft, getDraft, deleteDraft } from '../lib/db'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DraftFields {
  respondentName: string
  region: string
  notes: string
  responses: Record<string, string>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Auto-saves form state to IndexedDB on every change (debounced 2s).
 * Restores draft on mount.  Discards draft after successful submission.
 */
export function useDraftPersistence(templateId: string | undefined) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')

  // -- Auto-save (debounced) -----------------------------------------------

  const save = useCallback(
    (fields: DraftFields) => {
      if (!templateId) return

      // Skip if nothing changed
      const fingerprint = JSON.stringify(fields)
      if (fingerprint === lastSavedRef.current) return

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        const draft: DraftFormState = {
          templateId,
          respondentName: fields.respondentName,
          region: fields.region,
          notes: fields.notes,
          responses: fields.responses,
          updatedAt: new Date().toISOString(),
        }

        saveDraft(draft)
          .then(() => {
            lastSavedRef.current = fingerprint
          })
          .catch(() => {
            // Non-critical — silent fail
          })
      }, 2_000)
    },
    [templateId],
  )

  // -- Restore draft from IndexedDB ----------------------------------------

  const restore = useCallback(async (): Promise<DraftFields | null> => {
    if (!templateId) return null

    try {
      const draft = await getDraft(templateId)
      if (!draft) return null

      lastSavedRef.current = JSON.stringify({
        respondentName: draft.respondentName,
        region: draft.region,
        notes: draft.notes,
        responses: draft.responses,
      })

      return {
        respondentName: draft.respondentName,
        region: draft.region,
        notes: draft.notes,
        responses: draft.responses,
      }
    } catch {
      return null
    }
  }, [templateId])

  // -- Discard draft -------------------------------------------------------

  const discard = useCallback(async (): Promise<void> => {
    if (!templateId) return

    lastSavedRef.current = ''

    try {
      await deleteDraft(templateId)
    } catch {
      // Non-critical
    }
  }, [templateId])

  // -- Cleanup debounce timer on unmount -----------------------------------

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return { save, restore, discard }
}
