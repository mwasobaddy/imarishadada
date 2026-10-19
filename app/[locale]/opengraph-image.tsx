import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

async function readLogo() {
  const buf = await readFile(
    join(process.cwd(), "public/brand/logo.svg"),
  );
  return `data:image/svg+xml;base64,${buf.toString("base64")}`;
}

export const alt = "Imarisha Dada — Empowering Girls and Young Women in Kibera, Nairobi, Nairobi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * ImageResponse supports flexbox only — `display: grid` does not work.
 * @see doc/roadmap/system-files.md §4
 */
export default async function OpengraphImage() {
  // Logo is inlined at build time. A remote <img src> would need network access
  // inside ImageResponse and is not reliably fetched during generation.
  const logo = await readLogo();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: "#5B2A86",
          color: "#ffffff",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* ImageResponse requires a raw <img>; next/image is not usable here. */}
          <img src={logo} width={72} height={66} alt="" />
          <div style={{ display: "flex", fontSize: 26, opacity: 0.8 }}>
            Kibera, Nairobi
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 66,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: 900,
            }}
          >
            Every girl in Kibera deserves to go back to school.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 28,
          }}
        >
          <div style={{ display: "flex", opacity: 0.9 }}>Empower a Sister</div>
          <div style={{ display: "flex", opacity: 0.8 }}>Donate by M-Pesa or card</div>
        </div>
      </div>
    ),
    size,
  );
}