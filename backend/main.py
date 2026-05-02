from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import pandas as pd
from sklearn.decomposition import PCA, TruncatedSVD
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.datasets import load_iris, load_wine, load_breast_cancer, load_digits
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score
import io
from typing import Optional
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PCA/SVD Dimensionality Reduction API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    dataset: str = "iris"
    method: str = "pca"          # pca | svd
    n_components: Optional[int] = 2
    test_size: float = 0.2
    random_state: int = 42
    scale: bool = True


def load_builtin(name: str):
    loaders = {
        "iris": load_iris,
        "wine": load_wine,
        "breast_cancer": load_breast_cancer,
        "digits": load_digits,
    }
    if name not in loaders:
        raise HTTPException(status_code=400, detail=f"Unknown dataset: {name}")
    data = loaders[name]()
    feature_names = list(data.feature_names) if hasattr(data, "feature_names") else [f"f{i}" for i in range(data.data.shape[1])]
    class_names = list(data.target_names.astype(str)) if hasattr(data, "target_names") else [str(i) for i in np.unique(data.target)]
    return data.data, data.target, feature_names, class_names


def run_reduction(X, y, method, n_components, scale, random_state):
    if scale:
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
    else:
        X_scaled = X.copy()

    max_comp = min(X.shape[0], X.shape[1])
    n_comp = min(n_components or 2, max_comp)

    if method == "pca":
        # Full PCA for variance explained
        full_pca = PCA(random_state=random_state)
        full_pca.fit(X_scaled)
        explained_variance_full = full_pca.explained_variance_ratio_.tolist()

        # Reduced PCA
        reducer = PCA(n_components=n_comp, random_state=random_state)
        X_reduced = reducer.fit_transform(X_scaled)
        explained_variance = reducer.explained_variance_ratio_.tolist()
        singular_values = reducer.singular_values_.tolist()
        components = reducer.components_.tolist()
        loadings = (reducer.components_.T * np.sqrt(reducer.explained_variance_)).T.tolist()

    else:  # svd
        full_svd = TruncatedSVD(n_components=min(max_comp - 1, X_scaled.shape[1] - 1), random_state=random_state)
        full_svd.fit(X_scaled)
        explained_variance_full = full_svd.explained_variance_ratio_.tolist()

        reducer = TruncatedSVD(n_components=n_comp, random_state=random_state)
        X_reduced = reducer.fit_transform(X_scaled)
        explained_variance = reducer.explained_variance_ratio_.tolist()
        singular_values = reducer.singular_values_.tolist()
        components = reducer.components_.tolist()
        loadings = components  # approximate for SVD

    return X_reduced, explained_variance, explained_variance_full, singular_values, components, loadings, n_comp


@app.get("/")
def root():
    return {"status": "running", "app": "PCA/SVD Dimensionality Reduction"}


@app.get("/api/datasets")
def list_datasets():
    return {"datasets": [
        {"name": "iris",         "desc": "150 samples · 4 features · 3 classes"},
        {"name": "wine",         "desc": "178 samples · 13 features · 3 classes"},
        {"name": "breast_cancer","desc": "569 samples · 30 features · 2 classes"},
        {"name": "digits",       "desc": "1797 samples · 64 features · 10 classes"},
    ]}


