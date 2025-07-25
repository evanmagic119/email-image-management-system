// app/api/emails/auto-reply/get/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const setting = await prisma.autoReplySetting.findFirst()

    if (!setting) {
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({
      exists: true,
      data: {
        subject: setting.subject,
        body: setting.body,
        rawBody: setting.rawBody,
        mode: setting.mode,
        isUsingLatestImage: setting.isUsingLatestImage,
        replyTime: setting.replyTime,
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
