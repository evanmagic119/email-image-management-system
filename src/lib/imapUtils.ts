// lib/email/imapUtils.ts
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

export const getTimeRange = (hoursAgo: number = 1) => {
  const now = new Date()
  const start = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)
  return { start, end: now }
}

dayjs.extend(utc)
dayjs.extend(timezone)

export const formatEmailTime = (date: Date, timeZone: string = 'UTC') => {
  return {
    timeUTC: dayjs(date).utc().format('MMMM D, YYYY [at] hh:mm A [UTC]'),
    timeLocal: dayjs.tz(date, timeZone).format('MMMM D, YYYY [at] hh:mm A [z]')
  }
}
