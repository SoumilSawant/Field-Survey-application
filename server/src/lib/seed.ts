import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const DEFAULT_SURVEY_CODE = 'household-baseline'

const seededUsers = [
  {
    email: 'admin@org.org',
    name: 'Asha Verma',
    password: 'admin123',
    role: 'ADMIN' as const,
  },
  {
    email: 'field@org.org',
    name: 'Ravi Mehta',
    password: 'field123',
    role: 'EMPLOYEE' as const,
  },
]

export async function seedDatabase() {
  const survey = await prisma.survey.upsert({
    where: { code: DEFAULT_SURVEY_CODE },
    create: {
      code: DEFAULT_SURVEY_CODE,
      title: 'Household Baseline Survey',
      description: 'Legacy field collection template for household demographics and outreach tracking.',
      isActive: true,
    },
    update: {
      title: 'Household Baseline Survey',
      description: 'Legacy field collection template for household demographics and outreach tracking.',
      isActive: true,
    },
  })

  const surveyTemplate = await prisma.surveyTemplate.upsert({
    where: { id: 'household-baseline-template' },
    create: {
      id: 'household-baseline-template',
      title: 'Household Baseline Form',
      schemaJson: {
        questions: [
          { id: 'householdName', label: 'Household Name', type: 'text', required: true, options: [] },
          { id: 'ward', label: 'Ward / Region', type: 'dropdown', required: true, options: ['Ward 1', 'Ward 3', 'Ward 7', 'Ward 9', 'Ward 12'] },
          { id: 'visitType', label: 'Visit Type', type: 'radio', required: true, options: ['Initial', 'Follow-up', 'Verification'] },
          { id: 'remarks', label: 'Remarks', type: 'text', required: false, options: [] },
        ],
      },
      isActive: true,
    },
    update: {
      title: 'Household Baseline Form',
      schemaJson: {
        questions: [
          { id: 'householdName', label: 'Household Name', type: 'text', required: true, options: [] },
          { id: 'ward', label: 'Ward / Region', type: 'dropdown', required: true, options: ['Ward 1', 'Ward 3', 'Ward 7', 'Ward 9', 'Ward 12'] },
          { id: 'visitType', label: 'Visit Type', type: 'radio', required: true, options: ['Initial', 'Follow-up', 'Verification'] },
          { id: 'remarks', label: 'Remarks', type: 'text', required: false, options: [] },
        ],
      },
      isActive: true,
    },
  })

  const users = await Promise.all(
    seededUsers.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        create: {
          email: user.email,
          name: user.name,
          passwordHash: bcrypt.hashSync(user.password, 10),
          role: user.role,
        },
        update: {
          name: user.name,
          role: user.role,
        },
      }),
    ),
  )

  const [admin, fieldWorker] = users

  await Promise.all(
    [
      {
        referenceCode: 'SUB-1024',
        respondentName: 'Shreya Patel',
        region: 'Ward 7',
        notes: 'Completed at community center after follow-up call.',
        status: 'SYNCED' as const,
        syncedAt: new Date('2026-04-15T09:12:00.000Z'),
        responseJson: { householdName: 'Shreya Patel', ward: 'Ward 7', visitType: 'Follow-up', remarks: 'Completed at community center.' },
      },
      {
        referenceCode: 'SUB-1025',
        respondentName: 'Ritesh Naik',
        region: 'Ward 3',
        notes: 'Awaiting connectivity restoration for sync.',
        status: 'PENDING_SYNC' as const,
        responseJson: { householdName: 'Ritesh Naik', ward: 'Ward 3', visitType: 'Initial', remarks: 'Offline capture queued.' },
      },
      {
        referenceCode: 'SUB-1026',
        respondentName: 'Anita Rao',
        region: 'Ward 9',
        notes: 'Reviewed and approved by operations desk.',
        status: 'APPROVED' as const,
        syncedAt: new Date('2026-04-15T11:43:00.000Z'),
        responseJson: { householdName: 'Anita Rao', ward: 'Ward 9', visitType: 'Verification', remarks: 'Approved by desk.' },
      },
    ].map((submission, index) =>
      prisma.submission.upsert({
        where: { referenceCode: submission.referenceCode },
        create: {
          referenceCode: submission.referenceCode,
          respondentName: submission.respondentName,
          region: submission.region,
          notes: submission.notes,
          responseJson: submission.responseJson,
          status: submission.status,
          syncedAt: submission.syncedAt ?? null,
          surveyId: survey.id,
          templateId: surveyTemplate.id,
          creatorId: index === 0 ? fieldWorker.id : admin.id,
        },
        update: {
          respondentName: submission.respondentName,
          region: submission.region,
          notes: submission.notes,
          responseJson: submission.responseJson,
          status: submission.status,
          syncedAt: submission.syncedAt ?? null,
          surveyId: survey.id,
          templateId: surveyTemplate.id,
          creatorId: index === 0 ? fieldWorker.id : admin.id,
        },
      }),
    ),
  )
}