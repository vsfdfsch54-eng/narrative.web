import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClientPageTransition } from "@/components/ui/transitions"
import { FullscreenEnforcer } from "@/components/layout/fullscreen-enforcer"

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
    <html lang="en" className="dark w-full h-full min-h-screen bg-black">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`${inter.className} w-full h-full min-h-screen bg-black`}>
        <FullscreenEnforcer />
        <ClientPageTransition>{children}</ClientPageTransition>
      </body>
    </html>
  )
}
