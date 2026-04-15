import { Router } from 'express'
import type { Request } from 'express'
import { z } from 'zod'
import { upload } from '../config/upload'
import { attachUser } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

const createSubmissionSchema = z.object({
  templateId: z.string().min(1),
  respondentName: z.string().min(2),
  region: z.string().min(2),
  notes: z.string().optional().default(''),
  responses: z.string().optional().default('{}'),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
})

const responsesSchema = z.record(z.string(), z.unknown())

function parseOptionalFloat(value?: string) {
  if (!value || value.trim() === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseResponses(input: string) {
  try {
    const parsed = JSON.parse(input)
    return responsesSchema.parse(parsed)
  } catch {
    return {}
  }
}

function formatSubmission(submission: {
  id: string
  referenceCode: string
  respondentName: string
  region: string
  notes: string | null
  responseJson: unknown | null
  latitude: number | null
  longitude: number | null
  mediaUrls: unknown | null
  status: string
  syncedAt: Date | null
  createdAt: Date
  updatedAt: Date
  template?: { id: string; title: string } | null
  creator?: { name: string | null; email: string; role: string } | null
}) {
  return {
    id: submission.id,
    referenceCode: submission.referenceCode,
    respondentName: submission.respondentName,
    region: submission.region,
    notes: submission.notes ?? '',
    responseJson: submission.responseJson,
    latitude: submission.latitude,
    longitude: submission.longitude,
    mediaUrls: Array.isArray(submission.mediaUrls)
      ? submission.mediaUrls.filter((entry): entry is string => typeof entry === 'string')
      : [],
    status: submission.status,
    syncedAt: submission.syncedAt,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
    template: submission.template,
    creator: submission.creator,
  }
}

router.get('/', attachUser, async (_req, res, next) => {
  try {
    const submissions = await prisma.submission.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: {
            title: true,
            id: true,
          },
        },
        creator: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    return res.json({ submissions: submissions.map(formatSubmission) })
  } catch (error) {
    next(error)
  }
})

router.post('/', attachUser, upload.array('mediaFiles', 6), async (req, res, next) => {
  try {
    const payload = createSubmissionSchema.parse(req.body)
    const uploadedFiles = (req.files as Express.Multer.File[] | undefined) ?? []
    const mediaUrls = uploadedFiles.map((file) => `/uploads/${file.filename}`)
    const responses = parseResponses(payload.responses)
    const latitude = parseOptionalFloat(payload.latitude)
    const longitude = parseOptionalFloat(payload.longitude)

    const template = await prisma.surveyTemplate.findUnique({ where: { id: payload.templateId } })

    if (!template || !template.isActive) {
      return res.status(400).json({ message: 'No active template available for submissions' })
    }

    const creator = res.locals.user as { id: string } | undefined

    const submissionCount = await prisma.submission.count()
    const referenceCode = `SUB-${String(2000 + submissionCount + 1)}`

    const submission = await prisma.submission.create({
      data: {
        referenceCode,
        respondentName: payload.respondentName,
        region: payload.region,
        notes: payload.notes.trim() || null,
        responseJson: responses as never,
        latitude,
        longitude,
        mediaUrls: mediaUrls as never,
        status: 'PENDING_SYNC',
        syncedAt: null,
        templateId: template.id,
        creatorId: creator?.id ?? null,
      },
      include: {
        template: {
          select: {
            title: true,
            id: true,
          },
        },
        creator: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    return res.status(201).json({ submission: formatSubmission(submission) })
  } catch (error) {
    next(error)
  }
})

router.get('/history', attachUser, async (_req, res, next) => {
  try {
    const submissions = await prisma.submission.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      take: 10,
    })

    const history = submissions.map((submission) => ({
      id: submission.id,
      referenceCode: submission.referenceCode,
      status: submission.status,
      detail: `${submission.referenceCode} ${submission.status.toLowerCase().replace('_', ' ')} by ${submission.creator?.name ?? submission.creator?.email ?? 'system'}`,
      updatedAt: submission.updatedAt,
    }))

    return res.json({ history })
  } catch (error) {
    next(error)
  }
})

export default router