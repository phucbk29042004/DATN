# Graph Report - DATN  (2026-11-28)

## Corpus Check
- 92 files · ~85,681 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .pkl 4, (none) 3, .example 2)

## Summary
- 606 nodes · 1316 edges · 27 communities (25 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `63fdfcb4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useTheme
- BE/package.json
- DrainParser
- ml_api.py
- App.jsx
- Mobile/package.json
- FE/package.json
- parser/index.js
- search-api/index.js
- scripts
- authService.js
- expo
- bgl/generate_vectors.js
- sqlite.js
- opensearch.js
- opensearchQueries.js
- cronService.js
- alertService.js
- anomaly-engine/index.js
- parser/index.js
- bgl/generate_vectors.js
- hdfs/generate_vectors.js
- full_evaluation.js
- vercel.json
- parseLog
- statistical/detector.js

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 37 edges
2. `apiClient()` - 21 edges
3. `react-native` - 21 edges
4. `App()` - 20 edges
5. `useAuth()` - 19 edges
6. `lucide-react-native` - 17 edges
7. `scripts` - 17 edges
8. `react-native-safe-area-context` - 16 edges
9. `lucide-react` - 14 edges
10. `useToast()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `setMaintenanceMode()` --calls--> `ghiNhatKyHeThong()`  [EXTRACTED]
  BE/search-api/alertService.js → BE/database/sqlite.js
- `broadcastNewLog()` --calls--> `dispatchAlerts()`  [EXTRACTED]
  BE/search-api/index.js → BE/search-api/alertService.js
- `App()` --calls--> `CronJobsModal()`  [EXTRACTED]
  FE/src/App.jsx → FE/src/components/CronJobsModal.jsx
- `App()` --calls--> `CustomDateTimePicker()`  [EXTRACTED]
  FE/src/App.jsx → FE/src/components/CustomDateTimePicker.jsx
- `App()` --calls--> `PasswordChangeModal()`  [EXTRACTED]
  FE/src/App.jsx → FE/src/components/PasswordChangeModal.jsx

## Import Cycles
- None detected.

## Communities (27 total, 2 thin omitted)

### Community 0 - "useTheme"
Cohesion: 0.07
Nodes (74): App(), MainApp(), apiClient(), getAuthToken(), setAuthToken(), CURRENT_LAN_IP, DEFAULT_API_BASE, DEFAULT_COLLECTOR_BASE (+66 more)

### Community 1 - "BE/package.json"
Cohesion: 0.10
Nodes (28): dependencies, bcryptjs@^3.0.3, better-sqlite3@^13.2.0, bullmq@^5.1.0, cors@^2.8.5, express@^4.19.2, ioredis@^5.3.2, jsonwebtoken@^9.0.3 (+20 more)

### Community 2 - "DrainParser"
Cohesion: 0.19
Nodes (9): DrainParser, LogCluster, mergeTemplates(), similarity(), tokenize(), fitDrain(), calculatePercentiles(), generateMockLogs() (+1 more)

### Community 3 - "ml_api.py"
Cohesion: 0.07
Nodes (12): health(), lifespan(), _load_models(), predict(), PredictRequest, PredictResponse, reload_model(), _build_report() (+4 more)

### Community 4 - "App.jsx"
Cohesion: 0.08
Nodes (36): App(), formatVnDateTime(), KpiSkeleton(), LEVEL_COLORS, Skeleton(), ToastContainer(), toLocalDatetimeInputString(), useToast() (+28 more)

### Community 5 - "Mobile/package.json"
Cohesion: 0.07
Nodes (39): dependencies, expo@^58.0.25, expo-image-picker@^58.0.10, expo-status-bar@~58.0.5, lucide-react-native@^1.73.0, react@19.3.0, react-native@0.88.1, @react-native-async-storage/async-storage@2.2.0 (+31 more)

### Community 6 - "FE/package.json"
Cohesion: 0.09
Nodes (29): dependencies, lucide-react@^0.380.0, react@^18.3.1, react-dom@^18.3.1, recharts@^2.12.7, socket.io-client@^4.8.3, xlsx@^0.18.5, devDependencies (+21 more)

### Community 7 - "parser/index.js"
Cohesion: 0.08
Nodes (18): app, VALID_LEVELS, LOG_QUEUE_NAME, rawLogsQueue, REALTIME_LOG_CHANNEL, REDIS_HOST, REDIS_PORT, REDIS_URL (+10 more)

### Community 8 - "search-api/index.js"
Cohesion: 0.11
Nodes (20): aiLimiter, allowedOrigins, app, authLimiter, broadcastNewLog(), corsOptions, currentFile, __dirname (+12 more)

### Community 9 - "scripts"
Cohesion: 0.12
Nodes (17): scripts, benchmark, benchmark:full, generate:logs, generate:vectors-bgl, generate:vectors-hdfs, ml:train-bgl, ml:train-hdfs (+9 more)

### Community 10 - "authService.js"
Cohesion: 0.19
Nodes (14): db, ghiNhatKyHeThong(), authenticateToken(), changePassword(), JWT_SECRET, loginUser(), optionalAuth(), requireAdmin() (+6 more)

### Community 11 - "expo"
Cohesion: 0.13
Nodes (14): backgroundColor, adaptiveIcon, expo, android, ios, name, orientation, slug (+6 more)

### Community 12 - "bgl/generate_vectors.js"
Cohesion: 0.07
Nodes (31): bglPath, __dirname, hdfsPath, outputPath, parseBglLine(), parseHdfsLine(), run(), __dirname (+23 more)

### Community 13 - "sqlite.js"
Cohesion: 0.20
Nodes (9): DATA_DIR, dbDir, __dirname, __filename, initDatabase(), layDanhSachTinNhanNoiBo(), luuTinNhanNoiBo(), migrateOldIncidentsFile() (+1 more)

### Community 14 - "opensearch.js"
Cohesion: 0.39
Nodes (7): luuLogDuPhong(), dotenv@^16.4.5, bulkIndexLogs(), getDailyIndexName(), indexLogDocument(), opensearchClient, dotenv

### Community 15 - "opensearchQueries.js"
Cohesion: 0.19
Nodes (17): __dirname, extractDrainTemplate(), fallbackAnomalyAnalytics(), fallbackDrainTemplates(), fallbackKpiStats(), fallbackLogStats(), fallbackRecentAnomalies(), fallbackSearchLogs() (+9 more)

### Community 17 - "cronService.js"
Cohesion: 0.35
Nodes (10): ghiLichSuCron(), cronConfig, generate24hDigestData(), initCronJobs(), reloadCronJobs(), runLogRetentionCleanup(), sendDailyDigestReport(), sendDiscordDigest() (+2 more)

### Community 18 - "alertService.js"
Cohesion: 0.29
Nodes (10): alertConfig, alertDeduplicationMap, checkDeduplication(), dispatchAlerts(), getMaintenanceMode(), loadConfigFromSqlite(), saveConfigToSqlite(), sendDiscordAlert() (+2 more)

### Community 19 - "anomaly-engine/index.js"
Cohesion: 0.20
Nodes (13): callMlPredict(), __dirname, DRAIN_WORKER_PATH, exportVectorsForML(), __filename, FROZEN_VOCAB_PATH, loadFrozenVocab(), ML_API_TIMEOUT_MS (+5 more)

### Community 20 - "parser/index.js"
Cohesion: 0.26
Nodes (11): ALERT_LEVELS, cachedDynamicKeywords, checkLogLineSingle(), CRITICAL_KEYWORDS, detectRuleBased(), getEffectiveKeywords(), refreshDynamicKeywords(), addToBuffer() (+3 more)

### Community 21 - "bgl/generate_vectors.js"
Cohesion: 0.23
Nodes (8): buildBglTimeWindows(), loadBglDataset(), parseBglLogFile(), __dirname, LOG_FILE, main(), OUT_FILE, VOCAB_OUT_FILE

### Community 22 - "hdfs/generate_vectors.js"
Cohesion: 0.26
Nodes (9): __dirname, LABEL_FILE, LOG_FILE, main(), OUT_FILE, buildHdfsSequences(), loadHdfsDataset(), loadHdfsLabels() (+1 more)

### Community 23 - "full_evaluation.js"
Cohesion: 0.24
Nodes (10): BGL_LOG, calculateMetrics(), calculatePercentiles(), __dirname, generateMockLogs(), HDFS_LABEL, HDFS_LOG, RESULTS_BGL (+2 more)

### Community 25 - "parseLog"
Cohesion: 0.50
Nodes (6): generateLogHashId(), parseJsonLog(), parseLog(), parseNginxLog(), parseSyslog(), RFC-3164

### Community 26 - "statistical/detector.js"
Cohesion: 0.62
Nodes (6): buildTimeSeries(), detectMovingAverage(), detectStatistical(), detectZScore(), mean(), stdDev()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-3164`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 202 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dotenv` connect `opensearch.js` to `BE/package.json`, `parser/index.js`, `search-api/index.js`, `authService.js`, `bgl/generate_vectors.js`, `cronService.js`, `alertService.js`, `anomaly-engine/index.js`, `parser/index.js`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `RFC-3164` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.06833457804331591 - nodes in this community are weakly interconnected._
- **Why does `scripts` connect `scripts` to `BE/package.json`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Should `BE/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0960591133004926 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `App.jsx` to `FE/package.json`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `ml_api.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07419712070874862 - nodes in this community are weakly interconnected._