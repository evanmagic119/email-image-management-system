import { NextResponse } from 'next/server'

export async function GET() {
  const defaultImageUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE}/default-image.png`
  const res = await fetch(defaultImageUrl)
  const arrayBuffer = await res.arrayBuffer()

  return new NextResponse(arrayBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    }
  })
}
