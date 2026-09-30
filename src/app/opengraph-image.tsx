import { ImageResponse } from "next/og";

export const alt = "WOLFEX — Hunt Your Apex";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 40%, #0b2a66 0%, #06152F 35%, #050505 75%)",
          color: "#F5F7FA",
        }}
      >
        <div style={{ fontSize: 180, fontWeight: 900, letterSpacing: 12 }}>WOLFEX</div>
        <div style={{ marginTop: 12, fontSize: 40, color: "#00A8FF", letterSpacing: 10 }}>HUNT YOUR APEX.</div>
        <div style={{ position: "absolute", bottom: 40, fontSize: 20, color: "#70757D", letterSpacing: 6 }}>EST. 2026 · PERFORMANCE SYSTEM</div>
      </div>
    ),
    size,
  );
}
