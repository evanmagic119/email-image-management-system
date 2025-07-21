// app/api/files/list/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  }
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '12', 10)

    const listRes = await r2.send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME!,
        MaxKeys: 1000
      })
    )

    const files = listRes.Contents || []

    const sorted = files
      .filter(file => !!file.Key && /^\d{14}\.png$/.test(file.Key))
      .sort((a, b) => {
        const aTime = parseInt(a.Key!.slice(0, 14), 10)
        const bTime = parseInt(b.Key!.slice(0, 14), 10)
        return bTime - aTime
      })

    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paged = sorted.slice(start, end)

    const result = paged.map(obj => {
      const match = obj.Key!.match(
        /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/
      )
      const createdAt = match
        ? `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}`
        : null

      return {
        key: obj.Key!,
        url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE}/${obj.Key}`,
        createdAt
      }
    })

    const hasMore = end < sorted.length

    return NextResponse.json({ images: result, hasMore })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
