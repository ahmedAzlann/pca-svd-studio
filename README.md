# PCA / SVD Studio — Dimensionality Reduction App

A full-stack web application for exploring **Principal Component Analysis (PCA)** and **Singular Value Decomposition (SVD)** for dimensionality reduction and visualization.

## View the live project - https://pca-svd-studio.vercel.app/

---

## Features

- **PCA & SVD** — switch between methods instantly
- **4 Built-in Datasets** — Iris, Wine, Breast Cancer, Digits
- **CSV Upload** — bring your own dataset
- **Interactive 2D Scatter Plot** with class ellipses and hover tooltips
- **Scree Plot** — individual + cumulative explained variance with elbow line
- **Feature Loadings** — top contributing features for PC1 and PC2
- **Singular Values** visualization
- **KNN Accuracy Comparison** — original vs reduced features
- **Variance Table** — per-component breakdown

---

## Project Structure

```
pca-app/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── App.js / App.css
│   │   ├── index.js
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   └── Dashboard.css
│   │   └── components/
│   │       ├── ScatterPlot.js
│   │       ├── ScreePlot.js
│   │       ├── LoadingsChart.js
│   │       └── AccuracyComparison.js
│   └── package.json
├── sample_data.csv
└── README.md
```

---

## Quick Start

### Backend

```bash
cd pca-app/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8000
```

### Frontend (new terminal)

```bash
cd pca-app/frontend
npm install
npm start
```

- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/api/datasets` | List built-in datasets |
| POST | `/api/analyze/builtin` | Run PCA/SVD on built-in dataset |
| POST | `/api/analyze/upload` | Run PCA/SVD on uploaded CSV |

### Example Request

```json
POST /api/analyze/builtin
{
  "dataset": "iris",
  "method": "pca",
  "n_components": 2,
  "test_size": 0.2,
  "scale": true,
  "random_state": 42
}
```

---

## How PCA Works

1. **Standardize** features (zero mean, unit variance)
2. **Compute covariance matrix** of the features
3. **Eigendecomposition** → eigenvectors (principal components) & eigenvalues
4. **Sort** by eigenvalue (largest = most variance)
5. **Project** data onto top-k principal components
6. **Explained variance ratio** = eigenvalue / sum of all eigenvalues

## How SVD Works

1. **Decompose** matrix X = U · Σ · Vᵀ
2. **U** = left singular vectors (sample directions)
3. **Σ** = singular values (importance of each direction)
4. **Vᵀ** = right singular vectors (feature directions)
5. **Project** using top-k columns of U · Σ
6. **TruncatedSVD** avoids full matrix — efficient for sparse/large data

**Key difference**: PCA centers the data first; SVD operates on the raw matrix (useful for sparse data like TF-IDF).

---

## CSV Upload Format

```
feature1,feature2,feature3,target
1.2,3.4,5.6,classA
...
```

- All feature columns must be numeric
- Target column name is configurable (default: `target`)

## Scrennshots
<img width="1050" height="558" alt="image" src="https://github.com/user-attachments/assets/aa7e6ec3-ddbc-4b1a-b25b-9ebc1e9a2c4c" />
