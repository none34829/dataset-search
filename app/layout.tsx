import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Inspirit AI',
  description: '',
  icons: {
    icon: '/e3f18e65-7ec7-48b0-b0b1-90b1d806ebea-8.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/e3f18e65-7ec7-48b0-b0b1-90b1d806ebea-8.png" type="image/png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
