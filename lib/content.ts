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

const safe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return fallback;
    }
    throw err;
  }
};

const emptySiteMeta: SiteMeta = {
  name: "",
  title: "",
  description: "",
  email: "",
  github: "",
  linkedin: "",
  location: "",
  availability: "",
};

const emptyAbout = {
  id: 0,
  sectionTitle: null,
  paragraphs: [],
  highlight: null,
  paragraphsAfter: [],
  quickInfo: {},
  updatedAt: "",
  createdAt: "",
} as unknown as AboutGlobal;

export async function getSiteMeta(): Promise<SiteMeta> {
  return safe(async () => {
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
  }, emptySiteMeta);
}

export type About = AboutGlobal;

export async function getAbout(): Promise<About> {
  return safe(async () => {
    const payload = await payloadPromise;
    return (await payload.findGlobal({ slug: "about" })) as AboutGlobal;
  }, emptyAbout);
}

export async function getTimeline(): Promise<TimelineItem[]> {
  return safe(async () => {
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
  }, []);
}

export async function getCertifications(): Promise<Certification[]> {
  return safe(async () => {
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
  }, []);
}
