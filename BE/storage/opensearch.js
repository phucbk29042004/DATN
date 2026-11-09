import { Client } from '@opensearch-project/opensearch';
import dotenv from 'dotenv';

dotenv.config();

const OPENSEARCH_NODE = process.env.OPENSEARCH_NODE || 'http://localhost:9200';

export const opensearchClient = new Client({
  node: OPENSEARCH_NODE,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Tạo tên index theo thời gian dạng: logs-yyyy.mm.dd
 */
export function getDailyIndexName(timestamp) {
  const dateObj = new Date(timestamp || Date.now());
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getUTCDate()).padStart(2, '0');
  return `logs-${year}.${month}.${day}`;
}

/**
 * Ghi 1 document log vào OpenSearch với Idempotent Document ID
 */
export async function indexLogDocument(normalizedLog) {
  const indexName = getDailyIndexName(normalizedLog.timestamp);

  try {
    const response = await opensearchClient.index({
      index: indexName,
      id: normalizedLog.hash_id, // Idempotent write: hash ID làm doc ID
      body: normalizedLog,
      refresh: true
    });
    return response;
  } catch (error) {
    // Nếu OpenSearch chưa bật hoặc không kết nối được, fallback log console để dev không bị ngắt quãng
    console.warn(`[OpenSearch Storage Warning] Không thể kết nối tới OpenSearch (${OPENSEARCH_NODE}): ${error.message}`);
    console.log(`[Storage Fallback Log Record]:`, JSON.stringify(normalizedLog));
    return { fallback: true };
  }
}

/**
 * Ghi nhiều document log vào OpenSearch bằng Bulk API (tăng throughput đáng kể).
 * Mỗi document vẫn dùng hash_id làm Document ID để đảm bảo Idempotency.
 *
 * @param {Array<Object>} normalizedLogs - Mảng log đã chuẩn hóa (Standard Schema)
 * @returns {Promise<{ indexed: number, errors: number, fallback: boolean }>}
 */
export async function bulkIndexLogs(normalizedLogs) {
  if (!normalizedLogs || normalizedLogs.length === 0) {
    return { indexed: 0, errors: 0, fallback: false };
  }

  // Xây dựng mảng body theo cú pháp Bulk API:
  // [{ index: { _index, _id } }, { document }, ...]
  const body = normalizedLogs.flatMap(log => [
    { index: { _index: getDailyIndexName(log.timestamp), _id: log.hash_id } },
    log
  ]);

  try {
    const response = await opensearchClient.bulk({ body, refresh: true });
    const items = response.body?.items || [];
    const errors = items.filter(item => item.index?.error).length;
    const indexed = items.length - errors;

    if (errors > 0) {
      console.warn(`[OpenSearch Bulk] ${errors}/${items.length} documents ghi lỗi.`);
    }

    return { indexed, errors, fallback: false };
  } catch (error) {
    console.warn(`[OpenSearch Bulk Warning] Không thể ghi lô vào OpenSearch: ${error.message}`);
    // Fallback: ghi từng cái một
    let indexed = 0;
    for (const log of normalizedLogs) {
      const res = await indexLogDocument(log);
      if (!res?.fallback) indexed++;
    }
    return { indexed, errors: normalizedLogs.length - indexed, fallback: true };
  }
}

