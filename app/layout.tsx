import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import '@mysten/dapp-kit/dist/index.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import './globals.css'
import { SuiProvider } from '@/providers/sui-provider'
import { MemoryStoreProvider } from '@/store/memory-store'

export const metadata: Metadata = {
  title: 'EchoMap - The World Never Forgets',
  description: 'Preserve memories, culture, and history permanently on Walrus and Sui. A decentralized world memory archive.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-background text-foreground">
        <SuiProvider>
          <MemoryStoreProvider>{children}</MemoryStoreProvider>
        </SuiProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
