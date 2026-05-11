import { Certification } from "@/lib/types";

export const certifications: Certification[] = [
  {
    name: "ANSSI SecNumAcadémie",
    organization:
      "Agence Nationale de la Sécurité des Systèmes d'Information",
    status: "obtained",
    statusLabel: "obtenue",
  },
  {
    name: "eJPT v2",
    organization: "INE Security (eLearnSecurity)",
    status: "in-progress",
    statusLabel: "en cours",
  },
  {
    name: "Cisco Networking Essentials",
    organization: "Cisco NetAcad (cours terminé, non certifié)",
    status: "course-only",
    statusLabel: "cours",
  },
];
