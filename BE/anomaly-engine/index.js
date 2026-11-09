/**
 * Anomaly Engine — Entry Point
 * =============================
 * Tích hợp cả 3 tầng phát hiện bất thường:
 *   1. Rule-based
 *   2. Statistical (Z-Score + Moving Average)
 *   3. Template Mining (Drain) + Vectorize → gọi Python ML API (ml_api.py) để predict real-time
 *
 * Cách hoạt động của Tầng 3 (ML real-time):
 *   - Node.js dùng Drain để vectorize chuỗi log thành feature vector
 *   - Gọi HTTP POST tới Python FastAPI (ml_api.py) tại ML_API_URL
 *   - Nhận kết quả { is_anomaly, anomaly_score, method } và trả về
 *
 * Khởi động ML API (cần chạy trước):
 *   pip install fastapi uvicorn scikit-learn joblib numpy
 *   python anomaly-engine/ml-models/ml_api.py
 */

import { detectRuleBased } from './rule-based/detector.js';
import { detectStatistical } from './statistical/detector.js';
import { vectorizeDataset } from './template-mining/vectorizer.js';
import { writeFileSync } from 'fs';
import { Worker as WorkerThread } from 'worker_threads';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DRAIN_WORKER_PATH = path.join(__dirname, 'drain_worker.js');

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';
const ML_API_TIMEOUT_MS = parseInt(process.env.ML_API_TIMEOUT_MS || '3000', 10);

/**
 * Chạy Drain vectorization trong Worker Thread riêng để không block Event Loop.
 *
 * @param {Array} sequences
 * @param {Object} drainOptions
 * @returns {Promise<{ X, y, templateIds, templates }>}
 */
function vectorizeInWorker(sequences, drainOptions = {}) {
  return new Promise((resolve, reject) => {
    const worker = new WorkerThread(DRAIN_WORKER_PATH, {
      workerData: { sequences, drainOptions }
    });

    worker.on('message', (result) => {
      if (result.success) {
        resolve(result);
      } else {
        reject(new Error(result.error));
      }
    });

    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Drain Worker Thread thoát với code ${code}`));
    });
  });
}


/**
 * Gọi Python ML API để predict anomaly từ feature vector.
 * Trả về null nếu ML service không khả dụng (graceful degradation).
 *
 * @param {number[]} vector - Event Count Vector từ Drain vectorizer
 * @returns {Promise<{is_anomaly: boolean, anomaly_score: number, method: string} | null>}
 */
async function callMlPredict(vector) {
  if (!vector || vector.length === 0) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ML_API_TIMEOUT_MS);

    const response = await fetch(`${ML_API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vector }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[Anomaly Engine] ML API trả về lỗi HTTP ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`[Anomaly Engine] ML API timeout sau ${ML_API_TIMEOUT_MS}ms — bỏ qua.`);
    } else {
      console.warn(`[Anomaly Engine] Không kết nối được ML API (${ML_API_URL}): ${err.message}`);
    }
    return null;
  }
}

/**
 * Chạy phân tích bất thường đầy đủ 3 tầng trên một tập logs.
 *
 * @param {Array<Object>} logs         - Danh sách log đã chuẩn hóa (Standard Schema)
 * @param {Object} options
 * @param {string} options.service     - Tên service (để thống kê)
 * @param {number} options.errorThreshold - Ngưỡng Rule-based (mặc định 10)
 * @param {number} options.bucketMs    - Time bucket cho statistical (mặc định 60000ms)
 * @param {number} options.zThreshold  - Ngưỡng Z-Score (mặc định 2.5)
 */
export async function runAnomalyDetection(logs, {
  service = 'unknown',
  errorThreshold = 10,
  bucketMs = 60_000,
  zThreshold = 2.5
} = {}) {
  const startTime = Date.now();

  const results = {
    service,
    analyzed_at: new Date().toISOString(),
    log_count: logs.length,
    detections: {}
  };

  // --- Tầng 1: Rule-based ---
  results.detections.rule_based = detectRuleBased(logs, { errorThreshold, windowMs: bucketMs });

  // --- Tầng 2: Statistical ---
  results.detections.statistical = detectStatistical(logs, {
    bucketMs,
    filterLevel: 'ERROR',
    zThreshold
  });

  // --- Tầng 3: Template Mining (Drain) trong Worker Thread + ML Prediction real-time ---
  const singleSequence = [{ log_lines: logs, is_anomaly: false }];

  // Drain chạy trong Worker Thread riêng — không block Event Loop
  const { X, templates } = await vectorizeInWorker(singleSequence).catch(err => {
    console.warn(`[Anomaly Engine] Drain Worker lỗi, fallback sync: ${err.message}`);
    return vectorizeDataset(singleSequence); // fallback sang sync nếu worker lỗi
  });
  const featureVector = X[0] || [];

  // Gọi Python ML API để predict (graceful: nếu service down thì bỏ qua)
  const mlResult = await callMlPredict(featureVector);

  results.detections.template_mining = {
    templates_found: templates.length,
    templates: templates.slice(0, 20),
    feature_vector: featureVector,
    ml_prediction: mlResult
      ? {
          is_anomaly: mlResult.is_anomaly,
          anomaly_score: mlResult.anomaly_score,
          method: mlResult.method,
        }
      : { is_anomaly: false, anomaly_score: 0, method: 'ml_api_unavailable' }
  };

  // Tổng hợp kết quả: anomaly nếu bất kỳ tầng nào phát hiện
  const anyAnomaly =
    results.detections.rule_based.is_anomaly ||
    results.detections.statistical.is_anomaly ||
    (mlResult?.is_anomaly ?? false);

  results.is_anomaly = anyAnomaly;
  results.detection_latency_ms = Date.now() - startTime;

  return results;
}

/**
 * Xuất feature vectors của một dataset (HDFS/BGL sequences) ra file JSON
 * để script Python (train_and_evaluate.py) có thể đọc và huấn luyện ML model.
 *
 * @param {Array<Object>} sequences   - Sequences với log_lines & is_anomaly
 * @param {string} outputPath         - Đường dẫn file JSON output
 * @param {string} datasetName        - Tên dataset ("hdfs" | "bgl")
 */
export function exportVectorsForML(sequences, outputPath, datasetName = 'unknown') {
  console.log(`[Anomaly Engine] Đang vectorize ${sequences.length} sequences với Drain...`);
  const { X, y, templates } = vectorizeDataset(sequences);

  const output = {
    dataset: datasetName,
    total_sequences: sequences.length,
    template_count: templates.length,
    feature_dim: X[0]?.length || 0,
    X,
    y
  };

  writeFileSync(outputPath, JSON.stringify(output), 'utf-8');
  console.log(`[Anomaly Engine] Đã xuất vectors ra: ${outputPath}`);
  console.log(`  → ${sequences.length} sequences | ${templates.length} templates | vector dim: ${X[0]?.length || 0}`);
  console.log(`  → Anomaly: ${y.filter(v => v === 1).length} | Normal: ${y.filter(v => v === 0).length}`);
}
