/**
 * Drain Worker Thread
 * ====================
 * File này chạy trong Worker Thread độc lập — tách biệt hoàn toàn
 * khỏi Event Loop chính của Node.js để tránh block khi tính toán Drain.
 *
 * Nhận: { sequences, drainOptions } qua parentPort.on('message')
 * Trả về: { X, y, templateIds, templates } (parser bị bỏ vì không serializable)
 */

import { workerData, parentPort } from 'worker_threads';
import { vectorizeDataset } from './template-mining/vectorizer.js';

// Chạy ngay khi thread khởi động với workerData
try {
  const { sequences, drainOptions } = workerData;
  const { X, y, templateIds, templates } = vectorizeDataset(sequences, drainOptions);
  // Gửi kết quả về thread chính (parser object bị bỏ vì không thể transfer giữa thread)
  parentPort.postMessage({ success: true, X, y, templateIds, templates });
} catch (err) {
  parentPort.postMessage({ success: false, error: err.message });
}
