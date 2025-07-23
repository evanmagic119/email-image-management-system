// lib/email/getPendingRecipients.ts
import { ImapFlow } from 'imapflow'
import { getTimeRange } from './imapUtils'

export async function getPendingRecipients(): Promise<string[]> {
  const { start, end } = getTimeRange(1)

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

  await client.connect()
  const fromSet = new Set<string>()

  const fetchFromMailbox = async (mailbox: string) => {
    await client.mailboxOpen(mailbox)
    for await (const msg of client.fetch('1:*', { envelope: true })) {
      const msgDate = msg.envelope?.date
      const from = msg.envelope?.from?.[0]?.address?.toLowerCase()
      if (msgDate && from) {
        const date = new Date(msgDate)
        if (date >= start && date <= end && from !== process.env.EMAIL_USER!) {
          fromSet.add(from)
        }
      }
    }
  }

  await fetchFromMailbox('INBOX')
  await fetchFromMailbox('[Gmail]/Spam')

  await client.logout()
  return Array.from(fromSet)
}
