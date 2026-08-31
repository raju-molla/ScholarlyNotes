import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";

export const metadata = {
  title: "ScholarlyNotes — Research notes & citations",
  description: "Take research notes and write fully cited pages with organized references.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Avoids a light/dark flash on load by applying the stored theme before paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
              var t = localStorage.getItem('rn_theme');
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (t ? t === 'dark' : prefersDark) document.documentElement.classList.add('dark');
            } catch (e) {}`,
          }}
        />
      </head>
      <body className="font-sans min-h-screen flex flex-col">
        <AuthProvider>
          <KeyboardShortcuts />
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-ink/10 py-6 text-center text-xs text-ink/50">
            ScholarlyNotes — built for researchers.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
