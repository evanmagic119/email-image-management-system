// app/api/r2/upload-url/route.ts
import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  }
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const filename = searchParams.get('filename')

  if (!filename) {
    return NextResponse.json({ error: 'Missing filename' }, { status: 400 })
  }

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: filename,
    ContentType: 'application/octet-stream'
  })

  const signedUrl = await getSignedUrl(r2, command, { expiresIn: 60 * 5 })

  return NextResponse.json({ signedUrl })
}
