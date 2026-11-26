import express from 'express';
import dotenv from 'dotenv';
import { rawLogsQueue } from '../queue/config.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 4000;

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'collector' });
});

const VALID_LEVELS = new Set(['INFO', 'WARN', 'WARNING', 'ERROR', 'FATAL', 'CRITICAL', 'DEBUG']);

function validateLogPayload(logData) {
  if (!logData || typeof logData !== 'object' || Array.isArray(logData)) {
    return 'Payload log phải là JSON object hợp lệ';
  }
  const hasService = Boolean((logData.service || logData.service_name || '').toString().trim());
  const hasMessage = Boolean((logData.message || logData.msg || '').toString().trim());
  const hasTimestamp = Boolean((logData.timestamp || '').toString().trim());
  const levelStr = (logData.level || '').toString().trim().toUpperCase();

  if (!hasTimestamp || !hasService || !levelStr || !hasMessage) {
    return 'Thiếu trường bắt buộc: timestamp, service, level, message';
  }
  if (!VALID_LEVELS.has(levelStr)) {
    return `Mức độ log (level) không hợp lệ: ${levelStr}`;
  }
  return null;
}

// Single log ingestion endpoint
app.post('/api/v1/logs', async (req, res) => {
  try {
    const logData = req.body;
    const validationError = validateLogPayload(logData);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const job = await rawLogsQueue.add('single-log', {
      receivedAt: new Date().toISOString(),
      payload: logData
    });

    return res.status(202).json({
      success: true,
      message: 'Log đã được tiếp nhận vào hàng đợi',
      jobId: job.id
    });
  } catch (error) {
    console.error('[Collector Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi tiếp nhận log' });
  }
});

// Batch log ingestion endpoint (dành cho tải cao / agent gửi theo lô)
app.post('/api/v1/logs/batch', async (req, res) => {
  try {
    const { logs } = req.body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ error: 'Danh sách log (logs) phải là một mảng và không rỗng' });
    }

    for (let i = 0; i < logs.length; i++) {
      const errMsg = validateLogPayload(logs[i]);
      if (errMsg) {
        return res.status(400).json({ error: `Log thứ ${i + 1} không hợp lệ: ${errMsg}` });
      }
    }

    const jobs = logs.map((logItem, index) => ({
      name: `batch-log-${index}`,
      data: {
        receivedAt: new Date().toISOString(),
        payload: logItem
      }
    }));

    await rawLogsQueue.addBulk(jobs);

    return res.status(202).json({
      success: true,
      message: `Đã tiếp nhận ${logs.length} logs vào hàng đợi BullMQ`
    });
  } catch (error) {
    console.error('[Collector Batch Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi tiếp nhận lô log' });
  }
});

const isMainModule =
  !process.argv[1] ||
  process.argv[1].toLowerCase().endsWith('collector\\index.js') ||
  process.argv[1].toLowerCase().endsWith('collector/index.js');

if (isMainModule) {
  app.listen(PORT, () => {
    console.log(`[Collector Service] Đang chạy tại http://localhost:${PORT}`);
  });
}

export { app, validateLogPayload };
