'use client'

import { useEffect, useState } from 'react'
import { Box, Container, Tab, Tabs, Typography } from '@mui/material'
import { AudienceSection } from '@/components/AudienceSection'
import { AutoReplySection } from '@/components/AutoReplySection'

type TabValue = 'autoReply' | 'audience'

export default function EmailManagerPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('autoReply')
  const [utcFormatted, setUtcFormatted] = useState('')
  const [localFormatted, setLocalFormatted] = useState('')

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date()

      const utcFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      })

      const localFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'longOffset'
      })

      setUtcFormatted(utcFormatter.format(now))
      setLocalFormatted(localFormatter.format(now))
    }

    updateTimes()
    const interval = setInterval(updateTimes, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Container maxWidth='lg'>
      {/* 时区信息 */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          textAlign: 'center'
        }}
      >
        <Typography variant='body2' color='textSecondary'>
          UTC 时间：{utcFormatted}
        </Typography>
        <Typography variant='body2' color='textSecondary'>
          本地时间：{localFormatted}
        </Typography>
      </Box>

      {/* Tab 切换 */}
      <Box mt={4} display='flex' justifyContent='center'>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          indicatorColor='primary'
          textColor='primary'
        >
          <Tab label='自动回复设置' value='autoReply' />
          <Tab label='观众邮箱地址管理' value='audience' />
        </Tabs>
      </Box>

      {/* 内容区域 */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        {activeTab === 'autoReply' ? <AutoReplySection /> : <AudienceSection />}
      </Box>
    </Container>
  )
}
