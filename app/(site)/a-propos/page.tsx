import type { Metadata } from "next";
import Image from "next/image";
import { siteMeta } from "@/content/meta";
import { aboutStory, quickInfo } from "@/content/about";
import { certifications } from "@/content/certifications";
import CertifList from "@/components/CertifList";
import ContactGrid from "@/components/ContactGrid";
import Highlight from "@/components/Highlight";

export const metadata: Metadata = {
  title: "À propos",
  description: "Mon histoire, mes certifications et comment me contacter.",
};

export default function AProposPage() {
  return (
    <div className="mx-auto max-w-[680px] px-5 flex flex-col gap-14">
      {/* Header */}
      <section className="grid grid-cols-1 gap-8 sm:grid-cols-[1fr_160px]">
        <div className="flex flex-col gap-3">
          <span
            className="font-mono text-[13px] uppercase"
            style={{ color: "var(--accent)" }}
          >
            // à propos
          </span>
          <h1
            className="text-[28px] font-medium"
            style={{ color: "var(--n900)" }}
          >
            {siteMeta.name}
          </h1>
          <p
            className="font-mono text-[13px]"
            style={{ color: "var(--n500)" }}
          >
            {siteMeta.title}
          </p>
          <div className="mt-1 flex flex-wrap gap-4">
            <QuickItem
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              }
              text={quickInfo.location}
            />
            <QuickItem
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              }
              text={quickInfo.rhythm}
            />
            <QuickItem
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
              }
              text={quickInfo.english}
            />
          </div>
        </div>
        <div className="order-last sm:order-none">
          <div
            className="h-[190px] w-[160px] overflow-hidden rounded-[10px]"
            style={{ background: "var(--n50)", border: "0.5px solid var(--n100)" }}
          >
            <Image
              src="/photo.png"
              alt="Lucas Desfontaine"
              width={160}
              height={190}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="flex flex-col gap-4">
        <span
          className="font-mono text-[13px] uppercase"
          style={{ color: "var(--accent)" }}
        >
          // {aboutStory.sectionTitle}
        </span>
        <div>
          {aboutStory.paragraphs.map((p, i) => (
            <p
              key={i}
              className="mb-4 text-[15.5px] leading-[1.75]"
              style={{ color: "var(--n700)" }}
            >
              {p}
            </p>
          ))}
          <Highlight>{aboutStory.highlight}</Highlight>
          {aboutStory.paragraphsAfter.map((p, i) => (
            <p
              key={i}
              className="mb-4 text-[15.5px] leading-[1.75]"
              style={{ color: "var(--n700)" }}
            >
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* Certifications */}
      <section className="flex flex-col gap-4">
        <span
          className="font-mono text-[13px] uppercase"
          style={{ color: "var(--accent)" }}
        >
          // certifications
        </span>
        <CertifList items={certifications} />
      </section>

      {/* Contact */}
      <section className="flex flex-col gap-4">
        <span
          className="font-mono text-[13px] uppercase"
          style={{ color: "var(--accent)" }}
        >
          // contact
        </span>
        <ContactGrid />
      </section>
    </div>
  );
}

function QuickItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      className="flex items-center gap-1.5"
      style={{ color: "var(--n500)" }}
    >
      {icon}
      <span className="text-[13px]">{text}</span>
    </div>
  );
}
