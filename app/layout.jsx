import './globals.css'

export const metadata = {
  title: 'Semantic Blog Search',
  description: 'Find blogs by meaning using AI-powered semantic search',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

