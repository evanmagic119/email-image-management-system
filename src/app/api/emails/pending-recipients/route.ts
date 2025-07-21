import { NextResponse } from 'next/server'
import { getPendingSenders } from '@/lib/getPendingSenders'

export async function GET() {
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - 12 * 60 * 60 * 1000)

  try {
    const emails = await getPendingSenders(startDate, endDate)
    return NextResponse.json({ emails })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
