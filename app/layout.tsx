import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"

export const runtime = "nodejs"


export const metadata: Metadata = {
  title: "AI Business Analyst",
  description: "Upload data, get insights",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
