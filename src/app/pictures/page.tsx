'use client'

import { useState } from 'react'
import { Box, Container, Tab, Tabs } from '@mui/material'
import ImageManager from '@/components/ImageManager'
import GenerateDefaultImageLink from '@/components/UploadDefaultImage'

type TabValue = 'manage' | 'upload'

export default function PictureManagerPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('manage')

  return (
    <Container maxWidth='lg'>
      {/* 顶部 Tab */}
      <Box mt={4} display='flex' justifyContent='center'>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          indicatorColor='primary'
          textColor='primary'
        >
          <Tab label='图片链接生成管理' value='manage' />
          <Tab label='默认图片设置' value='upload' />
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
        {activeTab === 'manage' ? (
          <ImageManager />
        ) : (
          <GenerateDefaultImageLink />
        )}
      </Box>
    </Container>
  )
}
