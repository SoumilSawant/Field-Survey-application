import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'node:path'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import authRouter from './routes/auth'
import dashboardRouter from './routes/dashboard'
import healthRouter from './routes/health'
import submissionsRouter from './routes/submissions'
import surveyTemplatesRouter from './routes/surveyTemplates'

const app = express()

app.use(helmet())
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')))

app.get('/', (_req, res) => {
  res.json({ message: 'Resilient Ledger API' })
})

app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/surveys', surveyTemplatesRouter)
app.use('/api/submissions', submissionsRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
