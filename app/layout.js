// app/layout.js
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata = {
  title: 'Danendra N Rs | Portfolio',
  description: 'Web Developer & UI/UX Enthusiast',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      {/* Kita menambahkan FontAwesome untuk ikon sosial media */}
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-white text-gray-900`}>
        {children}
      </td>
    </html>
  )
}
