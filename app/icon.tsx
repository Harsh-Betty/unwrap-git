import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Every icon size comes from one master image (app/_assets/mascot.png,
// 512x512). favicon.ico stays a file because Next.js cannot generate it.
const SIZES = [32, 192, 512] as const;

export function generateImageMetadata() {
  return SIZES.map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const size = Number(await id);
  const mascot = await readFile(join(process.cwd(), "app/_assets/mascot.png"));
  const src = `data:image/png;base64,${mascot.toString("base64")}`;

  return new ImageResponse(
    (
      <img src={src} alt="" width={size} height={size} />
    ),
    { width: size, height: size }
  );
}
