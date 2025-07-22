// app/layout.tsx
import type { Metadata } from 'next'
import { Providers } from '@/app/providers'
import LayoutContent from '@/components/LayoutContent'
import { LatestImageProvider } from '@/context/LatestImageContext' // ✅ 引入你刚创建的组件

export const metadata: Metadata = {
  title: '邮件图片管理系统',
  description: '邮件图片管理系统'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='zh'>
      <body>
        <Providers>
          <LatestImageProvider>
            <LayoutContent>{children}</LayoutContent>
          </LatestImageProvider>
        </Providers>
      </body>
    </html>
  )
}
