import { useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextareaAutosize,
  Typography,
  Container
} from '@mui/material'
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Dayjs } from 'dayjs'
import LoadingBackdrop from '@/components/LoadingBackdrop'

type EmailItem = {
  timeUTC: string
  timeLocal: string
  email: string
}

export function AudienceSection() {
  const [mode, setMode] = useState<'single' | 'range'>('single')
  const [startTime, setStartTime] = useState<Dayjs | null>(null)
  const [endTime, setEndTime] = useState<Dayjs | null>(null)
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFetch = async () => {
    const startStr =
      mode === 'single'
        ? startTime?.format('YYYY-MM-DDT00:00:00') || null
        : startTime?.format('YYYY-MM-DDTHH:00:00') || null

    const endStr =
      mode === 'single'
        ? startTime?.format('YYYY-MM-DDT23:59:59') || null
        : endTime?.format('YYYY-MM-DDTHH:59:59') || null

    if (!startStr || !endStr) {
      setError('请选择完整的时间范围')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/emails/by-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: startStr, end: endStr })
      })

      const data = await res.json()
      if (res.ok) {
        setEmails(data.emails || [])
      } else {
        setError(data.error || 'Failed to fetch emails')
      }
    } catch {
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadCSV = () => {
    if (emails.length === 0) return
    const header = 'Received Time (UTC),Received Time (Local),Sender Email'
    const rows = emails.map(
      item => `${item.timeUTC},${item.timeLocal},${item.email}`
    )
    const csvContent = [header, ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'emails.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Container maxWidth='md' sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* 模式选择 */}
        <Box>
          <FormControl>
            <RadioGroup
              row
              value={mode}
              onChange={e => setMode(e.target.value as 'single' | 'range')}
            >
              <FormControlLabel
                value='single'
                control={<Radio />}
                label='单日'
              />
              <FormControlLabel
                value='range'
                control={<Radio />}
                label='日期区间'
              />
            </RadioGroup>
          </FormControl>
        </Box>

        {/* 日期时间选择器 */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack
            direction={{
              xs: 'column',
              sm: mode === 'range' ? 'row' : 'column'
            }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <DateTimePicker
              label='开始时间'
              value={startTime}
              onChange={setStartTime}
              ampm={false}
              views={
                mode === 'range'
                  ? ['year', 'month', 'day', 'hours']
                  : ['year', 'month', 'day']
              }
              format={mode === 'range' ? 'YYYY-MM-DD HH' : 'YYYY-MM-DD'}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
            {mode === 'range' && (
              <DateTimePicker
                label='结束时间'
                value={endTime}
                onChange={setEndTime}
                ampm={false}
                views={['year', 'month', 'day', 'hours']}
                format='YYYY-MM-DD HH'
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            )}
          </Stack>
        </LocalizationProvider>

        {/* 获取按钮 */}
        <Box textAlign='center'>
          <Button
            variant='contained'
            color='primary'
            onClick={handleFetch}
            disabled={isLoading}
            sx={{ minWidth: 120 }}
          >
            获取收件人
          </Button>
          {error && (
            <Typography color='error' mt={1}>
              {error}
            </Typography>
          )}
        </Box>

        {/* 邮件显示 */}
        {emails.length > 0 && (
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <TextareaAutosize
              readOnly
              minRows={Math.max(10, emails.length + 1)}
              style={{
                width: '100%',
                maxWidth: '100%',
                fontFamily: 'monospace',
                padding: '1rem',
                borderRadius: 8,
                border: '1px solid #ccc',
                boxSizing: 'border-box'
              }}
              value={[
                'Received Time (UTC), Received Time (Local), Sender Email',
                ...emails.map(e => `${e.timeUTC}, ${e.timeLocal}, ${e.email}`)
              ].join('\n')}
            />
          </Box>
        )}

        {/* 下载按钮 */}
        <Box textAlign='center'>
          <Button
            variant='contained'
            color='primary'
            disabled={emails.length === 0}
            onClick={handleDownloadCSV}
            sx={{ minWidth: 120 }}
          >
            下载 CSV
          </Button>
        </Box>
      </Stack>
      <LoadingBackdrop isOpen={isLoading} />
    </Container>
  )
}
