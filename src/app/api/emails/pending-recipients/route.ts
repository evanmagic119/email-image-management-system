import { NextResponse } from 'next/server'
import { getPendingRecipients } from '@/lib/getPendingRecipients'

export async function GET() {
  try {
    const emails = await getPendingRecipients()
    return NextResponse.json({ emails })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
