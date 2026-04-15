import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import type { UserRole } from '../../lib/types'
import { getSession } from '../../lib/session'

type RoleGateProps = {
  allowedRoles?: UserRole[]
  redirectTo?: string
  children?: ReactNode
}

function RoleGate({ allowedRoles, redirectTo = '/login', children }: RoleGateProps) {
  const session = getSession()

  if (!session) {
    return <Navigate to={redirectTo} replace />
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export default RoleGate