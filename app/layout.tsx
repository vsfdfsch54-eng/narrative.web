import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClientPageTransition } from "@/components/ui/transitions"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Narrative - Social Connection App",
  description: "Connect through shared stories and experiences",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      </head>
      <body className={inter.className}>
        <ClientPageTransition>{children}</ClientPageTransition>
      </body>
    </html>
  )
}
