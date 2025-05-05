import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/context/AuthContext"

export const metadata: Metadata = {
  title: "SOF-IA Medical AI",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}

