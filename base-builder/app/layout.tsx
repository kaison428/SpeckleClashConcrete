import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex",
});

export const metadata: Metadata = {
  title: "Base Builder | Marathon Dashboard",
  description: "Marathon coaching dashboard for long-run base building",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${ibmPlexSans.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{
          backgroundColor: "var(--cream)",
          color: "var(--green-900)",
          fontFamily: "var(--font-ibm-plex)",
        }}
      >
        <nav
          style={{ backgroundColor: "var(--green-800)", color: "white" }}
          className="w-full px-6 py-3 flex items-center gap-8"
        >
          <span
            style={{ fontFamily: "var(--font-fraunces)", fontSize: "1.25rem", fontWeight: 600 }}
          >
            Base Builder
          </span>
          <div
            className="flex gap-6"
            style={{ fontFamily: "var(--font-ibm-plex)", fontSize: "0.9rem" }}
          >
            <Link href="/" className="hover:underline" style={{ color: "white" }}>
              Dashboard
            </Link>
            <Link href="/ledger" className="hover:underline" style={{ color: "white" }}>
              Ledger
            </Link>
            <Link href="/charts" className="hover:underline" style={{ color: "white" }}>
              Charts
            </Link>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
