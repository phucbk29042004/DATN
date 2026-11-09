/**
 * Thuật toán Drain — Log Template Mining
 * ========================================
 * Tham khảo: He et al., "Drain: An Online Log Parsing Approach with Fixed Depth Tree",
 *            ICWS 2017, https://doi.org/10.1109/ICWS.2017.13
 *
 * Drain phân tích các dòng log thô và rút gọn chúng thành các "log template" (event template)
 * bằng cách duy trì một cây tìm kiếm có chiều sâu cố định (Fixed Depth Parse Tree).
 *
 * Ví dụ:
 *   "Receiving block blk_123 from /10.10.1.1"
 *   "Receiving block blk_456 from /10.10.1.2"
 *   → Template: "Receiving block <*> from <*>"
 */

const WILDCARD = '<*>';

/**
 * Pre-process: Tách một dòng log thành mảng tokens.
 * Thay thế các pattern số/IP/path bằng wildcard để tăng khả năng gom nhóm.
 * @param {string} message
 * @returns {string[]}
 */
function tokenize(message) {
  return message
    .split(/\s+/)
    .map(token => {
      // Thay số, địa chỉ IP, hexadecimal, path bằng wildcard
      if (/^\d+$/.test(token)) return WILDCARD;
      if (/^(\d+\.){3}\d+(:\d+)?$/.test(token)) return WILDCARD; // IP[:port]
      if (/^0x[0-9a-fA-F]+$/.test(token)) return WILDCARD;       // Hex
      if (/^blk_-?\d+$/.test(token)) return WILDCARD;             // HDFS block_id
      if (/^\/[^\s]+$/.test(token)) return WILDCARD;              // Path
      return token;
    });
}

/**
 * Tính độ tương đồng (similarity) giữa hai mảng tokens
 * (Tỷ lệ các token giống hệt nhau ở cùng vị trí, không tính wildcard)
 */
function similarity(tokens1, tokens2) {
  if (tokens1.length !== tokens2.length) return 0;
  let matchCount = 0;
  for (let i = 0; i < tokens1.length; i++) {
    if (tokens1[i] === tokens2[i] && tokens1[i] !== WILDCARD) {
      matchCount++;
    }
  }
  return matchCount / tokens1.length;
}

/**
 * Merge hai mảng tokens: vị trí khác nhau → thay bằng wildcard
 */
function mergeTemplates(tpl1, tpl2) {
  return tpl1.map((tok, i) => (tok === tpl2[i] ? tok : WILDCARD));
}

/**
 * Lớp LogCluster — đại diện cho một log template (nhóm log cùng cấu trúc)
 */
class LogCluster {
  constructor(template, clusterId) {
    this.cluster_id = clusterId;
    this.template = template;       // Mảng tokens (có thể chứa <*>)
    this.log_count = 1;
    this.template_str = template.join(' ');
  }

  updateTemplate(tokens) {
    const merged = mergeTemplates(this.template, tokens);
    this.template = merged;
    this.template_str = merged.join(' ');
    this.log_count++;
  }
}

/**
 * Lớp DrainParser — cây phân tích Drain
 *
 * @param {Object} options
 * @param {number} options.simThreshold   - Ngưỡng similarity để ghép vào cluster (mặc định 0.4)
 * @param {number} options.maxChildren    - Số cluster tối đa mỗi nhánh (mặc định 100)
 * @param {number} options.depth          - Độ sâu cây (mặc định 4: length_layer → first_tokens → cluster)
 */
export class DrainParser {
  constructor({ simThreshold = 0.4, maxChildren = 100 } = {}) {
    this.simThreshold = simThreshold;
    this.maxChildren = maxChildren;
    // prefix_tree: Map<length, Map<firstToken, LogCluster[]>>
    this.prefixTree = new Map();
    this.clusters = [];
    this._nextId = 1;
  }

  /**
   * Xử lý một dòng log message, trả về LogCluster tương ứng
   * @param {string} message - Nội dung log message
   * @returns {LogCluster}
   */
  parseMessage(message) {
    const tokens = tokenize(message);
    const length = tokens.length;
    const firstToken = tokens[0] === WILDCARD ? '<digits>' : tokens[0];

    // Tầng 1: Lookup theo độ dài message
    if (!this.prefixTree.has(length)) {
      this.prefixTree.set(length, new Map());
    }
    const lengthNode = this.prefixTree.get(length);

    // Tầng 2: Lookup theo token đầu tiên
    if (!lengthNode.has(firstToken)) {
      lengthNode.set(firstToken, []);
    }
    const candidateClusters = lengthNode.get(firstToken);

    // Tầng 3: Tìm cluster có độ similarity cao nhất
    let bestCluster = null;
    let bestSim = -1;

    for (const cluster of candidateClusters) {
      const sim = similarity(cluster.template, tokens);
      if (sim > bestSim) {
        bestSim = sim;
        bestCluster = cluster;
      }
    }

    // Nếu similarity đạt ngưỡng → update template
    if (bestCluster && bestSim >= this.simThreshold) {
      bestCluster.updateTemplate(tokens);
      return bestCluster;
    }

    // Ngược lại → tạo cluster mới (nếu còn chỗ)
    const newCluster = new LogCluster(tokens, this._nextId++);
    if (candidateClusters.length < this.maxChildren) {
      candidateClusters.push(newCluster);
    }
    this.clusters.push(newCluster);
    return newCluster;
  }

  /**
   * Xử lý hàng loạt log messages
   * @param {Array<string|Object>} logs - Mảng message string hoặc log objects (có trường .message)
   * @returns {Array<{ message, cluster_id, template_str }>}
   */
  parseLogs(logs) {
    return logs.map(log => {
      const message = typeof log === 'string' ? log : (log.message || '');
      const cluster = this.parseMessage(message);
      return {
        message,
        cluster_id: cluster.cluster_id,
        template_str: cluster.template_str
      };
    });
  }

  /**
   * Lấy danh sách tất cả log templates đã khai thác được
   */
  getTemplates() {
    return this.clusters.map(c => ({
      cluster_id: c.cluster_id,
      template: c.template_str,
      log_count: c.log_count
    }));
  }
}
