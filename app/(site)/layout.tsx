import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TrackPageView from "@/components/TrackPageView";
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
  // Self-exclusion: Payload's session cookie is HttpOnly so client JS can't
  // see it. We check it server-side and skip injecting the GoatCounter scripts
  // entirely when the admin is logged in — no tracker loaded, no risk of
  // counting our own navigations.
  const adminLoggedIn = cookieStore.has("payload-token");
  return (
    <html lang="fr" className={`${dmSans.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("theme")||"dark";document.documentElement.setAttribute("data-theme",t)})()`,
          }}
        />
        {!adminLoggedIn ? (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `window.goatcounter={allow_local:true};`,
              }}
            />
            <script
              data-goatcounter="/stats/count"
              async
              src="/stats/count.js"
            />
          </>
        ) : null}
      </head>
      <body className="flex min-h-screen flex-col">
        <Nav />
        <main className="flex-1 py-12">{children}</main>
        <Footer siteMeta={siteMeta} />
        {!adminLoggedIn ? <TrackPageView /> : null}
      </body>
    </html>
  );
}
