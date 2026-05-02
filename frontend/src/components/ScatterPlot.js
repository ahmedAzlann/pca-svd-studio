import React, { useRef, useEffect, useState } from "react";

export default function ScatterPlot({ data }) {
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data?.length) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height, P = 48;

    let allX = [], allY = [];
    data.forEach(d => { allX.push(...d.x); allY.push(...d.y); });
    const minX = Math.min(...allX), maxX = Math.max(...allX);
    const minY = Math.min(...allY), maxY = Math.max(...allY);
    const rX = maxX - minX || 1, rY = maxY - minY || 1;

    const toC = (x, y) => ({
      cx: P + ((x - minX) / rX) * (W - P * 2),
      cy: H - P - ((y - minY) / rY) * (H - P * 2),
    });

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "#e2dcd0"; ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const gx = P + (i / 5) * (W - P * 2);
      const gy = P + (i / 5) * (H - P * 2);
      ctx.beginPath(); ctx.moveTo(gx, P); ctx.lineTo(gx, H - P); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(P, gy); ctx.lineTo(W - P, gy); ctx.stroke();
    }

    // Axes
    const o = toC(0, 0);
    ctx.strokeStyle = "#c8bfad"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(o.cx, P); ctx.lineTo(o.cx, H - P); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(P, o.cy); ctx.lineTo(W - P, o.cy); ctx.stroke();

    // Axis labels
    ctx.font = "10px 'DM Mono', monospace"; ctx.fillStyle = "#7a6e62"; ctx.textAlign = "center";
    ctx.fillText("PC1", W / 2, H - 8);
    ctx.save(); ctx.translate(12, H / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("PC2", 0, 0); ctx.restore();

    // Ellipses
    data.forEach(d => {
      if (d.x.length < 3) return;
      const pts = d.x.map((xi, i) => toC(xi, d.y[i]));
      const mx = pts.reduce((s, p) => s + p.cx, 0) / pts.length;
      const my = pts.reduce((s, p) => s + p.cy, 0) / pts.length;
      const vx = Math.sqrt(pts.reduce((s, p) => s + (p.cx - mx) ** 2, 0) / pts.length);
      const vy = Math.sqrt(pts.reduce((s, p) => s + (p.cy - my) ** 2, 0) / pts.length);
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(mx, my, vx * 1.6, vy * 1.6, 0, 0, Math.PI * 2);
      ctx.strokeStyle = d.color + "55"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.fillStyle = d.color + "12"; ctx.fill();
      ctx.restore();
    });

    // Points
    const pts = [];
    data.forEach(d => {
      d.x.forEach((xi, i) => {
        const { cx, cy } = toC(xi, d.y[i]);
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = d.color + "cc"; ctx.fill();
        ctx.strokeStyle = d.color; ctx.lineWidth = 1.2; ctx.stroke();
        pts.push({ cx, cy, class: d.class, color: d.color, x: xi, y: d.y[i] });
      });
    });
    pointsRef.current = pts;

    // Legend
    const lx = W - P - 100, ly = P + 10;
    data.forEach((d, i) => {
      ctx.beginPath(); ctx.arc(lx + 6, ly + i * 22 + 6, 5, 0, Math.PI * 2);
      ctx.fillStyle = d.color; ctx.fill();
      ctx.font = "11px 'Fraunces', serif"; ctx.fillStyle = "#1a1410"; ctx.textAlign = "left";
      ctx.fillText(d.class, lx + 16, ly + i * 22 + 10);
    });
  }, [data]);

  const onMove = e => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let found = null;
    for (const p of pointsRef.current) {
      if (Math.hypot(p.cx - mx, p.cy - my) < 9) { found = p; break; }
    }
    setTooltip(found ? { ...found, sx: e.clientX - rect.left, sy: e.clientY - rect.top } : null);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: 360 }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", cursor: "crosshair" }}
        onMouseMove={onMove} onMouseLeave={() => setTooltip(null)} />
      {tooltip && (
        <div style={{
          position: "absolute", left: tooltip.sx + 12, top: tooltip.sy - 44,
          background: "#fff", border: "1px solid #e2dcd0", borderRadius: 4,
          padding: "6px 10px", pointerEvents: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <div style={{ fontWeight: 700, color: tooltip.color, fontSize: "0.78rem" }}>{tooltip.class}</div>
          <div style={{ fontFamily: "DM Mono", fontSize: "0.68rem", color: "#7a6e62" }}>PC1: {tooltip.x.toFixed(3)}</div>
          <div style={{ fontFamily: "DM Mono", fontSize: "0.68rem", color: "#7a6e62" }}>PC2: {tooltip.y.toFixed(3)}</div>
        </div>
      )}
    </div>
  );
}
