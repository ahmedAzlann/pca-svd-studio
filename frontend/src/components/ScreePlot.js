import React from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

export default function ScreePlot({ data, nComponents }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} barSize={22} margin={{ top: 4, right: 20, bottom: 4, left: 0 }}>
        <XAxis dataKey="component" tick={{ fill: "#7a6e62", fontSize: 10, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fill: "#7a6e62", fontSize: 10, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: "#7a6e62", fontSize: 10, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
        <Tooltip
          contentStyle={{ background: "#fff", border: "1px solid #e2dcd0", borderRadius: 4, fontFamily: "DM Mono", fontSize: 11 }}
          formatter={(v, n) => [`${v}%`, n === "variance" ? "Individual" : "Cumulative"]}
        />
        <ReferenceLine yAxisId="right" y={90} stroke="#c84b11" strokeDasharray="4 4" strokeWidth={1} />
        <Bar yAxisId="left" dataKey="variance" radius={[3, 3, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i < nComponents ? "#c84b11" : "#e2dcd0"} />
          ))}
        </Bar>
        <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#2563a8" strokeWidth={2} dot={{ r: 3, fill: "#2563a8" }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
