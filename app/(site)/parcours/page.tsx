import type { Metadata } from "next";
import { getTimeline, getCertifications } from "@/lib/content";
import Timeline from "@/components/Timeline";
import CertifList from "@/components/CertifList";

export const metadata: Metadata = {
  title: "Parcours",
  description: "Mon parcours, formations et certifications.",
};

export const revalidate = 3600;

export default async function ParcoursPage() {
  const [timeline, certifications] = await Promise.all([
    getTimeline(),
    getCertifications(),
  ]);
  return (
    <div className="mx-auto max-w-[680px] px-5 flex flex-col gap-12">
      <section className="flex flex-col gap-4">
        <span
          className="font-mono text-[13px] uppercase"
          style={{ color: "var(--accent)" }}
        >
          // parcours
        </span>
        <Timeline items={timeline} />
      </section>

      <section className="flex flex-col gap-4">
        <span
          className="font-mono text-[13px] uppercase"
          style={{ color: "var(--accent)" }}
        >
          // certifications
        </span>
        <CertifList items={certifications} />
      </section>
    </div>
  );
}
