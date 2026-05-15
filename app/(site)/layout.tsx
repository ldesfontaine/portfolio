import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getSiteMeta } from "@/lib/content";
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [siteMeta, cookieStore] = await Promise.all([
    getSiteMeta(),
    cookies(),
  ]);
  // Self-exclusion: Payload's session cookie is HttpOnly, so client JS can't
  // read it. Check it server-side and bake the `no_onload` flag into the
  // tracker config — when the admin is logged in, count.js skips the auto hit.
  const adminLoggedIn = cookieStore.has("payload-token");
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
            __html: `window.goatcounter={allow_local:true,no_onload:${adminLoggedIn}};`,
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
