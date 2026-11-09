/**
 * Benchmark Script — Pipeline Ingestion & Anomaly Detection Latency Test
 * =====================================================================
 * Kịch bản đo đạc hiệu năng hệ thống:
 *   1. Measuring Log Normalizer & Parser Latency (dòng/giây & microsecond/log)
 *   2. Measuring Drain Mining Latency & Template Matching Speed
 *   3. Measuring Rule-based & Statistical Detector Execution Latency
 *   4. Benchmark Summary (Throughput & Latency percentiles: p50, p90, p99)
 */

import { performance } from 'perf_hooks';
import { parseLog } from '../parser/normalizer.js';
import { DrainParser } from '../anomaly-engine/template-mining/drain.js';
import { checkLogLineSingle } from '../anomaly-engine/rule-based/detector.js';

// Sinh mock raw logs cho Benchmark
function generateMockLogs(count) {
  const services = ['auth-service', 'payment-api', 'order-worker', 'inventory-db', 'gateway'];
  const levels = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR', 'FATAL'];
  const messages = [
    'User logged in successfully from IP 192.168.1.50',
    'Database connection failed: Timeout connecting to PostgreSQL master at 10.0.4.12:5432',
    'Payment order #ORD-99120 processed in 45ms',
    'Out of memory exception during ElasticSearch query execution window',
    'High CPU utilization detected on node-worker-03 (88.4%)',
    'Invalid authentication token provided for user admin'
  ];

  const logs = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const service = services[i % services.length];
    const level = levels[i % levels.length];
    const msg = messages[i % messages.length];
    const timeStr = new Date(now - i * 1000).toISOString();

    // Đủ 3 định dạng: JSON, Syslog, Standard Log Format
    if (i % 3 === 0) {
      logs.push(JSON.stringify({ timestamp: timeStr, service, level, message: msg, trace_id: `tr_${i}` }));
    } else if (i % 3 === 1) {
      logs.push(`<34>1 ${timeStr} host-01 ${service} 1234 - - ${level}: ${msg}`);
    } else {
      logs.push(`${timeStr} [${level}] [${service}] ${msg}`);
    }
  }
  return logs;
}

function calculatePercentiles(latencies) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.50)];
  const p90 = sorted[Math.floor(sorted.length * 0.90)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const avg = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
  return { avg: avg.toFixed(3), p50: p50.toFixed(3), p90: p90.toFixed(3), p99: p99.toFixed(3) };
}

async function runBenchmark() {
  const NUM_LOGS = 10000;
  console.log(`=======================================================`);
  console.log(`BẮT ĐẦU BENCHMARK HỆ THỐNG GIAI ĐOẠN 5 (${NUM_LOGS.toLocaleString()} LOGS)`);
  console.log(`=======================================================\n`);

  const rawLogs = generateMockLogs(NUM_LOGS);

  // 1. Benchmark Log Parser & Normalizer
  console.log(`[1/3] Benchmarking Log Normalizer & Regex Parser...`);
  const parseLatencies = [];
  const parsedLogs = [];

  const startParse = performance.now();
  for (let i = 0; i < NUM_LOGS; i++) {
    const t0 = performance.now();
    const parsed = parseLog(rawLogs[i]);
    const t1 = performance.now();
    parseLatencies.push(t1 - t0);
    parsedLogs.push(parsed);
  }
  const totalParseTimeMs = performance.now() - startParse;
  const parseThroughput = Math.round((NUM_LOGS / totalParseTimeMs) * 1000);
  const parseStats = calculatePercentiles(parseLatencies);

  console.log(`   ✅ Ingestion Throughput: ${parseThroughput.toLocaleString()} logs/sec`);
  console.log(`   ⏱️ Latency per log: Avg=${parseStats.avg}ms, p50=${parseStats.p50}ms, p90=${parseStats.p90}ms, p99=${parseStats.p99}ms\n`);

  // 2. Benchmark Drain Log Template Mining
  console.log(`[2/3] Benchmarking Drain Mining (Fixed Depth Tree)...`);
  const drain = new DrainParser({ simThreshold: 0.5, maxChildren: 100 });
  const drainLatencies = [];

  const startDrain = performance.now();
  for (let i = 0; i < NUM_LOGS; i++) {
    const t0 = performance.now();
    drain.parseMessage(parsedLogs[i]?.message || '');
    const t1 = performance.now();
    drainLatencies.push(t1 - t0);
  }
  const totalDrainTimeMs = performance.now() - startDrain;
  const drainThroughput = Math.round((NUM_LOGS / totalDrainTimeMs) * 1000);
  const drainStats = calculatePercentiles(drainLatencies);

  console.log(`   ✅ Drain Throughput: ${drainThroughput.toLocaleString()} logs/sec`);
  console.log(`   ⏱️ Drain Latency: Avg=${drainStats.avg}ms, p50=${drainStats.p50}ms, p90=${drainStats.p90}ms, p99=${drainStats.p99}ms`);
  console.log(`   📊 Discovered Templates Count: ${drain.clusters.length}\n`);

  // 3. Benchmark Rule-Based Anomaly Detection Engine
  console.log(`[3/3] Benchmarking Rule-Based Anomaly Detector...`);
  const ruleLatencies = [];

  const startRule = performance.now();
  for (let i = 0; i < NUM_LOGS; i++) {
    const t0 = performance.now();
    checkLogLineSingle(parsedLogs[i] || {});
    const t1 = performance.now();
    ruleLatencies.push(t1 - t0);
  }
  const totalRuleTimeMs = performance.now() - startRule;
  const ruleThroughput = Math.round((NUM_LOGS / totalRuleTimeMs) * 1000);
  const ruleStats = calculatePercentiles(ruleLatencies);

  console.log(`   Rule Engine Throughput: ${ruleThroughput.toLocaleString()} logs/sec`);
  console.log(`   ⏱Rule Engine Latency: Avg=${ruleStats.avg}ms, p50=${ruleStats.p50}ms, p90=${ruleStats.p90}ms, p99=${ruleStats.p99}ms\n`);

  // Summary Report
  console.log(`=======================================================`);
  console.log(`🏆 TỔNG KẾT BENCHMARK PIPELINE THROUGHPUT & LATENCY`);
  console.log(`=======================================================`);
  console.table({
    'Log Parser & Normalizer': { 'Throughput (logs/s)': parseThroughput.toLocaleString(), 'Avg Latency (ms)': parseStats.avg, 'p99 Latency (ms)': parseStats.p99 },
    'Drain Template Miner': { 'Throughput (logs/s)': drainThroughput.toLocaleString(), 'Avg Latency (ms)': drainStats.avg, 'p99 Latency (ms)': drainStats.p99 },
    'Rule-Based Anomaly Engine': { 'Throughput (logs/s)': ruleThroughput.toLocaleString(), 'Avg Latency (ms)': ruleStats.avg, 'p99 Latency (ms)': ruleStats.p99 },
  });
}

runBenchmark().catch(console.error);
