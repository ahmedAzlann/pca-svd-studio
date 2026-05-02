import React, { useState } from "react";
import axios from "axios";
import ScatterPlot from "../components/ScatterPlot";
import ScreePlot from "../components/ScreePlot";
import LoadingsChart from "../components/LoadingsChart";
import AccuracyComparison from "../components/AccuracyComparison";
import "./Dashboard.css";

const API = "http://localhost:8000";

const DATASETS = [
  { id: "iris",          label: "Iris",          desc: "150 × 4 · 3 classes" },
  { id: "wine",          label: "Wine",          desc: "178 × 13 · 3 classes" },
  { id: "breast_cancer", label: "Breast Cancer", desc: "569 × 30 · 2 classes" },
  { id: "digits",        label: "Digits",        desc: "1797 × 64 · 10 classes" },
];

export default function Dashboard() {
  const [mode, setMode]             = useState("builtin");
  const [dataset, setDataset]       = useState("iris");
  const [method, setMethod]         = useState("pca");
  const [nComponents, setNComp]     = useState(2);
  const [testSize, setTestSize]     = useState(0.2);
  const [scale, setScale]           = useState(true);
  const [uploadFile, setUploadFile] = useState(null);
  const [targetCol, setTargetCol]   = useState("target");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null);

  const run = async () => {
    setLoading(true); setError(null);
    try {
      let data;
      if (mode === "builtin") {
        const res = await axios.post(`${API}/api/analyze/builtin`, {
          dataset, method, n_components: nComponents, test_size: testSize, scale, random_state: 42,
        });
        data = res.data;
      } else {
        if (!uploadFile) return;
        const fd = new FormData();
        fd.append("file", uploadFile);
        const res = await axios.post(
          `${API}/api/analyze/upload?target_column=${targetCol}&method=${method}&n_components=${nComponents}&scale=${scale}`,
          fd, { headers: { "Content-Type": "multipart/form-data" } }
        );
        data = res.data;
      }
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dash">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-mark">◈</span>
            <div>
              <div className="logo-title">PCA <span className="slash">/</span> SVD <span className="logo-sub-inline">Studio</span></div>
              <div className="logo-sub mono">Dimensionality Reduction & Visualization</div>
            </div>
          </div>
          <div className="method-pills">
            <button className={`pill ${method === "pca" ? "active-orange" : ""}`} onClick={() => setMethod("pca")}>PCA</button>
            <button className={`pill ${method === "svd" ? "active-blue" : ""}`} onClick={() => setMethod("svd")}>SVD</button>
          </div>
        </div>
      </header>

      <div className="body-grid">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="section-label mono">DATA SOURCE</div>
            <div className="tab-row">
              <button className={`tab ${mode === "builtin" ? "active" : ""}`} onClick={() => setMode("builtin")}>Built-in</button>
              <button className={`tab ${mode === "upload" ? "active" : ""}`} onClick={() => setMode("upload")}>Upload CSV</button>
            </div>
          </div>

          {mode === "builtin" ? (
            <div className="sidebar-section">
              <div className="section-label mono">DATASET</div>
              {DATASETS.map(d => (
                <button key={d.id} className={`ds-btn ${dataset === d.id ? "active" : ""}`} onClick={() => { setDataset(d.id); setResult(null); }}>
                  <span className="ds-name">{d.label}</span>
                  <span className="ds-desc mono">{d.desc}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="sidebar-section">
              <div className="section-label mono">UPLOAD</div>
              <label className="drop-zone">
                <input type="file" accept=".csv" style={{ display: "none" }} onChange={e => setUploadFile(e.target.files[0])} />
                {uploadFile ? (
                  <><div className="dz-icon ok">✓</div><div className="dz-name">{uploadFile.name}</div></>
                ) : (
                  <><div className="dz-icon">↑</div><div className="dz-name">Drop or click to browse</div></>
                )}
              </label>
              <div className="section-label mono" style={{ marginTop: 12 }}>TARGET COLUMN</div>
              <input className="field-input mono" value={targetCol} onChange={e => setTargetCol(e.target.value)} placeholder="target" />
            </div>
          )}

          <div className="sidebar-section">
            <div className="section-label mono">PARAMETERS</div>

            <div className="param-row">
              <label className="param-label">Components</label>
              <input type="number" className="field-input mono" min={1} max={20} value={nComponents}
                onChange={e => setNComp(parseInt(e.target.value) || 2)} style={{ width: 70 }} />
            </div>

            <div className="param-row">
              <label className="param-label">Test Split <strong>{Math.round(testSize * 100)}%</strong></label>
            </div>
            <input type="range" className="slider" min={0.1} max={0.4} step={0.05} value={testSize}
              onChange={e => setTestSize(parseFloat(e.target.value))} />
            <div className="slider-ends mono"><span>10%</span><span>40%</span></div>

            <div className="toggle-row">
              <label className="param-label">Standardize Features</label>
              <div className={`toggle ${scale ? "on" : ""}`} onClick={() => setScale(!scale)}>
                <div className="toggle-thumb" />
              </div>
            </div>
          </div>

          <button className="run-btn" onClick={run} disabled={loading || (mode === "upload" && !uploadFile)}>
            {loading ? <><span className="spin" /> Analysing…</> : <>Run {method.toUpperCase()}</>}
          </button>

          {error && <div className="error-msg mono">{error}</div>}

          {result && (
            <div className="stat-box">
              <div className="stat-row"><span className="mono">Original</span><span className="mono val-orange">{result.original_shape[0]} × {result.original_shape[1]}</span></div>
              <div className="stat-row"><span className="mono">Reduced</span><span className="mono val-blue">{result.reduced_shape[0]} × {result.reduced_shape[1]}</span></div>
              <div className="stat-row"><span className="mono">Variance kept</span><span className="mono val-green">{result.cumulative_variance}%</span></div>
            </div>
          )}
        </aside>

        {/* ── Main ── */}
        <main className="main">
          {!result && !loading && (
            <div className="empty">
              <div className="empty-mark">◈</div>
              <div className="empty-title">Configure &amp; Run Analysis</div>
              <div className="empty-sub">Choose PCA or SVD, select a dataset, set your parameters, then click Run.</div>
            </div>
          )}

          {loading && (
            <div className="empty">
              <div className="big-spin" />
              <div className="empty-sub mono">Computing {method.toUpperCase()} projections…</div>
            </div>
          )}

          {result && !loading && (
            <div className="results">
              {/* Row 1: Scatter + Scree */}
              <div className="row-2">
                <div className="card">
                  <div className="card-hd">
                    <span className="card-title">2D Projection — {result.method}</span>
                    <span className="badge orange">{result.n_components} components</span>
                  </div>
                  <ScatterPlot data={result.scatter_data} />
                </div>
                <div className="card">
                  <div className="card-hd">
                    <span className="card-title">Scree Plot</span>
                    <span className="badge blue">{result.cumulative_variance}% variance</span>
                  </div>
                  <ScreePlot data={result.scree_data} nComponents={result.n_components} />
                </div>
              </div>

              {/* Row 2: Loadings + Accuracy */}
              <div className="row-2">
                <div className="card">
                  <div className="card-hd">
                    <span className="card-title">Feature Loadings — PC1</span>
                  </div>
                  <LoadingsChart data={result.top_loadings[0] || []} />
                </div>

                <div className="card">
                  <div className="card-hd">
                    <span className="card-title">
                      {result.top_loadings[1] ? "Feature Loadings — PC2" : "Singular Values"}
                    </span>
                  </div>
                  {result.top_loadings[1]
                    ? <LoadingsChart data={result.top_loadings[1]} color="#2563a8" />
                    : <SingularValues values={result.singular_values} />
                  }
                </div>
              </div>

              {/* Row 3: Accuracy + Variance table */}
              <div className="row-2">
                {result.accuracy_original !== null && (
                  <div className="card">
                    <div className="card-hd"><span className="card-title">KNN Accuracy Comparison</span></div>
                    <AccuracyComparison original={result.accuracy_original} reduced={result.accuracy_reduced} />
                  </div>
                )}

                <div className="card">
                  <div className="card-hd"><span className="card-title">Explained Variance per Component</span></div>
                  <div className="var-table">
                    <div className="var-head mono">
                      <span>Component</span><span>Variance %</span><span>Cumulative %</span>
                    </div>
                    {result.scree_data.slice(0, 8).map((r, i) => (
                      <div key={i} className={`var-row ${i < result.n_components ? "highlight" : ""}`}>
                        <span className="mono">{r.component}</span>
                        <span className="mono">{r.variance}%</span>
                        <span className="mono">{r.cumulative}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SingularValues({ values }) {
  const max = Math.max(...values);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 0" }}>
      {values.slice(0, 8).map((v, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mono" style={{ fontSize: "0.7rem", color: "var(--text-dim)", width: 40 }}>σ{i + 1}</span>
          <div style={{ flex: 1, height: 6, background: "var(--surface2)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${(v / max) * 100}%`, height: "100%", background: "var(--purple)", borderRadius: 3, transition: "width 0.6s ease" }} />
          </div>
          <span className="mono" style={{ fontSize: "0.7rem", color: "var(--text-dim)", width: 60, textAlign: "right" }}>{v.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
