/**
 * Feature Vectorizer — Template Event Count Vector
 * =================================================
 * Sau khi Drain đã trích xuất các log templates, Vectorizer
 * chuyển mỗi log sequence (block_id hoặc time window) thành
 * một vector số đặc trưng để đưa vào mô hình ML.
 *
 * Phương pháp: Event Count Vector
 *   Với N templates, mỗi sequence được biểu diễn thành vector [c1, c2, ..., cN]
 *   trong đó ci = số lần template_i xuất hiện trong sequence đó.
 */

import { DrainParser } from './drain.js';

/**
 * Bước 1: Fit DrainParser trên toàn bộ tập log để học tập tất cả templates
 *
 * @param {Array<string[]|Object[]>} allSequences  - Danh sách sequences, mỗi sequence là mảng log/message
 * @param {Object} drainOptions                    - Tham số cho DrainParser
 * @returns {{ parser: DrainParser, templates: Array }}
 */
export function fitDrain(allSequences, drainOptions = {}) {
  const parser = new DrainParser(drainOptions);

  for (const sequence of allSequences) {
    for (const log of sequence) {
      const message = typeof log === 'string' ? log : (log.message || log.content || '');
      parser.parseMessage(message);
    }
  }

  return {
    parser,
    templates: parser.getTemplates()
  };
}

/**
 * Bước 2: Chuyển đổi một sequence thành Event Count Vector
 *
 * @param {Array<string|Object>} sequence - Mảng log/message trong một sequence
 * @param {DrainParser} parser            - Parser đã được fit
 * @param {number[]} templateIds          - Danh sách template_id (đã sắp xếp) — định nghĩa thứ tự vector
 * @returns {number[]} Vector tần suất xuất hiện của mỗi template
 */
export function sequenceToVector(sequence, parser, templateIds) {
  // Khởi tạo vector 0
  const countMap = new Map(templateIds.map(id => [id, 0]));

  for (const log of sequence) {
    const message = typeof log === 'string' ? log : (log.message || log.content || '');
    const cluster = parser.parseMessage(message);
    if (countMap.has(cluster.cluster_id)) {
      countMap.set(cluster.cluster_id, countMap.get(cluster.cluster_id) + 1);
    }
  }

  // Trả về mảng theo thứ tự templateIds
  return templateIds.map(id => countMap.get(id) || 0);
}

/**
 * Hàm tiện ích: Vectorize toàn bộ danh sách sequences (dùng cho ML training)
 *
 * @param {Array<{ log_lines: Array, label?: string, is_anomaly?: boolean }>} sequences
 * @param {Object} drainOptions
 * @returns {{
 *   X: number[][]       - Ma trận đặc trưng (mỗi hàng là 1 vector sequence)
 *   y: number[]         - Mảng nhãn (1 = Anomaly, 0 = Normal)
 *   templateIds: number[]
 *   templates: Array
 *   parser: DrainParser
 * }}
 */
export function vectorizeDataset(sequences, drainOptions = {}) {
  // Lấy log_lines hoặc dùng bản thân sequence làm danh sách log
  const allLogGroups = sequences.map(s => s.log_lines || s);

  // Fit Drain trên toàn bộ tập
  const { parser, templates } = fitDrain(allLogGroups, drainOptions);
  const templateIds = templates.map(t => t.cluster_id).sort((a, b) => a - b);

  // Vectorize từng sequence
  const X = allLogGroups.map(logGroup => sequenceToVector(logGroup, parser, templateIds));
  const y = sequences.map(s => (s.is_anomaly === true ? 1 : 0));

  return { X, y, templateIds, templates, parser };
}

/**
 * Vectorize batch log realtime theo từ điển template cố định (frozen vocabulary)
 * giúp giữ đúng số chiều vector với StandardScaler / mô hình sklearn đã huấn luyện.
 *
 * @param {Array<string|Object>} logs
 * @param {Array<{ id?: number, template: string }>} vocabTemplates
 * @param {Object} drainOptions
 * @returns {{ vector: number[], unknownCount: number, matchedTemplates: Array }}
 */
export function vectorizeWithFrozenVocab(logs, vocabTemplates = [], drainOptions = {}) {
  const vector = new Array(vocabTemplates.length).fill(0);
  if (!Array.isArray(logs) || logs.length === 0 || vocabTemplates.length === 0) {
    return { vector, unknownCount: 0, matchedTemplates: [] };
  }

  const templateIndexMap = new Map();
  vocabTemplates.forEach((item, idx) => {
    const tpl = typeof item === 'string' ? item : item.template;
    if (tpl) templateIndexMap.set(tpl, idx);
  });

  const parser = new DrainParser(drainOptions);
  for (const item of vocabTemplates) {
    const tpl = typeof item === 'string' ? item : item.template;
    if (tpl) parser.parseMessage(tpl);
  }

  let unknownCount = 0;
  const matchedSet = new Set();

  for (const log of logs) {
    const message = typeof log === 'string' ? log : (log.message || log.content || '');
    const cluster = parser.parseMessage(message);
    const tplStr = cluster.template_str || (Array.isArray(cluster.template) ? cluster.template.join(' ') : cluster.template);
    const matchedIdx = templateIndexMap.get(tplStr);
    if (matchedIdx !== undefined) {
      vector[matchedIdx] += 1;
      matchedSet.add(tplStr);
    } else {
      unknownCount += 1;
    }
  }

  return {
    vector,
    unknownCount,
    matchedTemplates: Array.from(matchedSet)
  };
}
