import type { Metadata } from "next";
import { timeline } from "@/content/timeline";
import { certifications } from "@/content/certifications";
import Timeline from "@/components/Timeline";
import CertifList from "@/components/CertifList";

export const metadata: Metadata = {
  title: "Parcours",
  description: "Mon parcours, formations et certifications.",
};

export default function ParcoursPage() {
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
