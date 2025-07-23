// lib/email/imapUtils.ts
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export const getTimeRange = (hoursAgo: number = 1) => {
  const now = new Date()
  const start = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)
  return { start, end: now }
}

export const formatEmailTime = (date: Date, timezone: string = 'UTC') => {
  return {
    timeUTC: dayjs(date).utc().format('MMMM D, YYYY [at] hh:mm A [UTC]'),
    timeLocal: dayjs(date).tz(timezone).format('MMMM D, YYYY [at] hh:mm A [Z]')
  }
}
