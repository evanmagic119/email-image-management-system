export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  }
})

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const filename = formData.get('filename') as string

  if (!file || !filename) {
    return NextResponse.json({ error: 'Missing filename' }, { status: 400 })
  }

  const allowedExtensions = [
    'pdf',
    'docx',
    'xlsx',
    'zip',
    'csv',
    'txt',
    'png',
    'jpg',
    'jpeg',
    'webp'
  ]
  const fileExtension = filename.split('.').pop()?.toLowerCase() || ''

  const isImage = /^\d{14}\.(png|jpe?g|webp)$/.test(filename)

  const isAttachment = allowedExtensions.includes(fileExtension)

  if (!isImage && !isAttachment) {
    return NextResponse.json(
      {
        error:
          'Invalid filename: must be an image or a supported attachment type',
        hint: 'Images must be named with a 14-digit timestamp (e.g. 20250719123045.png); attachments must be of supported types like pdf, docx, etc.'
      },
      { status: 400 }
    )
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: filename,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream'
      })
    )

    const url = `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE}/${filename}`
    return NextResponse.json({ success: true, url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
