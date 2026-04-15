import { Router } from 'express'
import { z } from 'zod'
import { attachUser, requireRole } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

const questionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'dropdown', 'radio']),
  required: z.boolean().default(false),
  options: z.array(z.string()).default([]),
})

const templateSchema = z.object({
  title: z.string().min(2),
  schemaJson: z.object({
    questions: z.array(questionSchema).min(1),
  }),
  isActive: z.boolean().default(true),
})

router.post('/templates', attachUser, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const payload = templateSchema.parse(req.body)

    const template = await prisma.surveyTemplate.create({
      data: {
        title: payload.title,
        schemaJson: payload.schemaJson,
        isActive: payload.isActive,
      },
    })

    res.status(201).json({ template })
  } catch (error) {
    next(error)
  }
})

router.get('/templates/active', attachUser, requireRole('EMPLOYEE', 'ADMIN'), async (_req, res, next) => {
  try {
    const templates = await prisma.surveyTemplate.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        schemaJson: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.json({ templates })
  } catch (error) {
    next(error)
  }
})

router.get('/templates/:templateId', attachUser, async (req, res, next) => {
  try {
    const templateId = Array.isArray(req.params.templateId) ? req.params.templateId[0] : req.params.templateId
    const template = await prisma.surveyTemplate.findUnique({
      where: { id: templateId },
    })

    if (!template) {
      res.status(404).json({ message: 'Template not found' })
      return
    }

    res.json({ template })
  } catch (error) {
    next(error)
  }
})

export default router