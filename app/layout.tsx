import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ReduxProvider } from "@/store/provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Live Polling System",
  description: "Real-time interactive polling for classrooms",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    colors: {
                      primary: {
                        DEFAULT: '#7765DA',
                        medium: '#5767D0',
                        dark: '#4F0DCE',
                      },
                      gray: {
                        light: '#F2F2F2',
                        medium: '#6E6E6E',
                        dark: '#373737',
                      }
                    },
                    animation: {
                      'fade-in': 'fadeIn 0.3s ease-in-out',
                      'slide-up': 'slideUp 0.3s ease-out',
                      'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    },
                    keyframes: {
                      fadeIn: {
                        '0%': { opacity: '0' },
                        '100%': { opacity: '1' },
                      },
                      slideUp: {
                        '0%': { transform: 'translateY(10px)', opacity: '0' },
                        '100%': { transform: 'translateY(0)', opacity: '1' },
                      }
                    }
                  }
                }
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  )
}
