import { Router } from 'express'
import { attachUser } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

router.get('/summary', attachUser, async (_req, res, next) => {
  try {
    const [totalForms, totalSubmissions, pendingSync, activeEmployees, recentSubmissions] = await Promise.all([
      prisma.surveyTemplate.count({ where: { isActive: true } }),
      prisma.submission.count(),
      prisma.submission.count({ where: { status: 'PENDING_SYNC' } }),
      prisma.user.count({ where: { role: 'EMPLOYEE' } }),
      prisma.submission.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          template: {
            select: {
              title: true,
            },
          },
        },
      }),
    ])

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todaySubmissions = await prisma.submission.count({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
    })

    return res.json({
      metrics: {
        totalForms,
        totalSubmissions,
        todaySubmissions,
        pendingSync,
        activeEmployees,
      },
      recentSubmissions: recentSubmissions.map((submission) => ({
        referenceCode: submission.referenceCode,
        respondentName: submission.respondentName,
        region: submission.region,
        status: submission.status,
        templateTitle: submission.template?.title ?? 'Unknown form',
        updatedAt: submission.updatedAt,
      })),
    })
  } catch (error) {
    next(error)
  }
})

export default router