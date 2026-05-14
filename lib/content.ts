import { getPayload } from "payload";

import config from "@payload-config";
import type {
  About as AboutGlobal,
  Certification as PayloadCertification,
  Media,
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

const mediaUrl = (
  field: Media | number | null | undefined,
): string | null =>
  field && typeof field === "object" && typeof field.url === "string"
    ? field.url
    : null;

const emptySiteMeta: SiteMeta = {
  name: "",
  title: "",
  description: "",
  email: "",
  github: "",
  linkedin: "",
  location: "",
  availability: "",
  cvUrl: null,
};

export type About = Omit<AboutGlobal, "photo"> & { photoUrl: string | null };

const emptyAbout: About = {
  id: 0,
  sectionTitle: null,
  content: [],
  quickInfo: {},
  photoUrl: null,
  updatedAt: "",
  createdAt: "",
} as unknown as About;

export async function getSiteMeta(): Promise<SiteMeta> {
  return safe(async () => {
    const payload = await payloadPromise;
    const doc = (await payload.findGlobal({
      slug: "site-meta",
      depth: 1,
    })) as SiteMetaGlobal;
    return {
      name: doc.name ?? "",
      title: doc.title ?? "",
      description: doc.description ?? "",
      email: doc.email ?? "",
      github: doc.github ?? "",
      linkedin: doc.linkedin ?? "",
      location: doc.location ?? "",
      availability: doc.availability ?? "",
      cvUrl: mediaUrl(doc.cv as Media | number | null | undefined),
    };
  }, emptySiteMeta);
}

export async function getAbout(): Promise<About> {
  return safe(async () => {
    const payload = await payloadPromise;
    const doc = (await payload.findGlobal({
      slug: "about",
      depth: 1,
    })) as AboutGlobal;
    const { photo, ...rest } = doc;
    return {
      ...rest,
      photoUrl: mediaUrl(photo as Media | number | null | undefined),
    };
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
      activeLabel: d.activeLabel ?? undefined,
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
