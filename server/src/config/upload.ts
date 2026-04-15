import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'

export const uploadsDir = path.resolve(process.cwd(), 'uploads')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir)
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname)
    const safeBaseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 40)

    callback(null, `${Date.now()}-${safeBaseName || 'upload'}${extension}`)
  },
})

export const upload = multer({ storage })