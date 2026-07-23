export interface ThemeLink {
  slug: string;
  title: string;
}

export interface MediaAsset {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface EditorialEntry {
  slug: string;
  href: string;
  source: "note";
  label: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readingTime: number;
  tags: string[];
  relatedThemes: ThemeLink[];
  cover?: MediaAsset;
}

export interface TimelineItem {
  date: string;
  title: string;
  subtitle: string;
  activeLabel?: string;
}

export interface Certification {
  name: string;
  organization: string;
  status: "obtained" | "in-progress" | "course-only";
  statusLabel: string;
}

export interface SiteMeta {
  name: string;
  email: string;
  github: string;
  linkedin: string;
  cvUrl: string | null;
  hero: {
    eyebrow: string;
    title: string;
    description: string;
  };
}
