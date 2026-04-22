import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { useOfflineSync } from '../../hooks/useOfflineSync'

/**
 * Compact banner that shows:
 *  • 🔴 "Offline — submissions queued locally" when navigator.onLine is false
 *  • 🟡 "N pending sync" when online but items are queued
 *  • 🔄 "Syncing..." animation when engine is actively uploading
 *  • Nothing when online and queue is empty
 */
function OfflineBanner() {
  const isOnline = useNetworkStatus()
  const { pendingCount, isSyncing, triggerSync } = useOfflineSync()

  if (!isOnline) {
    return (
      <div className="border-b border-[var(--color-error)] bg-[var(--color-error-container)] px-4 py-2 text-center text-xs font-semibold text-[var(--color-error)]">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--color-error)]" />
        Offline — submissions are queued locally
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="border-b border-[var(--color-primary)] bg-[var(--color-primary-container)]/10 px-4 py-2 text-center text-xs font-semibold text-[var(--color-primary)]">
        <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
        Syncing {pendingCount} submission{pendingCount !== 1 ? 's' : ''}…
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className="border-b border-outline-variant bg-[var(--color-tertiary-fixed)] px-4 py-2 text-center text-xs font-semibold text-[var(--color-tertiary)]">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--color-tertiary)]" />
        {pendingCount} submission{pendingCount !== 1 ? 's' : ''} pending sync
        <button
          type="button"
          onClick={triggerSync}
          className="ml-3 rounded-radius-chip border border-[var(--color-tertiary)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--color-tertiary)] hover:text-white transition-colors"
        >
          Retry now
        </button>
      </div>
    )
  }

  return null
}

export default OfflineBanner
