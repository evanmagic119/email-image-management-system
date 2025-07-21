// lib/email/getPendingSenders.ts
import { ImapFlow } from 'imapflow'

export async function getPendingSenders(
  start: Date,
  end: Date
): Promise<string[]> {
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

  const inboxFromMap = new Map<string, number>()
  const sentToMap = new Map<string, number>()

  // === 收件箱
  await client.mailboxOpen('INBOX')
  for await (const msg of client.fetch('1:*', { envelope: true })) {
    const msgDate = msg.envelope?.date
    const from = msg.envelope?.from?.[0]?.address?.toLowerCase()
    if (msgDate && from) {
      const date = new Date(msgDate)
      if (date >= start && date <= end) {
        inboxFromMap.set(from, (inboxFromMap.get(from) || 0) + 1)
      }
    }
  }

  // ✅ 添加垃圾邮件 [Gmail]/Spam
  await client.mailboxOpen('[Gmail]/Spam')
  for await (const msg of client.fetch('1:*', { envelope: true })) {
    const msgDate = msg.envelope?.date
    const from = msg.envelope?.from?.[0]?.address?.toLowerCase()
    if (msgDate && from) {
      const date = new Date(msgDate)
      if (date >= start && date <= end) {
        inboxFromMap.set(from, (inboxFromMap.get(from) || 0) + 1)
      }
    }
  }

  // === 已发送
  await client.mailboxOpen('[Gmail]/Sent Mail')
  for await (const msg of client.fetch('1:*', { envelope: true })) {
    const msgDate = msg.envelope?.date
    const toList = msg.envelope?.to || []
    const date = new Date(msgDate || 0)
    if (date < start || date > end) continue

    for (const to of toList) {
      const email = to?.address?.toLowerCase()
      if (email) {
        sentToMap.set(email, (sentToMap.get(email) || 0) + 1)
      }
    }
  }

  await client.logout()

  // === 筛选未回复的发件人
  const pending: string[] = []
  for (const [email, count] of inboxFromMap.entries()) {
    const sentCount = sentToMap.get(email) || 0
    if (sentCount < count) pending.push(email)
  }

  return pending
}
