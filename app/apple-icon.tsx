import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS shows icons on a solid tile, so the transparent mascot sits on the
// app's dark background instead of the black iOS would fill in.
export default async function AppleIcon() {
  const mascot = await readFile(join(process.cwd(), "app/_assets/mascot.png"));
  const src = `data:image/png;base64,${mascot.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0806",
        }}
      >
        <img src={src} alt="" width={156} height={156} />
      </div>
    ),
    size
  );
}
