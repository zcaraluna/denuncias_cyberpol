import type { Metadata } from 'next'
import { Inter, Lato } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const lato = Lato({ 
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-lato',
})

export const metadata: Metadata = {
  title: 'Sistema de Denuncias - CYBERPOL',
  description: 'Plataforma para gestión de denuncias policiales',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} ${lato.variable}`}>{children}</body>
    </html>
  )
}

