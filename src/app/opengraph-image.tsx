import { ImageResponse } from "next/og";

export const alt = "Plainform: understand any form before you sign it";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const lines = [70, 52, 80, 44, 64];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f6f3ec",
          padding: 72,
          fontFamily: "serif",
          color: "#1d1b16",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 40, fontWeight: 700 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "#1f5f4f", display: "flex" }} />
            Plainform
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 76, lineHeight: 1.05, fontWeight: 700 }}>
            <span>Understand any form</span>
            <span style={{ color: "#1f5f4f" }}>before you sign it.</span>
          </div>
          <div style={{ fontSize: 30, color: "#4f4a40", fontFamily: "sans-serif" }}>
            Every field, in plain words, in your language. Nothing stored.
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            width: 360,
            display: "flex",
            flexDirection: "column",
            background: "#fffdf8",
            border: "2px solid #e0d9ca",
            borderRadius: 18,
            padding: 32,
            transform: "rotate(-3deg)",
            boxShadow: "0 12px 40px rgba(60,50,30,0.12)",
          }}
        >
          <div style={{ height: 18, width: "75%", background: "#1d1b16", borderRadius: 6, marginBottom: 28 }} />
          {lines.map((w, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                border: i === 2 ? "3px solid #1f5f4f" : "2px solid #e0d9ca",
                background: i === 2 ? "#dcebe4" : "transparent",
                borderRadius: 10,
                padding: 16,
                marginBottom: 14,
              }}
            >
              <div
                style={{ height: 10, width: `${w}%`, background: i === 2 ? "#1f5f4f" : "#cfc7b6", borderRadius: 5 }}
              />
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
