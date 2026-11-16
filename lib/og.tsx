import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getArchetype } from "./archetype";
import { getStats } from "./stats";

export const OG_SIZE = { width: 1200, height: 630 };

const AMBER = "#ffb000";
const DIM = "#cc8800";
const BG = "#0a0806";

async function fallbackImage(): Promise<Response> {
  // The site's own share image, for users that cannot be loaded.
  const png = await readFile(join(process.cwd(), "app/opengraph-image.png"));
  return new Response(new Uint8Array(png), {
    headers: { "content-type": "image/png" },
  });
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 64, fontWeight: 700, color: AMBER }}>{value}</div>
      <div style={{ fontSize: 26, color: DIM }}>{label}</div>
    </div>
  );
}

export async function profileOgImage(login: string, year: number) {
  const result = await getStats(login, year);
  if (!result.ok) return fallbackImage();

  const stats = result.data;
  const { user, contributions, insights, languages } = stats;
  const archetype = getArchetype(stats);
  const format = (n: number) => n.toLocaleString("en-US");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: BG,
          border: `4px solid ${AMBER}`,
          color: AMBER,
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${user.avatarUrl}${user.avatarUrl.includes("?") ? "&" : "?"}s=240`}
            alt=""
            width={140}
            height={140}
            style={{ borderRadius: 999, border: `4px solid ${AMBER}` }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 56, fontWeight: 700 }}>
              {user.name ?? `@${user.login}`}
            </div>
            <div style={{ fontSize: 32, color: DIM }}>
              {`@${user.login} · GitHub Wrapped ${year}${stats.isYtd ? " so far" : ""}`}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 72 }}>
          <Stat value={format(contributions.total)} label="contributions" />
          <Stat value={format(insights.longestStreak)} label="day streak" />
          <Stat value={languages[0]?.name ?? "–"} label="top language" />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 30,
          }}
        >
          <div style={{ display: "flex" }}>{archetype.title}</div>
          <div style={{ display: "flex", color: DIM }}>unwrap-git</div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}
