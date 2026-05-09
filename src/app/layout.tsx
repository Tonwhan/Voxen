import type { Metadata } from "next";
import { IBM_Plex_Mono, Geist, Crimson_Pro } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

// CONNECTS TO: Clerk Auth
// PURPOSE: Authentication provider for user sessions and security
// NOTE: token is automatically attached via Clerk middleware

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["300", "400"],
  subsets: ["latin"],
  variable: "--font-mono",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  style: ["italic", "normal"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Voxen — Generative CAD for Engineering",
  description:
    "Generate assembly-aware 3D CAD models from natural language. Powered by AMD MI300X.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexMono.variable} ${geist.variable} ${crimsonPro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider afterSignOutUrl="/">{children}</ClerkProvider>
      </body>
    </html>
  );
}
