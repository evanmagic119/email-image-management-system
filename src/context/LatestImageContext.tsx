// context/LatestImageContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type LatestImage = {
  url: string
  key: string
  createdAt: string
} | null

const LatestImageContext = createContext<{
  latestImage: LatestImage
  refreshLatestImage: () => Promise<void>
}>({
  latestImage: null,
  refreshLatestImage: async () => {}
})

export const LatestImageProvider = ({
  children
}: {
  children: React.ReactNode
}) => {
  const [latestImage, setLatestImage] = useState<LatestImage>(null)

  const refreshLatestImage = async () => {
    try {
      const res = await fetch('/api/files/list?page=1&pageSize=1')
      const data = await res.json()
      if (res.ok && data.images.length > 0) {
        const img = data.images[0]
        setLatestImage({
          key: img.key,
          url: `${img.url}`,
          createdAt: img.createdAt
        })
      }
    } catch (err) {
      console.error('刷新图片失败:', err)
    }
  }

  useEffect(() => {
    refreshLatestImage()
  }, [])

  return (
    <LatestImageContext.Provider value={{ latestImage, refreshLatestImage }}>
      {children}
    </LatestImageContext.Provider>
  )
}

export const useLatestImage = () => useContext(LatestImageContext)
