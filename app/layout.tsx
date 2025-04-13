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

// system to add email + pwd to the database (api that fetches data from the excel and adds it to db)
// have the same colour for modal
// external databases
// proposal for the project