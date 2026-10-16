import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/**
 * Generated rather than a checked-in binary, so the brand colour stays in one
 * place. Flexbox only — ImageResponse does not support grid.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#14342a",
          color: "#fdf8f3",
        }}
      >
        {/* Padded to the inner 80% so the same file is safe as a maskable
            icon — Android crops maskable icons to a circle or squircle. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 300,
            height: 300,
            fontSize: 190,
            fontWeight: 700,
            letterSpacing: "-0.04em",
          }}
        >
          ID
        </div>
      </div>
    ),
    { ...size },
  );
}