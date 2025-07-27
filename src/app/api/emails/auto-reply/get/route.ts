import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DateTime } from 'luxon'

export async function GET() {
  try {
    const setting = await prisma.autoReplySetting.findFirst()

    if (!setting) {
      return NextResponse.json({ exists: false })
    }

    // ✅ 拆分 replyTime（形如 2025-07-27T19:08@America/Halifax）
    const [dateTimeStr, timeZone] = setting.replyTime.split('@')
    const parsed = DateTime.fromISO(dateTimeStr, { zone: timeZone || 'UTC' })

    return NextResponse.json({
      exists: true,
      data: {
        subject: setting.subject,
        body: setting.body,
        rawBody: setting.rawBody,
        mode: setting.mode,
        isUsingLatestImage: setting.isUsingLatestImage,
        replyTime: parsed.toFormat('HH:mm'),
        imageUrl: setting.imageUrl,
        attachmentUrl: setting.attachmentUrl,
        isActive: setting.isActive
      }
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
