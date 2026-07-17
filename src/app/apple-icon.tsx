import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch icon — larger branded mark for home screen / bookmarks.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #062822 0%, #0A3D33 55%, #0F5245 100%)",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            width: 148,
            height: 148,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            border: "3px solid rgba(232, 192, 74, 0.35)",
            background: "#0A3D33",
          }}
        >
          <div
            style={{
              width: 78,
              height: 96,
              display: "flex",
              background:
                "linear-gradient(145deg, #B8860B 0%, #D4A017 50%, #E8C04A 100%)",
              borderRadius: "50% 50% 50% 0",
              transform: "rotate(-45deg)",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
