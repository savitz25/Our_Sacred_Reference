import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Browser tab favicon — forest circle + gold leaf (Sacred Reference).
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A3D33",
          borderRadius: "50%",
        }}
      >
        {/* Gold leaf shape */}
        <div
          style={{
            width: 18,
            height: 22,
            display: "flex",
            background: "linear-gradient(145deg, #B8860B 0%, #D4A017 50%, #E8C04A 100%)",
            borderRadius: "50% 50% 50% 0",
            transform: "rotate(-45deg)",
            marginTop: 1,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
