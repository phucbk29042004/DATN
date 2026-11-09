"""
ML Prediction API Server
========================
FastAPI micro-service phục vụ real-time prediction cho Node.js.

Luồng hoạt động:
  1. Script train_and_evaluate.py sẽ train model trên HDFS/BGL dataset
     và lưu model + scaler ra file .pkl bằng joblib.
  2. API này load model .pkl khi khởi động.
  3. Node.js gửi POST /predict với feature vector, API trả về kết quả anomaly.

Cài đặt:
  pip install fastapi uvicorn scikit-learn joblib numpy

Chạy server:
  python anomaly-engine/ml-models/ml_api.py
  (Mặc định chạy tại http://localhost:8000)

Node.js gọi:
  POST http://localhost:8000/predict
  Body: { "vector": [0, 1, 2, 0, 3, ...] }
"""

import os
import json
from pathlib import Path
from contextlib import asynccontextmanager

import numpy as np
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# joblib để load/save model sklearn
try:
    import joblib
except ImportError:
    raise SystemExit("Cần cài joblib: pip install joblib")

# ── Đường dẫn model ──────────────────────────────────────────────────────────
MODEL_DIR = Path(__file__).parent
IF_MODEL_PATH  = MODEL_DIR / "isolation_forest.pkl"
IF_SCALER_PATH = MODEL_DIR / "if_scaler.pkl"
LR_MODEL_PATH  = MODEL_DIR / "logistic_regression.pkl"
LR_SCALER_PATH = MODEL_DIR / "lr_scaler.pkl"

# ── State global (load 1 lần khi startup) ────────────────────────────────────
_state = {
    "if_model": None,
    "if_scaler": None,
    "lr_model": None,
    "lr_scaler": None,
    "model_loaded": False,
}


def _load_models():
    """Load tất cả model đã train vào memory."""
    loaded = False

    if IF_MODEL_PATH.exists() and IF_SCALER_PATH.exists():
        _state["if_model"]  = joblib.load(IF_MODEL_PATH)
        _state["if_scaler"] = joblib.load(IF_SCALER_PATH)
        print(f"[ML API] Isolation Forest model loaded từ {IF_MODEL_PATH}")
        loaded = True

    if LR_MODEL_PATH.exists() and LR_SCALER_PATH.exists():
        _state["lr_model"]  = joblib.load(LR_MODEL_PATH)
        _state["lr_scaler"] = joblib.load(LR_SCALER_PATH)
        print(f"[ML API] Logistic Regression model loaded từ {LR_MODEL_PATH}")
        loaded = True

    if not loaded:
        print("[ML API WARNING] Chưa tìm thấy model .pkl. "
              "Chạy train_and_evaluate.py --save-model để tạo trước.")

    _state["model_loaded"] = loaded


# ── Lifespan event (thay thế on_event deprecated) ────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    _load_models()
    yield
    print("[ML API] Shutdown.")


# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="LogPulse ML Prediction API",
    description="Real-time Anomaly Detection với Isolation Forest & Logistic Regression",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://127.0.0.1:5000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ── Schemas ───────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    vector: list[float]   # Event Count Vector từ Node.js Drain vectorizer


class PredictResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float      # 0.0 → 1.0 (xác suất bất thường)
    method: str               # "isolation_forest" | "logistic_regression" | "fallback"
    detail: str


# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": _state["model_loaded"],
        "models": {
            "isolation_forest": _state["if_model"] is not None,
            "logistic_regression": _state["lr_model"] is not None,
        }
    }


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    """
    Nhận feature vector từ Node.js, trả về kết quả anomaly detection.
    Ưu tiên Logistic Regression (supervised) nếu có model, fallback sang
    Isolation Forest (unsupervised), fallback cuối là heuristic đơn giản.
    """
    if not req.vector:
        raise HTTPException(status_code=400, detail="Vector không được rỗng")

    X = np.array(req.vector, dtype=float).reshape(1, -1)

    # Ưu tiên 1: Logistic Regression (Supervised)
    if _state["lr_model"] is not None and _state["lr_scaler"] is not None:
        X_scaled = _state["lr_scaler"].transform(X)
        prediction = _state["lr_model"].predict(X_scaled)[0]
        # predict_proba trả về [prob_normal, prob_anomaly]
        proba = _state["lr_model"].predict_proba(X_scaled)[0]
        anomaly_score = float(proba[1]) if len(proba) > 1 else float(prediction)
        return PredictResponse(
            is_anomaly=bool(prediction == 1),
            anomaly_score=round(anomaly_score, 4),
            method="logistic_regression",
            detail="Supervised prediction"
        )

    # Ưu tiên 2: Isolation Forest (Unsupervised)
    if _state["if_model"] is not None and _state["if_scaler"] is not None:
        X_scaled = _state["if_scaler"].transform(X)
        raw_pred = _state["if_model"].predict(X_scaled)[0]
        # decision_function: âm = bất thường, dương = bình thường
        score_raw = _state["if_model"].decision_function(X_scaled)[0]
        # Chuẩn hóa sang [0, 1]: score âm → gần 1 (anomaly)
        anomaly_score = float(max(0.0, min(1.0, 0.5 - score_raw * 0.5)))
        return PredictResponse(
            is_anomaly=bool(raw_pred == -1),
            anomaly_score=round(anomaly_score, 4),
            method="isolation_forest",
            detail="Unsupervised prediction"
        )

    # Fallback: Heuristic đơn giản (không có model)
    # Nếu log count tổng cao bất thường (>95th percentile heuristic)
    total_count = float(sum(req.vector))
    anomaly_score = min(1.0, total_count / 100.0)
    return PredictResponse(
        is_anomaly=anomaly_score > 0.7,
        anomaly_score=round(anomaly_score, 4),
        method="fallback_heuristic",
        detail="Model chưa được train. Dùng heuristic tạm thời."
    )


@app.post("/reload-model")
def reload_model():
    """Reload model từ disk (dùng sau khi train xong mà không restart server)."""
    _load_models()
    return {"status": "reloaded", "model_loaded": _state["model_loaded"]}


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("ML_API_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
