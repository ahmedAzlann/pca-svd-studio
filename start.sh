#!/bin/bash
echo "========================================="
echo "   PCA / SVD Studio — Starting Up"
echo "========================================="

# ── Backend ──
echo ""
echo "▶ Setting up backend..."
cd backend
python3 -m venv venv 2>/dev/null
source venv/bin/activate
pip install -r requirements.txt -q
echo "▶ Starting backend on http://localhost:8000"
python3 -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# ── Frontend ──
echo ""
echo "▶ Setting up frontend..."
cd frontend
npm install -q
echo "▶ Starting frontend on http://localhost:3000"
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================="
echo "  ✅ Backend  → http://localhost:8000"
echo "  ✅ Frontend → http://localhost:3000"
echo "  📖 API Docs → http://localhost:8000/docs"
echo "========================================="
echo ""
echo "Press Ctrl+C to stop both servers"

trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
