/**
 * generate_vectors.js — Sinh Feature Vectors từ HDFS Dataset
 * ===========================================================
 * Pipeline:
 *   HDFS_2k.log + anomaly_label.csv
 *     → hdfsLoader (parse + gom sequences theo block_id)
 *     → Drain Vectorizer (Event Count Vector)
 *     → vectors_hdfs.json   ← Input cho train_and_evaluate.py
 *
 * Cách chạy:
 *   node datasets/hdfs/generate_vectors.js
 *
 * Output:
 *   datasets/hdfs/vectors_hdfs.json
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { loadHdfsDataset } from './hdfsLoader.js';
import { vectorizeDataset } from '../../anomaly-engine/template-mining/vectorizer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LOG_FILE   = path.join(__dirname, 'HDFS_2k.log');
const LABEL_FILE = path.join(__dirname, 'anomaly_label.csv');
const OUT_FILE   = path.join(__dirname, 'vectors_hdfs.json');

async function main() {
  console.log('=======================================================');
  console.log('HDFS → Drain Vectorizer → vectors_hdfs.json');
  console.log('=======================================================\n');

  // Bước 1: Load dataset HDFS (parse log + gom sequences theo block_id)
  const sequences = await loadHdfsDataset(LOG_FILE, LABEL_FILE);

  // Chỉ giữ sequences có nhãn rõ ràng (Normal hoặc Anomaly), bỏ Unknown
  const labeled = sequences.filter(s => s.label === 'Normal' || s.label === 'Anomaly');
  console.log(`\n[Vectorizer] Sequences có nhãn: ${labeled.length} (bỏ Unknown: ${sequences.length - labeled.length})`);

  if (labeled.length < 10) {
    console.error('[Vectorizer] Không đủ dữ liệu có nhãn để vectorize (cần ít nhất 10).');
    process.exit(1);
  }

  // Bước 2: Drain Vectorize — chuyển mỗi sequence thành Event Count Vector
  console.log('[Vectorizer] Đang fit Drain và vectorize sequences...');
  const { X, y, templates } = vectorizeDataset(labeled, { simThreshold: 0.4, maxChildren: 100 });

  const anomalyCount = y.filter(v => v === 1).length;
  const normalCount  = y.filter(v => v === 0).length;

  console.log(`[Vectorizer] Hoàn thành:`);
  console.log(`  → Tổng sequences : ${X.length}`);
  console.log(`  → Anomaly        : ${anomalyCount}`);
  console.log(`  → Normal         : ${normalCount}`);
  console.log(`  → Số templates   : ${templates.length}`);
  console.log(`  → Chiều vector   : ${X[0]?.length ?? 0}`);

  // Bước 3: Xuất ra JSON
  const output = {
    dataset: 'hdfs',
    total_sequences: X.length,
    anomaly_count: anomalyCount,
    normal_count: normalCount,
    template_count: templates.length,
    vector_dim: X[0]?.length ?? 0,
    templates: templates.map(t => ({ id: t.cluster_id, template: t.template, count: t.log_count })),
    X,
    y
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n✅ Đã lưu: ${OUT_FILE}`);
  console.log('   → Chạy tiếp: python anomaly-engine/ml-models/train_and_evaluate.py --input datasets/hdfs/vectors_hdfs.json --output anomaly-engine/ml-models/results_hdfs.json --save-model');
}

main().catch(err => {
  console.error('[generate_vectors HDFS] Lỗi:', err.message);
  process.exit(1);
});
