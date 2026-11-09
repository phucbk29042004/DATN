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

// Single log ingestion endpoint
app.post('/api/v1/logs', async (req, res) => {
  try {
    const logData = req.body;
    
    if (!logData || Object.keys(logData).length === 0) {
      return res.status(400).json({ error: 'Payload log không được rỗng' });
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

app.listen(PORT, () => {
  console.log(`[Collector Service] Đang chạy tại http://localhost:${PORT}`);
});
