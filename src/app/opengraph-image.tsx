import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0a0a0a",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-120px",
            width: "500px",
            height: "500px",
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.45), rgba(217,70,239,0.25), transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-160px",
            left: "-100px",
            width: "450px",
            height: "450px",
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, rgba(6,182,212,0.35), transparent 70%)",
          }}
        />
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            backgroundImage:
              "linear-gradient(90deg, #818cf8, #e879f9, #22d3ee)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {siteConfig.name}
        </div>
        <div style={{ fontSize: 36, color: "#d4d4d4", marginTop: 20 }}>
          {siteConfig.role}
        </div>
        <div style={{ fontSize: 24, color: "#737373", marginTop: 28 }}>
          {`github.com/${siteConfig.github}`}
        </div>
      </div>
    ),
    size
  );
}
