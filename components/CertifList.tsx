import type { Certification } from "@/lib/types";

export default function CertifList({ items }: { items: Certification[] }) {
  return (
    <div
      className="overflow-hidden"
      style={{
        background: "var(--n100)",
        borderRadius: "10px",
        border: "0.5px solid var(--n100)",
      }}
    >
      {items.map((cert, i) => (
        <div
          key={i}
          className="grid items-center gap-4 px-5 py-3.5"
          style={{
            gridTemplateColumns: "1fr auto",
            background: "var(--card-bg)",
            borderTop: i > 0 ? "1px solid var(--n100)" : undefined,
          }}
        >
          <div>
            <span
              className="block text-sm font-medium"
              style={{ color: "var(--n900)" }}
            >
              {cert.name}
            </span>
            <span
              className="block text-[12.5px]"
              style={{ color: "var(--n500)" }}
            >
              {cert.organization}
            </span>
          </div>
          <span
            className={`certification-status is-${cert.status}`}
          >
            {cert.statusLabel}
          </span>
        </div>
      ))}
    </div>
  );
}