@app.post("/api/analyze/builtin")
def analyze_builtin(req: AnalysisRequest):
    X, y, feature_names, class_names = load_builtin(req.dataset)

    X_reduced, ev, ev_full, sv, components, loadings, n_comp = run_reduction(
        X, y, req.method, req.n_components, req.scale, req.random_state
    )

    # KNN accuracy comparison
    scaler = StandardScaler()
    X_sc = scaler.fit_transform(X)
    Xtr, Xte, ytr, yte = train_test_split(X_sc, y, test_size=req.test_size, random_state=req.random_state, stratify=y)
    Xtr_r, Xte_r, _, _ = train_test_split(X_reduced, y, test_size=req.test_size, random_state=req.random_state, stratify=y)

    knn_orig = KNeighborsClassifier(n_neighbors=5)
    knn_orig.fit(Xtr, ytr)
    acc_orig = float(accuracy_score(yte, knn_orig.predict(Xte)))

    knn_red = KNeighborsClassifier(n_neighbors=5)
    knn_red.fit(Xtr_r, ytr)
    acc_red = float(accuracy_score(yte, knn_red.predict(Xte_r)))

    # Scatter
    colors = ["#f97316", "#06b6d4", "#a855f7", "#22c55e", "#f43f5e",
              "#eab308", "#3b82f6", "#ec4899", "#14b8a6", "#8b5cf6"]
    scatter = []
    for i, cn in enumerate(class_names):
        mask = y == i
        pts = X_reduced[mask]
        scatter.append({
            "class": cn,
            "color": colors[i % len(colors)],
            "x": pts[:, 0].tolist(),
            "y": pts[:, 1].tolist() if n_comp >= 2 else [0.0] * int(mask.sum()),
        })

    # Scree data
    scree = [{"component": f"PC{i+1}", "variance": round(v * 100, 2), "cumulative": round(sum(ev_full[:i+1]) * 100, 2)}
             for i, v in enumerate(ev_full[:15])]

    # Top feature loadings for PC1 & PC2
    top_loadings = []
    for pc_idx in range(min(2, n_comp)):
        comp = np.array(components[pc_idx])
        top_idx = np.argsort(np.abs(comp))[::-1][:8]
        top_loadings.append([{"feature": feature_names[j], "loading": round(float(comp[j]), 4)} for j in top_idx])

    return {
        "dataset": req.dataset,
        "method": req.method.upper(),
        "original_shape": list(X.shape),
        "reduced_shape": list(X_reduced.shape),
        "n_components": n_comp,
        "feature_names": feature_names,
        "class_names": class_names,
        "explained_variance": [round(v * 100, 2) for v in ev],
        "cumulative_variance": round(sum(ev) * 100, 2),
        "singular_values": [round(v, 4) for v in sv],
        "scatter_data": scatter,
        "scree_data": scree,
        "top_loadings": top_loadings,
        "accuracy_original": round(acc_orig * 100, 2),
        "accuracy_reduced": round(acc_red * 100, 2),
    }


@app.post("/api/analyze/upload")
async def analyze_upload(
    file: UploadFile = File(...),
    target_column: str = "target",
    method: str = "pca",
    n_components: int = 2,
    scale: bool = True,
):
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot parse CSV: {e}")

    if target_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{target_column}' not found. Available: {list(df.columns)}")

    y_raw = df[target_column]
    X_df = df.drop(columns=[target_column]).select_dtypes(include=[np.number])
    X = X_df.values
    feature_names = list(X_df.columns)

    le = LabelEncoder()
    y = le.fit_transform(y_raw)
    class_names = list(le.classes_.astype(str))

    if X.shape[0] < 10:
        raise HTTPException(status_code=400, detail="Need at least 10 rows.")

    X_reduced, ev, ev_full, sv, components, loadings, n_comp = run_reduction(
        X, y, method, n_components, scale, 42
    )

    colors = ["#f97316", "#06b6d4", "#a855f7", "#22c55e", "#f43f5e",
              "#eab308", "#3b82f6", "#ec4899", "#14b8a6", "#8b5cf6"]
    scatter = []
    for i, cn in enumerate(class_names):
        mask = y == i
        pts = X_reduced[mask]
        scatter.append({
            "class": cn,
            "color": colors[i % len(colors)],
            "x": pts[:, 0].tolist(),
            "y": pts[:, 1].tolist() if n_comp >= 2 else [0.0] * int(mask.sum()),
        })

    scree = [{"component": f"PC{i+1}", "variance": round(v * 100, 2), "cumulative": round(sum(ev_full[:i+1]) * 100, 2)}
             for i, v in enumerate(ev_full[:15])]

    top_loadings = []
    for pc_idx in range(min(2, n_comp)):
        comp = np.array(components[pc_idx])
        top_idx = np.argsort(np.abs(comp))[::-1][:8]
        top_loadings.append([{"feature": feature_names[j], "loading": round(float(comp[j]), 4)} for j in top_idx])

    return {
        "dataset": file.filename,
        "method": method.upper(),
        "original_shape": list(X.shape),
        "reduced_shape": list(X_reduced.shape),
        "n_components": n_comp,
        "feature_names": feature_names,
        "class_names": class_names,
        "explained_variance": [round(v * 100, 2) for v in ev],
        "cumulative_variance": round(sum(ev) * 100, 2),
        "singular_values": [round(v, 4) for v in sv],
        "scatter_data": scatter,
        "scree_data": scree,
        "top_loadings": top_loadings,
        "accuracy_original": None,
        "accuracy_reduced": None,
    }
