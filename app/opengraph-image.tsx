import { ImageResponse } from "next/og";

export const alt = "Imarisha Dada — Empowering girls and young women in Kibera, Nairobi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * ImageResponse supports flexbox only — `display: grid` does not work.
 * @see doc/roadmap/system-files.md §4
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: "#14342a",
          color: "#fdf8f3",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 8, height: 48, background: "#c4643c" }} />
          <div
            style={{
              fontSize: 28,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#fdf8f3",
              opacity: 0.7,
            }}
          >
            Kibera, Nairobi
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 72,
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
            fontSize: 30,
          }}
        >
          <div style={{ display: "flex", fontWeight: 700 }}>Imarisha Dada</div>
          <div style={{ display: "flex", opacity: 0.7 }}>Empower a Sister</div>
        </div>
      </div>
    ),
    size,
  );
}