import { ImageResponse } from "next/og";

export const alt = "Hill Country Consultants — the capability of a full staff, without the payroll.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Site-wide default social share image. Pages without their own image use this. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#20241f",
          color: "#f5f1e8",
        }}
      >
        <div style={{ display: "flex", height: 8, width: 130, background: "#c2a24a", marginBottom: 44 }} />
        <div style={{ fontSize: 64, fontWeight: 600, lineHeight: 1.08, maxWidth: 960 }}>
          The capability of a full staff. Without the payroll.
        </div>
        <div style={{ fontSize: 30, marginTop: 34, color: "#d4b55f" }}>
          Hill Country Consultants · Clarity. Strategy. Organized Growth.
        </div>
      </div>
    ),
    { ...size },
  );
}
