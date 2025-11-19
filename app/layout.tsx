import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClientPageTransition } from "@/components/ui/transitions"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Narrative - Social Connection App",
  description: "Connect through shared stories and experiences",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ClientPageTransition>{children}</ClientPageTransition>
      </body>
    </html>
  )
}
