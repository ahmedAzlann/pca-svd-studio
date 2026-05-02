import React from "react";

export default function AccuracyComparison({ original, reduced }) {
  const diff = (reduced - original).toFixed(1);
  const diffColor = parseFloat(diff) >= 0 ? "#15803d" : "#c84b11";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { label: "Original Features", val: original, color: "#7a6e62" },
          { label: "Reduced Features",  val: reduced,  color: "#2563a8" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: "#f4f0e8", borderRadius: 4, padding: "16px 12px", textAlign: "center" }}>
            <div style={{ fontFamily: "DM Mono", fontSize: "0.65rem", color: "#7a6e62", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: "2rem", fontWeight: 900, color, lineHeight: 1 }}>{val}%</div>
            <div style={{ fontFamily: "DM Mono", fontSize: "0.6rem", color: "#7a6e62", marginTop: 4 }}>KNN Accuracy</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center" }}>
        <span style={{ fontFamily: "DM Mono", fontSize: "0.75rem", color: diffColor, fontWeight: 600 }}>
          {parseFloat(diff) >= 0 ? "▲" : "▼"} {Math.abs(parseFloat(diff))}% accuracy {parseFloat(diff) >= 0 ? "gain" : "loss"} after reduction
        </span>
      </div>

      {[
        { label: "Original", val: original, color: "#7a6e62" },
        { label: "Reduced",  val: reduced,  color: "#2563a8" },
      ].map(({ label, val, color }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "DM Mono", fontSize: "0.7rem", color: "#7a6e62", width: 60 }}>{label}</span>
          <div style={{ flex: 1, height: 10, background: "#e2dcd0", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${val}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
          </div>
          <span style={{ fontFamily: "DM Mono", fontSize: "0.7rem", color, width: 44, textAlign: "right" }}>{val}%</span>
        </div>
      ))}
    </div>
  );
}
