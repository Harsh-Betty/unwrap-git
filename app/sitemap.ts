import type { MetadataRoute } from "next";
import { getSitemapProfiles } from "@/lib/leaderboard";
import { absoluteUrl } from "@/lib/site";
import { currentYear, profilePath } from "@/lib/year";

// Rebuilt at most once a day; the leaderboard drives which profiles appear.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const thisYear = currentYear(now);

  const profiles = await getSitemapProfiles().catch((error: unknown) => {
    console.error("Sitemap could not read the leaderboard:", error);
    return [];
  });
  const years = [...new Set(profiles.map((profile) => profile.year))].filter(
    (year) => year !== thisYear
  );

  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/leaderboard"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/how-it-works"), changeFrequency: "monthly", priority: 0.6 },
    ...years.map((year) => ({
      url: absoluteUrl(`/leaderboard/${year}`),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...profiles.map((profile) => ({
      url: absoluteUrl(profilePath(profile.username, profile.year)),
      lastModified: profile.updatedAt,
      changeFrequency:
        profile.year === thisYear ? ("daily" as const) : ("yearly" as const),
      priority: profile.year === thisYear ? 0.6 : 0.4,
    })),
  ];
}
