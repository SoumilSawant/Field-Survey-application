type Coords = { lat: number; lng: number }

/**
 * Format a Date as "DD Mon YYYY, HH:MM:SS" using the user's local time.
 * Example: "16 Apr 2025, 14:32:07"
 */
function formatTimestamp(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const day = String(date.getDate()).padStart(2, '0')
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`
}

/**
 * Load a File into an HTMLImageElement via an object URL.
 * Resolves with the loaded image and the object URL (for later revocation).
 */
function loadImage(file: File): Promise<{ img: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, objectUrl })
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Failed to load image: ${file.name}`))
    }
    img.src = objectUrl
  })
}

/**
 * Draw a pill-shaped rounded rectangle on the canvas context.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/**
 * Burn a geo-stamp watermark into an image file using the Canvas API.
 *
 * The watermark is a pill-shaped label at the bottom-left showing:
 *   Line 1: 📍 lat, lng
 *   Line 2: 🕐 DD Mon YYYY, HH:MM:SS
 *
 * Returns a new JPEG File with the watermark baked into the pixel data.
 */
async function stampImage(file: File, coords: Coords | null): Promise<File> {
  // Skip if no GPS coordinates
  if (!coords) {
    return file
  }

  // Skip PDFs
  if (file.type === 'application/pdf') {
    return file
  }

  // Skip non-image files
  if (!file.type.startsWith('image/')) {
    return file
  }

  const { img, objectUrl } = await loadImage(file)

  try {
    const canvas = document.createElement('canvas')
    const width = img.naturalWidth
    const height = img.naturalHeight
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Unable to get canvas 2d context')
    }

    // Draw the original image
    ctx.drawImage(img, 0, 0, width, height)

    // Scale factor for small images (< 800px wide)
    const scale = width < 800 ? width / 800 : 1

    // Font sizes (in canvas pixels)
    const line1FontSize = Math.round(28 * scale)
    const line2FontSize = Math.round(22 * scale)
    const padding = Math.round(16 * scale)
    const margin = Math.round(20 * scale)
    const lineGap = Math.round(6 * scale)
    const cornerRadius = Math.round(12 * scale)

    // Prepare text content
    const line1Text = `📍 ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
    const line2Text = `🕐 ${formatTimestamp(new Date())}`

    // Measure text widths
    ctx.font = `bold ${line1FontSize}px sans-serif`
    const line1Metrics = ctx.measureText(line1Text)
    ctx.font = `normal ${line2FontSize}px sans-serif`
    const line2Metrics = ctx.measureText(line2Text)

    const textWidth = Math.max(line1Metrics.width, line2Metrics.width)
    const barWidth = textWidth + padding * 2
    const barHeight = line1FontSize + line2FontSize + lineGap + padding * 2

    // Position: bottom-left with margin
    const barX = margin
    const barY = height - margin - barHeight

    // Draw semi-transparent dark background with rounded corners
    drawRoundedRect(ctx, barX, barY, barWidth, barHeight, cornerRadius)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.fill()

    // Draw text line 1 (coordinates)
    const textX = barX + padding
    const line1Y = barY + padding + line1FontSize

    ctx.font = `bold ${line1FontSize}px sans-serif`
    ctx.textBaseline = 'alphabetic'

    // 1px black text shadow for legibility
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillText(line1Text, textX + 1, line1Y + 1)

    ctx.fillStyle = '#ffffff'
    ctx.fillText(line1Text, textX, line1Y)

    // Draw text line 2 (timestamp)
    const line2Y = line1Y + lineGap + line2FontSize

    ctx.font = `normal ${line2FontSize}px sans-serif`

    // 1px black text shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillText(line2Text, textX + 1, line2Y + 1)

    ctx.fillStyle = '#ffffff'
    ctx.fillText(line2Text, textX, line2Y)

    // Export as JPEG
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (!result) {
            reject(new Error('Canvas toBlob returned null'))
            return
          }
          resolve(result)
        },
        'image/jpeg',
        0.92,
      )
    })

    return new File([blob], file.name, { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/**
 * Custom hook that provides a `stampImage` function for burning
 * GPS + timestamp watermarks into image files via the Canvas API.
 */
export function useGeoWatermark() {
  return { stampImage }
}
