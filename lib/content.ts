import { getPayload } from "payload";

import config from "@payload-config";
import type {
  About as AboutGlobal,
  Certification as PayloadCertification,
  SiteMeta as SiteMetaGlobal,
  TimelineItem as PayloadTimelineItem,
} from "@/payload-types";
import type { Certification, SiteMeta, TimelineItem } from "./types";

const payloadPromise = getPayload({ config });

export async function getSiteMeta(): Promise<SiteMeta> {
  const payload = await payloadPromise;
  const doc = (await payload.findGlobal({ slug: "site-meta" })) as SiteMetaGlobal;
  return {
    name: doc.name ?? "",
    title: doc.title ?? "",
    description: doc.description ?? "",
    email: doc.email ?? "",
    github: doc.github ?? "",
    linkedin: doc.linkedin ?? "",
    location: doc.location ?? "",
    availability: doc.availability ?? "",
  };
}

export type About = AboutGlobal;

export async function getAbout(): Promise<About> {
  const payload = await payloadPromise;
  return (await payload.findGlobal({ slug: "about" })) as AboutGlobal;
}

export async function getTimeline(): Promise<TimelineItem[]> {
  const payload = await payloadPromise;
  const { docs } = await payload.find({
    collection: "timeline-items",
    sort: "order",
    depth: 0,
    limit: 100,
  });
  return docs.map((d: PayloadTimelineItem) => ({
    date: d.date,
    title: d.title,
    subtitle: d.subtitle,
    status: d.status === "active" ? "active" : undefined,
    highlight: d.highlight ?? undefined,
  }));
}

export async function getCertifications(): Promise<Certification[]> {
  const payload = await payloadPromise;
  const { docs } = await payload.find({
    collection: "certifications",
    sort: "order",
    depth: 0,
    limit: 100,
  });
  return docs.map((d: PayloadCertification) => ({
    name: d.name,
    organization: d.organization,
    status: d.status,
    statusLabel: d.statusLabel,
  }));
}
