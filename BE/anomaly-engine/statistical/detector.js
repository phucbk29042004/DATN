/**
 * Anomaly Detection — Tầng 2: Statistical Detector
 * =================================================
 * Phát hiện bất thường dựa trên hai phương pháp thống kê:
 *  1. Z-Score: Đo mức độ sai lệch của một điểm dữ liệu so với trung bình lịch sử
 *  2. Moving Average: Phát hiện đột biến so với xu hướng trung bình động
 *
 * Đơn vị đầu vào: Chuỗi thời gian (time series) số lượng log theo từng phút/window
 */

/**
 * Tính trung bình (Mean) của một mảng số
 */
function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

/**
 * Tính độ lệch chuẩn mẫu (Sample Standard Deviation)
 */
function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

/**
 * Chuyển danh sách log đã chuẩn hóa thành chuỗi thời gian (time series)
 * bằng cách đếm số log theo từng time bucket.
 *
 * @param {Array<Object>} logs       - Danh sách log đã chuẩn hóa
 * @param {number} bucketMs          - Kích thước time bucket (ms), mặc định 60000 (1 phút)
 * @param {string|null} filterLevel  - Chỉ đếm log của level này (null = đếm tất cả)
 * @returns {Array<{timestamp: string, count: number}>}
 */
export function buildTimeSeries(logs, bucketMs = 60_000, filterLevel = null) {
  if (logs.length === 0) return [];

  const filteredLogs = filterLevel
    ? logs.filter(l => l.level === filterLevel.toUpperCase())
    : logs;

  if (filteredLogs.length === 0) return [];

  // Sắp xếp theo thời gian
  const sorted = [...filteredLogs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const firstTs = new Date(sorted[0].timestamp).getTime();
  const bucketMap = new Map();

  for (const log of sorted) {
    const ts = new Date(log.timestamp).getTime();
    const bucketKey = Math.floor((ts - firstTs) / bucketMs);
    bucketMap.set(bucketKey, (bucketMap.get(bucketKey) || 0) + 1);
  }

  // Điền 0 cho các bucket trống giữa chừng
  const maxBucket = Math.max(...bucketMap.keys());
  const series = [];
  for (let i = 0; i <= maxBucket; i++) {
    series.push({
      timestamp: new Date(firstTs + i * bucketMs).toISOString(),
      count: bucketMap.get(i) || 0
    });
  }

  return series;
}

/**
 * Phát hiện bất thường bằng Z-Score
 * Điểm cuối cùng trong chuỗi thời gian được so sánh với lịch sử trước đó.
 *
 * @param {Array<{timestamp, count}>} series  - Chuỗi thời gian từ buildTimeSeries
 * @param {number} threshold                  - Ngưỡng Z-Score (mặc định 2.5: 2.5 độ lệch chuẩn)
 * @param {number} minHistoryLength           - Số bucket tối thiểu cần có lịch sử (mặc định 5)
 * @returns {Array<Object>} Danh sách các điểm bất thường trong chuỗi
 */
export function detectZScore(series, threshold = 2.5, minHistoryLength = 5) {
  const anomalies = [];
  const counts = series.map(p => p.count);

  for (let i = minHistoryLength; i < counts.length; i++) {
    const historyCounts = counts.slice(0, i);
    const mu = mean(historyCounts);
    const sigma = stdDev(historyCounts);
    const current = counts[i];

    // Tránh chia cho 0 khi sigma = 0 (toàn bộ lịch sử đều bằng nhau)
    const zScore = sigma > 0 ? Math.abs((current - mu) / sigma) : 0;

    if (zScore >= threshold) {
      anomalies.push({
        timestamp: series[i].timestamp,
        count: current,
        mean: parseFloat(mu.toFixed(2)),
        std_dev: parseFloat(sigma.toFixed(2)),
        z_score: parseFloat(zScore.toFixed(3)),
        threshold,
        is_anomaly: true
      });
    }
  }

  return anomalies;
}

/**
 * Phát hiện bất thường bằng Moving Average (Simple Moving Average)
 * So sánh giá trị hiện tại với trung bình động của N bucket trước.
 *
 * @param {Array<{timestamp, count}>} series  - Chuỗi thời gian
 * @param {number} windowSize                 - Số bucket tính trung bình động (mặc định 5)
 * @param {number} multiplier                 - Bội số sai lệch để coi là bất thường (mặc định 2.0)
 * @returns {Array<Object>} Danh sách các điểm bất thường
 */
export function detectMovingAverage(series, windowSize = 5, multiplier = 2.0) {
  const anomalies = [];
  const counts = series.map(p => p.count);

  for (let i = windowSize; i < counts.length; i++) {
    const window = counts.slice(i - windowSize, i);
    const ma = mean(window);
    const current = counts[i];

    // Bất thường khi giá trị hiện tại vượt quá (ma * multiplier) hoặc âm so với ma
    const upperBound = ma * multiplier;
    if (current > upperBound && ma > 0) {
      anomalies.push({
        timestamp: series[i].timestamp,
        count: current,
        moving_avg: parseFloat(ma.toFixed(2)),
        upper_bound: parseFloat(upperBound.toFixed(2)),
        ratio: parseFloat((current / ma).toFixed(2)),
        multiplier,
        is_anomaly: true
      });
    }
  }

  return anomalies;
}

/**
 * Wrapper chạy cả Z-Score lẫn Moving Average trên một danh sách log,
 * trả về kết quả thống nhất.
 *
 * @param {Array<Object>} logs - Danh sách log đã chuẩn hóa
 * @param {Object} options
 * @param {number} options.bucketMs          - Kích thước time bucket (ms)
 * @param {string|null} options.filterLevel  - Level cần theo dõi (null = tất cả)
 * @param {number} options.zThreshold        - Ngưỡng Z-Score
 * @param {number} options.maWindow          - Kích thước cửa sổ Moving Average
 * @param {number} options.maMultiplier      - Bội số ngưỡng Moving Average
 */
export function detectStatistical(logs, {
  bucketMs = 60_000,
  filterLevel = 'ERROR',
  zThreshold = 2.5,
  maWindow = 5,
  maMultiplier = 2.0
} = {}) {
  const series = buildTimeSeries(logs, bucketMs, filterLevel);

  if (series.length < 6) {
    return {
      method: 'statistical',
      is_anomaly: false,
      note: 'Không đủ dữ liệu lịch sử để phân tích thống kê (cần ít nhất 6 time buckets)',
      z_score_anomalies: [],
      moving_avg_anomalies: [],
      series
    };
  }

  const zAnomalies = detectZScore(series, zThreshold);
  const maAnomalies = detectMovingAverage(series, maWindow, maMultiplier);

  return {
    method: 'statistical',
    is_anomaly: zAnomalies.length > 0 || maAnomalies.length > 0,
    z_score_anomalies: zAnomalies,
    moving_avg_anomalies: maAnomalies,
    series
  };
}
