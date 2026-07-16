import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Sacred Reference — Mytho-Shamanic Somatic Healing · Path of Remembering";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(145deg, #062822 0%, #0a3d33 45%, #1f6b60 100%)",
          padding: "64px 72px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              color: "#e8c04a",
              fontSize: 22,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 500,
            }}
          >
            Mytho-Shamanic Somatic Healing
          </div>
          <div
            style={{
              color: "#f5f0e8",
              fontSize: 56,
              lineHeight: 1.15,
              fontWeight: 500,
              maxWidth: 980,
            }}
          >
            Beneath every wound there is Wholeness
          </div>
          <div
            style={{
              color: "#e8c04a",
              fontSize: 28,
              fontStyle: "italic",
              marginTop: 8,
            }}
          >
            This is a Path of Remembering
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            color: "rgba(245,240,232,0.75)",
            fontSize: 22,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <span
            style={{
              color: "#f5f0e8",
              fontSize: 28,
              fontFamily: "Georgia, serif",
            }}
          >
            Sacred Reference
          </span>
          <span>Michele Castro · oursacredreference.com</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
