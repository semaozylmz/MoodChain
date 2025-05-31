// app/layout.tsx

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Stellar Mood Tracker</title>
        {/* Tailwind CSS CDN */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-gray-950 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
