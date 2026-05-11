import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "Lucas Desfontaine — DevSecOps & Sécurité des Infrastructures",
    template: "%s | Lucas Desfontaine",
  },
  description:
    "Portfolio de Lucas Desfontaine — DevSecOps, sécurité des infrastructures, IaC, monitoring.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Lucas Desfontaine — DevSecOps",
    description: "Portfolio DevSecOps & Sécurité des Infrastructures",
    url: "https://lucasdesfontaine.dev",
    type: "website",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("theme")||"dark";document.documentElement.setAttribute("data-theme",t)})()`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <Nav />
        <main className="flex-1 py-12">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
