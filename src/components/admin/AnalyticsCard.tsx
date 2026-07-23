import { readFile } from "node:fs/promises";

type TotalResponse = {
  total: number;
  total_events: number;
  total_utc: number;
};

type HitsResponse = {
  hits: Array<{
    count: number;
    max: number;
    path_id: number;
    path: string;
    title: string;
    event: boolean;
  }>;
};

type Summary = {
  total: number;
  totalEvents: number;
  topPaths: HitsResponse["hits"];
  rangeLabel: string;
};

const TOKEN_FILE =
  process.env.GOATCOUNTER_TOKEN_FILE || "/data/goatcounter-api-token";
const UPSTREAM =
  process.env.GOATCOUNTER_INTERNAL_URL || "http://127.0.0.1:8080";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function fetchSummary(): Promise<Summary | null> {
  let token: string;
  try {
    token = (await readFile(TOKEN_FILE, "utf8")).trim();
  } catch {
    return null;
  }
  if (!token) return null;

  // GoatCounter's `end` is exclusive — push it one day past today so the
  // current day's hits are included in the count.
  const today = new Date();
  const endExclusive = new Date(today);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 6);
  const range = `start=${toISODate(start)}&end=${toISODate(endExclusive)}`;
  const rangeLabel = `${toISODate(start)} → ${toISODate(today)}`;
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const [totalRes, hitsRes] = await Promise.all([
      fetch(`${UPSTREAM}/stats/api/v0/stats/total?${range}`, {
        headers,
        cache: "no-store",
      }),
      fetch(`${UPSTREAM}/stats/api/v0/stats/hits?${range}&limit=5`, {
        headers,
        cache: "no-store",
      }),
    ]);
    if (!totalRes.ok || !hitsRes.ok) return null;
    const total = (await totalRes.json()) as TotalResponse;
    const hits = (await hitsRes.json()) as HitsResponse;
    return {
      total: total.total,
      totalEvents: total.total_events,
      topPaths: hits.hits,
      rangeLabel,
    };
  } catch {
    return null;
  }
}

export default async function AnalyticsCard() {
  const summary = await fetchSummary();

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
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "0.5rem",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <h3 style={{ margin: 0 }}>Analytics</h3>
        <a
          href="/stats/"
          target="_blank"
          rel="noreferrer"
          className="btn btn--style-primary btn--size-small"
        >
          Ouvrir le dashboard ↗
        </a>
      </div>

      {summary ? (
        <>
          <p
            style={{
              color: "var(--theme-elevation-500)",
              fontSize: "0.8125rem",
              margin: "0 0 1rem",
            }}
          >
            7 derniers jours · {summary.rangeLabel}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <Metric label="Pages vues" value={summary.total} />
            <Metric label="Événements" value={summary.totalEvents} />
            <Metric label="Pages distinctes" value={summary.topPaths.length} />
          </div>

          {summary.topPaths.length > 0 ? (
            <>
              <h4
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--theme-elevation-500)",
                  margin: "0 0 0.5rem",
                }}
              >
                Top pages
              </h4>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.875rem",
                }}
              >
                <tbody>
                  {summary.topPaths.map((row) => (
                    <tr
                      key={row.path_id}
                      style={{
                        borderTop: "1px solid var(--theme-elevation-100)",
                      }}
                    >
                      <td
                        style={{
                          padding: "0.5rem 0",
                          fontFamily: "var(--font-mono, monospace)",
                          wordBreak: "break-all",
                        }}
                      >
                        {row.path}
                      </td>
                      <td
                        style={{
                          padding: "0.5rem 0",
                          color: "var(--theme-elevation-500)",
                        }}
                      >
                        {row.title}
                      </td>
                      <td
                        style={{
                          padding: "0.5rem 0",
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 500,
                        }}
                      >
                        {row.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p
              style={{
                color: "var(--theme-elevation-500)",
                fontSize: "0.875rem",
                margin: 0,
              }}
            >
              Aucune visite enregistrée sur la période.
            </p>
          )}
        </>
      ) : (
        <p
          style={{
            color: "var(--theme-elevation-500)",
            fontSize: "0.875rem",
            margin: 0,
          }}
        >
          GoatCounter n&apos;est pas joignable ou pas encore provisionné.
          Vérifie le processus GoatCounter et le jeton en lecture seule dans{" "}
          <code>/data/goatcounter-api-token</code>.
        </p>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        padding: "0.75rem",
        border: "1px solid var(--theme-elevation-100)",
        borderRadius: "4px",
        background: "var(--theme-elevation-50)",
      }}
    >
      <div
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.1,
        }}
      >
        {value.toLocaleString("fr-FR")}
      </div>
      <div
        style={{
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--theme-elevation-500)",
          marginTop: "0.25rem",
        }}
      >
        {label}
      </div>
    </div>
  );
}
