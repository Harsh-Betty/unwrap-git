// Canonical origin for metadata, sitemaps and share links. Override per
// deployment (for example a preview URL) with NEXT_PUBLIC_SITE_URL.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://unwrap-git.hrshvrdhn.com"
).replace(/\/$/, "");

export const SITE_NAME = "Unwrap Git";

export const SITE_DESCRIPTION =
  "GitHub Wrapped for any year: see a developer's contributions, top languages, streaks, commit hours and coding personality, then share it as a card. Free, no sign-up needed.";

export const REPO_URL = "https://github.com/Harsh-Betty/unwrap-git";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// Serialises structured data for a <script type="application/ld+json">.
// Escaping "<" keeps user-controlled text (names, bios) from closing the tag.
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
