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
    <html lang="en" className="dark bg-black">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#000000" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent zoom on double tap
              let lastTouchEnd = 0;
              document.addEventListener('touchend', function (event) {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                  event.preventDefault();
                }
                lastTouchEnd = now;
              }, false);
              
              // Prevent zoom gestures
              document.addEventListener('gesturestart', function (e) {
                e.preventDefault();
              });
              
              document.addEventListener('gesturechange', function (e) {
                e.preventDefault();
              });
              
              document.addEventListener('gestureend', function (e) {
                e.preventDefault();
              });
              
              // Prevent pinch zoom
              document.addEventListener('wheel', function (e) {
                if (e.ctrlKey) {
                  e.preventDefault();
                }
              }, { passive: false });
              
              // Lock viewport
              function lockViewport() {
                const viewport = document.querySelector('meta[name=viewport]');
                if (viewport) {
                  viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover');
                }
              }
              
              lockViewport();
              window.addEventListener('resize', lockViewport);
              window.addEventListener('orientationchange', lockViewport);
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-black min-h-screen`}>
        <ClientPageTransition>{children}</ClientPageTransition>
      </body>
    </html>
  )
}
