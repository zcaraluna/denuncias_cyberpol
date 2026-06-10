import type { Metadata } from 'next'
import { Inter, Lato } from 'next/font/google'
import './globals.css'
import { BorradorProvider } from '@/lib/context/BorradorContext'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })
const lato = Lato({ 
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-lato',
})

export const metadata: Metadata = {
  title: 'Sistema de Denuncias - SIDE',
  description: 'Plataforma para gestión de denuncias policiales',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SIDE',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport = {
  themeColor: '#002147',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} ${lato.variable}`}>
        <BorradorProvider>
          {children}
          <Toaster
            position="bottom-right"
            richColors
            duration={3000}
            toastOptions={{
              style: { fontSize: '12px', fontWeight: '600' },
            }}
          />
        </BorradorProvider>
      </body>
    </html>
  )
}

