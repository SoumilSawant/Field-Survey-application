import { Router } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

router.get('/active', async (_req, res, next) => {
  try {
    const survey = await prisma.survey.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    })

    if (!survey) {
      return res.status(404).json({ message: 'No active survey available' })
    }

    return res.json({ survey })
  } catch (error) {
    next(error)
  }
})

router.get('/', async (_req, res, next) => {
  try {
    const surveys = await prisma.survey.findMany({ orderBy: { updatedAt: 'desc' } })
    return res.json({ surveys })
  } catch (error) {
    next(error)
  }
})

export default router