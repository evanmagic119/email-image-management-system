// api/emails/by-date
import { ImapFlow } from 'imapflow'
import { NextRequest, NextResponse } from 'next/server'
import { formatEmailTime } from '@/lib/imapUtils'

export async function POST(req: NextRequest) {
  const { start, end, timezone = 'UTC' } = await req.json()

  if (!start || !end) {
    return NextResponse.json(
      { error: 'Missing start or end time' },
      { status: 400 }
    )
  }

  const startTime = new Date(start)
  const endTime = new Date(end)

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!
    },
    logger: false
  })

  try {
    await client.connect()

    const emailList: { timeUTC: string; timeLocal: string; email: string }[] =
      []

    const fetchEmails = async (mailbox: string) => {
      await client.mailboxOpen(mailbox)
      for await (const msg of client.fetch('1:*', { envelope: true })) {
        const msgDate = msg.envelope?.date
        const from = msg.envelope?.from?.[0]?.address
        if (msgDate && from) {
          const date = new Date(msgDate)
          if (
            date >= startTime &&
            date <= endTime &&
            from !== process.env.EMAIL_USER!
          ) {
            const { timeUTC, timeLocal } = formatEmailTime(date, timezone)

            emailList.push({ timeUTC, timeLocal, email: from })
          }
        }
      }
    }

    await fetchEmails('INBOX')
    await fetchEmails('[Gmail]/Spam')

    await client.logout()
    return NextResponse.json({ emails: emailList })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('IMAP error:', err)
    await client.logout()
    return NextResponse.json(
      { error: 'IMAP read failed', detail: message },
      { status: 500 }
    )
  }
}
