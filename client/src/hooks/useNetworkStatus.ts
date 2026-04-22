import { useEffect, useSyncExternalStore } from 'react'

// ---------------------------------------------------------------------------
// Shared subscription for navigator.onLine
// ---------------------------------------------------------------------------

type Listener = () => void

const onlineListeners = new Set<Listener>()

function subscribeOnline(listener: Listener): () => void {
  onlineListeners.add(listener)

  const handleOnline = () => {
    for (const l of onlineListeners) l()
  }
  const handleOffline = () => {
    for (const l of onlineListeners) l()
  }

  // Attach only once (when first subscriber arrives)
  if (onlineListeners.size === 1) {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  }

  return () => {
    onlineListeners.delete(listener)
    if (onlineListeners.size === 0) {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
}

function getOnlineSnapshot(): boolean {
  return navigator.onLine
}

function getServerSnapshot(): boolean {
  // During SSR, assume online
  return true
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Reactive hook that returns `true` when the browser is online,
 * `false` when offline.  Uses `useSyncExternalStore` for tear-free reads.
 */
export function useNetworkStatus(): boolean {
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getServerSnapshot)

  // Force re-check after mount in case the value changed during hydration
  useEffect(() => {
    // no-op — the subscription handles everything
  }, [])

  return isOnline
}
