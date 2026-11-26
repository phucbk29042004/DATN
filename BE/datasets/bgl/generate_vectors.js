/**
 * generate_vectors.js — Sinh Feature Vectors từ BGL Dataset
 * ==========================================================
 * Pipeline:
 *   BGL_2k.log
 *     → bglLoader (parse từng dòng log + gom theo Fixed Time Window)
 *     → Drain Vectorizer (Event Count Vector)
 *     → vectors_bgl.json   ← Input cho train_and_evaluate.py
 *
 * Cách chạy:
 *   node datasets/bgl/generate_vectors.js
 *
 * Output:
 *   datasets/bgl/vectors_bgl.json
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { loadBglDataset } from './bglLoader.js';
import { vectorizeDataset } from '../../anomaly-engine/template-mining/vectorizer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LOG_FILE = path.join(__dirname, 'BGL_2k.log');
const OUT_FILE = path.join(__dirname, 'vectors_bgl.json');
const VOCAB_OUT_FILE = path.resolve(__dirname, '../../anomaly-engine/ml-models/drain_vocab.json');

// Kích thước time window: 1 phút = 60,000 ms (khớp đặc tả cửa sổ 60s)
const WINDOW_SIZE_MS = 60_000;

async function main() {
  console.log('=======================================================');
  console.log('BGL → Drain Vectorizer → vectors_bgl.json');
  console.log('=======================================================\n');

  // Bước 1: Load dataset BGL (parse log + gom theo time window)
  const { windows } = await loadBglDataset(LOG_FILE, WINDOW_SIZE_MS);

  if (windows.length < 10) {
    console.error('[Vectorizer] Không đủ windows để vectorize (cần ít nhất 10). Thử giảm WINDOW_SIZE_MS.');
    process.exit(1);
  }

  // Bước 2: Drain Vectorize — chuyển mỗi window thành Event Count Vector
  console.log(`\n[Vectorizer] Đang fit Drain và vectorize ${windows.length} windows...`);
  const { X, y, templates } = vectorizeDataset(windows, { simThreshold: 0.4, maxChildren: 100 });

  const anomalyCount = y.filter(v => v === 1).length;
  const normalCount  = y.filter(v => v === 0).length;

  console.log(`[Vectorizer] Hoàn thành:`);
  console.log(`  → Tổng windows   : ${X.length}`);
  console.log(`  → Anomaly        : ${anomalyCount}`);
  console.log(`  → Normal         : ${normalCount}`);
  console.log(`  → Số templates   : ${templates.length}`);
  console.log(`  → Chiều vector   : ${X[0]?.length ?? 0}`);

  // Bước 3: Xuất ra JSON
  const output = {
    dataset: 'bgl',
    window_size_ms: WINDOW_SIZE_MS,
    total_windows: X.length,
    anomaly_count: anomalyCount,
    normal_count: normalCount,
    template_count: templates.length,
    vector_dim: X[0]?.length ?? 0,
    templates: templates.map(t => ({ id: t.cluster_id, template: t.template, count: t.log_count })),
    X,
    y
  };

  try {
    fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
    fs.mkdirSync(path.dirname(VOCAB_OUT_FILE), { recursive: true });
    fs.writeFileSync(VOCAB_OUT_FILE, JSON.stringify({ dataset: 'bgl', templates: output.templates }, null, 2), 'utf-8');
    console.log(`\n[SUCCESS] Đã lưu: ${OUT_FILE} & ${VOCAB_OUT_FILE}`);
  } catch (err) {
    const tmpOut = path.join(os.tmpdir(), 'vectors_bgl.json');
    fs.writeFileSync(tmpOut, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`\n[FALLBACK] Đã lưu vào TEMP: ${tmpOut}`);
  }
  console.log('   → Chạy tiếp: python anomaly-engine/ml-models/train_and_evaluate.py --input datasets/bgl/vectors_bgl.json --output anomaly-engine/ml-models/results_bgl.json --save-model');
}

main().catch(err => {
  console.error('[generate_vectors BGL] Lỗi:', err.message);
  process.exit(1);
});
