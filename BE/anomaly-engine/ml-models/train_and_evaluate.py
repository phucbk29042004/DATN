"""
ML Models — Isolation Forest & Logistic Regression
====================================================
Script Python dùng để:
  1. Load feature vectors đã được vectorize từ Node.js (định dạng JSON)
  2. Huấn luyện & đánh giá Isolation Forest (Unsupervised) và Logistic Regression (Supervised)
  3. Xuất kết quả precision / recall / F1-score ra file JSON để Node.js Backend có thể đọc

Tham khảo:
  - Isolation Forest: Liu et al., "Isolation Forest", ICDM 2008
  - Logistic Regression: sklearn.linear_model.LogisticRegression

Cách chạy:
  python anomaly-engine/ml-models/train_and_evaluate.py \\
    --input  anomaly-engine/ml-models/vectors.json \\
    --output anomaly-engine/ml-models/results.json

Format input JSON:
  {
    "X": [[f1, f2, ...], ...],   -- Ma trận đặc trưng
    "y": [0, 1, 0, 1, ...],      -- Nhãn (0=Normal, 1=Anomaly)
    "dataset": "hdfs" | "bgl"
  }
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (classification_report, confusion_matrix,
                             f1_score, precision_score, recall_score)
from sklearn.preprocessing import StandardScaler

try:
    import joblib
except ImportError:
    joblib = None


def time_based_split(X, y, train_ratio=0.8):
    """
    Chia dữ liệu theo trục thời gian (Time-based Holdout).
    Phần train_ratio đầu là tập huấn luyện, phần còn lại là tập test.
    KHÔNG xáo trộn ngẫu nhiên vì log có tính tuần tự thời gian.
    """
    n = len(X)
    split_idx = int(n * train_ratio)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    return X_train, X_test, y_train, y_test


def evaluate_isolation_forest(X_train, X_test, y_test, contamination=0.1, save_dir=None):
    """
    Isolation Forest — Phân loại không giám sát (Unsupervised)
    contamination: Tỷ lệ ước tính anomaly trong tập train (mặc định 10%)
    save_dir: Thư mục để lưu model .pkl (nếu được chỉ định)
    """
    print("\n[Isolation Forest] Đang huấn luyện...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train_scaled)

    # Isolation Forest trả về -1 (anomaly) và 1 (normal) → chuyển sang 0/1
    raw_pred = model.predict(X_test_scaled)
    y_pred = np.where(raw_pred == -1, 1, 0)

    # Lưu model để ml_api.py có thể load và serve real-time
    if save_dir and joblib is not None:
        save_dir = Path(save_dir)
        save_dir.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, save_dir / "isolation_forest.pkl")
        joblib.dump(scaler, save_dir / "if_scaler.pkl")
        print(f"  → Model Isolation Forest đã lưu tại: {save_dir}")

    return _build_report("isolation_forest", y_test, y_pred)


def evaluate_logistic_regression(X_train, X_test, y_train, y_test, save_dir=None):
    """
    Logistic Regression — Phân loại có giám sát (Supervised)
    Yêu cầu nhãn trong tập train.
    save_dir: Thư mục để lưu model .pkl (nếu được chỉ định)
    """
    print("[Logistic Regression] Đang huấn luyện...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = LogisticRegression(
        max_iter=1000,
        class_weight='balanced',  # Xử lý mất cân bằng nhãn (class imbalance)
        random_state=42,
        solver='lbfgs'
    )
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)

    # Lưu model để ml_api.py có thể load và serve real-time
    if save_dir and joblib is not None:
        save_dir = Path(save_dir)
        save_dir.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, save_dir / "logistic_regression.pkl")
        joblib.dump(scaler, save_dir / "lr_scaler.pkl")
        print(f"  → Model Logistic Regression đã lưu tại: {save_dir}")

    return _build_report("logistic_regression", y_test, y_pred)


def _build_report(method_name, y_test, y_pred):
    """Xây dựng báo cáo kết quả đánh giá chuẩn hóa"""
    # Tránh lỗi khi tập test không có anomaly
    zero_div = 0

    precision = precision_score(y_test, y_pred, zero_division=zero_div)
    recall = recall_score(y_test, y_pred, zero_division=zero_div)
    f1 = f1_score(y_test, y_pred, zero_division=zero_div)
    cm = confusion_matrix(y_test, y_pred).tolist()

    report = {
        "method": method_name,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": cm,  # [[TN, FP], [FN, TP]]
        "test_size": len(y_test),
        "anomaly_count_actual": int(np.sum(y_test)),
        "anomaly_count_predicted": int(np.sum(y_pred))
    }

    print(f"\n--- Kết quả {method_name} ---")
    print(f"  Precision : {precision:.4f}")
    print(f"  Recall    : {recall:.4f}")
    print(f"  F1-Score  : {f1:.4f}")
    print(f"  Confusion Matrix:\n{np.array(cm)}")

    return report


def main():
    parser = argparse.ArgumentParser(description="Huấn luyện & đánh giá ML models phát hiện bất thường log")
    parser.add_argument("--input",  required=True, help="File JSON chứa X, y vectors")
    parser.add_argument("--output", required=True, help="File JSON lưu kết quả đánh giá")
    parser.add_argument("--train-ratio", type=float, default=0.8, help="Tỷ lệ tập train (mặc định 0.8)")
    parser.add_argument("--contamination", type=float, default=0.1,
                        help="Tỷ lệ anomaly ước tính cho Isolation Forest (mặc định 0.1)")
    parser.add_argument("--save-model", action="store_true",
                        help="Lưu model đã train ra .pkl để ml_api.py phục vụ real-time prediction")
    parser.add_argument("--model-dir", default=str(Path(__file__).parent),
                        help="Thư mục lưu model .pkl (mặc định: thư mục chứa script này)")
    args = parser.parse_args()

    # Load input data
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"[Error] File input không tồn tại: {input_path}", file=sys.stderr)
        sys.exit(1)

    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    X = np.array(data["X"], dtype=float)
    y = np.array(data["y"], dtype=int)
    dataset_name = data.get("dataset", "unknown")

    print(f"[ML Trainer] Dataset: {dataset_name}")
    print(f"[ML Trainer] Tổng sequences: {len(X)} | Anomaly: {int(np.sum(y))} | Normal: {int(len(y) - np.sum(y))}")

    if len(X) < 10:
        print("[Error] Không đủ dữ liệu để huấn luyện (cần ít nhất 10 sequences)", file=sys.stderr)
        sys.exit(1)

    # Time-based split (Không shuffle!)
    X_train, X_test, y_train, y_test = time_based_split(X, y, args.train_ratio)
    print(f"[ML Trainer] Train: {len(X_train)} | Test: {len(X_test)}")

    results = {
        "dataset": dataset_name,
        "total_sequences": len(X),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "split_method": "time_based_holdout",
        "models": []
    }

    # Isolation Forest (Unsupervised — không dùng nhãn khi train)
    save_dir = args.model_dir if args.save_model else None
    if_report = evaluate_isolation_forest(X_train, X_test, y_test, args.contamination, save_dir=save_dir)
    results["models"].append(if_report)

    # Logistic Regression (Supervised — dùng nhãn khi train)
    lr_report = evaluate_logistic_regression(X_train, X_test, y_train, y_test, save_dir=save_dir)
    results["models"].append(lr_report)

    if args.save_model:
        print(f"\n[ML Trainer] Models đã được lưu. Reload ml_api.py hoặc gọi POST /reload-model để cập nhật.")

    # Lưu kết quả
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n[ML Trainer] Kết quả đã lưu vào: {output_path}")


if __name__ == "__main__":
    main()
