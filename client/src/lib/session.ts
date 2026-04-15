import type { SessionUser } from './types'

const SESSION_KEY = 'fieldproj.session'

export function getSession() {
  const value = localStorage.getItem(SESSION_KEY)
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as SessionUser
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function setSession(user: SessionUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}