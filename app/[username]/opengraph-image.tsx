import { OG_SIZE, profileOgImage } from "@/lib/og";
import { currentYear } from "@/lib/year";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "GitHub Wrapped stats card";

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return profileOgImage(username, currentYear());
}
