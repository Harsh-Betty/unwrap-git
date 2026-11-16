import { notFound } from "next/navigation";
import { OG_SIZE, profileOgImage } from "@/lib/og";
import { parseYear } from "@/lib/year";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "GitHub Wrapped stats card";

export default async function Image({
  params,
}: {
  params: Promise<{ username: string; year: string }>;
}) {
  const { username, year } = await params;
  const parsed = parseYear(year);
  if (parsed === null) notFound();
  return profileOgImage(username, parsed);
}
