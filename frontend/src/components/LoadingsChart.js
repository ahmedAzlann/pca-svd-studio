import React from "react";

export default function LoadingsChart({ data, color = "#c84b11" }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => Math.abs(d.loading)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "DM Mono", fontSize: "0.65rem", color: "#7a6e62", width: 110, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={d.feature}>
            {d.feature}
          </span>
          <div style={{ flex: 1, height: 8, background: "#f4f0e8", borderRadius: 2, position: "relative", overflow: "hidden" }}>
            <div style={{
              position: "absolute",
              left: d.loading >= 0 ? "50%" : `${50 - (Math.abs(d.loading) / max) * 50}%`,
              width: `${(Math.abs(d.loading) / max) * 50}%`,
              height: "100%",
              background: d.loading >= 0 ? color : "#2563a8",
              borderRadius: 2,
              transition: "width 0.5s ease",
            }} />
            {/* center line */}
            <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: "#c8bfad" }} />
          </div>
          <span style={{ fontFamily: "DM Mono", fontSize: "0.65rem", color: "#7a6e62", width: 52, textAlign: "right" }}>
            {d.loading > 0 ? "+" : ""}{d.loading.toFixed(3)}
          </span>
        </div>
      ))}
    </div>
  );
}
