import app from './app'
import { env } from './config/env'
import { prisma } from './lib/prisma'
import { seedDatabase } from './lib/seed'

async function bootstrap() {
  await prisma.$connect()
  await seedDatabase()

  app.listen(env.PORT, () => {
    console.log(`API server listening on http://localhost:${env.PORT}`)
  })
}

void bootstrap().catch((error) => {
  console.error('Failed to start API server', error)
  process.exit(1)
})
