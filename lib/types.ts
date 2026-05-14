export interface ProjectMeta {
  slug: string;
  title: string;
  category: string;
  description: string;
  stack: string[];
  github?: string;
  period: string;
  type: string;
  badge?: string;
  order: number;
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
  title: string;
  description: string;
  email: string;
  github: string;
  linkedin: string;
  location: string;
  availability: string;
  cvUrl: string | null;
}
