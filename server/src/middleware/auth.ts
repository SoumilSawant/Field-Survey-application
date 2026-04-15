import type { NextFunction, Request, Response } from 'express'
import type { UserRole } from '../../generated/prisma/client'
import { prisma } from '../lib/prisma'

type AuthenticatedUser = {
  id: string
  email: string
  name: string | null
  role: UserRole
}

function getHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export async function attachUser(req: Request, res: Response, next: NextFunction) {
  const email = getHeaderValue(req.headers['x-user-email'])

  if (!email) {
    res.status(401).json({ message: 'Missing session context' })
    return
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  })

  if (!user) {
    res.status(401).json({ message: 'Invalid session' })
    return
  }

  res.locals.user = user satisfies AuthenticatedUser
  next()
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user as AuthenticatedUser | undefined

    if (!user) {
      res.status(401).json({ message: 'Authentication required' })
      return
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' })
      return
    }

    next()
  }
}

export function requireSession(req: Request, res: Response, next: NextFunction) {
  void attachUser(req, res, next)
}