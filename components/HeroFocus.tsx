import Image from "next/image";

export default function HeroFocus() {
  return (
    <div className="hero-focus hero-portrait" aria-hidden="true">
      <div className="hero-illustration">
        <Image
          src="/lucas-portrait-illustrated.png"
          alt=""
          fill
          sizes="(max-width: 700px) 74vw, 340px"
          className="hero-illustration-image"
          priority
        />
      </div>
      <div className="hero-portrait-caption">
        <span>Lucas Desfontaine</span>
        <strong>Construire · sécuriser · comprendre</strong>
      </div>
    </div>
  );
}
