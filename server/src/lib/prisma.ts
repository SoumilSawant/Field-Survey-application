import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../../generated/prisma/client'
import { env } from '../config/env'

const databaseUrl = env.DATABASE_URL
const sqlitePath = databaseUrl.startsWith('file:') ? databaseUrl.replace(/^file:/, '') : databaseUrl

const adapter = new PrismaBetterSqlite3({ url: sqlitePath })

export const prisma = new PrismaClient({ adapter })