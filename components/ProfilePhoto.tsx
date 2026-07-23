"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProfilePhoto({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="profile-monogram" aria-hidden="true">
        LD
      </div>
    );
  }

  return (
    <div className="profile-photo-wrap">
      <span className="profile-photo-fallback" aria-hidden="true">
        LD
      </span>
      <Image
        src={src}
        alt={alt}
        width={360}
        height={430}
        className="profile-photo"
        priority
        onError={() => setFailed(true)}
      />
    </div>
  );
}
