import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/600.css'
import '@fontsource/fraunces/400.css'
import '@fontsource/fraunces/500.css'
import '@fontsource/fraunces/400-italic.css'
import type { Metadata, Viewport } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: 'Lake Mary',
  description: 'The family cabin: who’s going up, what needs doing, and how everything works.'
}
export const viewport: Viewport = { themeColor: '#f4efe4' }
export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
