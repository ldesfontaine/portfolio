import type { Metadata } from "next";

import BlockRenderer, { type RenderBlock } from "@/components/BlockRenderer";
import CertifList from "@/components/CertifList";
import ContactGrid from "@/components/ContactGrid";
import ProfilePhoto from "@/components/ProfilePhoto";
import Timeline from "@/components/Timeline";
import {
  getAbout,
  getCertifications,
  getSiteMeta,
  getTimeline,
} from "@/lib/content";

export const metadata: Metadata = {
  title: "Profil",
  description:
    "Parcours, spécialités, certifications et CV de Lucas Desfontaine.",
};

export const dynamic = "force-dynamic";

const DEFAULT_INTRO =
  "Je conçois et exploite des infrastructures où la sécurité, l'automatisation et la compréhension du système avancent ensemble. Le Homelab sert de terrain réel ; les Notes en montrent les choix et les preuves.";

const DEFAULT_SPECIALTIES = [
  "DevSecOps",
  "Infrastructure as Code",
  "Sécurité des systèmes",
  "Observabilité",
];

export default async function ProfilePage() {
  const [siteMeta, about, timeline, certifications] = await Promise.all([
    getSiteMeta(),
    getAbout(),
    getTimeline(),
    getCertifications(),
  ]);
  const savedSpecialties = about.specialties?.map((item) => item.value) ?? [];
  const specialties =
    savedSpecialties.length > 0 ? savedSpecialties : DEFAULT_SPECIALTIES;
  const story = (about.content ?? []) as RenderBlock[];

  return (
    <div className="profile-page">
      <header className="profile-hero site-container">
        <div className="profile-copy">
          <p className="eyebrow">PROFIL · PARCOURS · CV</p>
          <h1>{siteMeta.name || "Lucas Desfontaine"}</h1>
          <p>{about.intro || DEFAULT_INTRO}</p>
          <div className="profile-specialties">
            {specialties.map((specialty) => (
              <span key={specialty}>{specialty}</span>
            ))}
          </div>
          <div className="profile-facts">
            {about.quickInfo?.location ? (
              <span>⌖ {about.quickInfo.location}</span>
            ) : null}
            {about.quickInfo?.mobility ? (
              <span>{about.quickInfo.mobility}</span>
            ) : null}
            {about.quickInfo?.english ? (
              <span>{about.quickInfo.english}</span>
            ) : null}
          </div>
        </div>
        <ProfilePhoto
          src="/lucas-portrait-illustrated.png"
          alt={siteMeta.name || "Lucas Desfontaine"}
        />
      </header>

      <div className="profile-content site-container">
        {story.length > 0 ? (
          <section className="profile-section profile-story">
            <div className="profile-section-heading">
              <span>01</span>
              <div>
                <p>À PROPOS</p>
                <h2>{about.sectionTitle || "D'où je viens."}</h2>
              </div>
            </div>
            <div className="profile-story-content">
              <BlockRenderer blocks={story} />
            </div>
          </section>
        ) : null}

        <section className="profile-section profile-timeline">
          <div className="profile-section-heading">
            <span>02</span>
            <div>
              <p>PARCOURS</p>
              <h2>Une progression continue.</h2>
            </div>
          </div>
          <Timeline items={timeline} />
        </section>

        <section className="profile-section profile-cv-section">
          <div className="profile-section-heading">
            <span>03</span>
            <div>
              <p>CV</p>
              <h2>La version synthétique.</h2>
            </div>
          </div>
          <div className="cv-card">
            <div>
              <span>CV · DEVSECOPS</span>
              <h3>Parcours, expériences et compétences.</h3>
            </div>
            {siteMeta.cvUrl ? (
              <a
                href={siteMeta.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
              >
                Ouvrir le CV <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span className="cv-unavailable">PDF non publié</span>
            )}
          </div>
        </section>

        <section className="profile-section">
          <div className="profile-section-heading">
            <span>04</span>
            <div>
              <p>CERTIFICATIONS</p>
              <h2>Repères vérifiables.</h2>
            </div>
          </div>
          <CertifList items={certifications} />
        </section>

        <section className="profile-section">
          <div className="profile-section-heading">
            <span>05</span>
            <div>
              <p>CONTACT</p>
              <h2>Échanger autour d&apos;un système ou d&apos;un projet.</h2>
            </div>
          </div>
          <ContactGrid siteMeta={siteMeta} />
        </section>
      </div>
    </div>
  );
}
