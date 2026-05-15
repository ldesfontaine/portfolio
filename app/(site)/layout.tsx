import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getSiteMeta } from "@/lib/content";
import "./globals.css";

export const revalidate = 3600;

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteMeta = await getSiteMeta();
  return (
    <html lang="fr" className={`${dmSans.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("theme")||"dark";document.documentElement.setAttribute("data-theme",t)})()`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.goatcounter={allow_local:true,no_onload:document.cookie.indexOf("payload-token=")!==-1};`,
          }}
        />
        <script
          data-goatcounter="/stats/count"
          async
          src="/stats/count.js"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <Nav />
        <main className="flex-1 py-12">{children}</main>
        <Footer siteMeta={siteMeta} />
      </body>
    </html>
  );
}
