"use client";

import { useRef, useState } from "react";

type Message = { kind: "info" | "error"; text: string };

export default function BackupCard() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/snapshot", { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      link.href = url;
      link.download = `portfolio-snapshot-${ts}.tar.gz`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage({ kind: "info", text: "Snapshot téléchargé." });
    } catch (err) {
      setMessage({ kind: "error", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (file: File) => {
    const confirmed = window.confirm(
      `Restaurer depuis "${file.name}" ?\n\n` +
        `Cette action écrase la DB et les fichiers media actuels. ` +
        `Le container va redémarrer (10-15s). Continuer ?`,
    );
    if (!confirmed) return;

    setBusy(true);
    setMessage(null);
    const form = new FormData();
    form.append("snapshot", file);
    try {
      const res = await fetch("/api/snapshot/restore", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setMessage({
        kind: "info",
        text:
          data.message ||
          "Restauration en cours. Recharge la page dans 10-15s.",
      });
    } catch (err) {
      setMessage({ kind: "error", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        padding: "1.5rem",
        border: "1px solid var(--theme-elevation-100)",
        borderRadius: "4px",
        marginBottom: "2rem",
        background: "var(--theme-elevation-0)",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
        Sauvegarde &amp; restauration
      </h3>
      <p
        style={{
          color: "var(--theme-elevation-500)",
          fontSize: "0.875rem",
          marginBottom: "1rem",
        }}
      >
        Télécharge un snapshot complet (DB + fichiers media) ou restaure depuis
        un snapshot. La restauration écrase l&apos;état actuel et redémarre le
        container.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy}
          className="btn btn--style-primary"
        >
          {busy ? "..." : "Télécharger un snapshot"}
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="btn btn--style-secondary"
        >
          {busy ? "..." : "Restaurer depuis un fichier"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".tar.gz,.tgz,application/gzip"
          style={{ display: "none" }}
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleRestore(f);
            e.target.value = "";
          }}
        />
      </div>
      {message ? (
        <p
          style={{
            marginTop: "0.75rem",
            marginBottom: 0,
            fontSize: "0.875rem",
            color:
              message.kind === "error"
                ? "var(--theme-error-500)"
                : "var(--theme-elevation-700)",
          }}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
