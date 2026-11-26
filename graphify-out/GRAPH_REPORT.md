# Graph Report - DATN  (2026-11-26)

## Corpus Check
- 92 files · ~84,916 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .pkl 4, (none) 3, .example 2)

## Summary
- 602 nodes · 1312 edges · 21 communities (19 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ac6baa28`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useTheme
- BE/package.json
- full_evaluation.js
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
- vercel.json
- log_generator.js

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 37 edges
2. `apiClient()` - 21 edges
3. `react-native` - 21 edges
4. `App()` - 20 edges
5. `useAuth()` - 19 edges
6. `scripts` - 17 edges
7. `lucide-react-native` - 17 edges
8. `react-native-safe-area-context` - 16 edges
9. `lucide-react` - 14 edges
10. `useToast()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `flushBuffer()` --calls--> `runAnomalyDetection()`  [EXTRACTED]
  BE/parser/index.js → BE/anomaly-engine/index.js
- `exportVectorsForML()` --calls--> `vectorizeDataset()`  [EXTRACTED]
  BE/anomaly-engine/index.js → BE/anomaly-engine/template-mining/vectorizer.js
- `logParserWorker` --calls--> `checkLogLineSingle()`  [EXTRACTED]
  BE/parser/index.js → BE/anomaly-engine/rule-based/detector.js
- `main()` --calls--> `vectorizeDataset()`  [EXTRACTED]
  BE/datasets/bgl/generate_vectors.js → BE/anomaly-engine/template-mining/vectorizer.js
- `main()` --calls--> `vectorizeDataset()`  [EXTRACTED]
  BE/datasets/hdfs/generate_vectors.js → BE/anomaly-engine/template-mining/vectorizer.js

## Import Cycles
- None detected.

## Communities (21 total, 2 thin omitted)

### Community 0 - "useTheme"
Cohesion: 0.07
Nodes (74): App(), MainApp(), apiClient(), getAuthToken(), setAuthToken(), CURRENT_LAN_IP, DEFAULT_API_BASE, DEFAULT_COLLECTOR_BASE (+66 more)

### Community 1 - "BE/package.json"
Cohesion: 0.10
Nodes (28): dependencies, bcryptjs@^3.0.3, better-sqlite3@^13.2.0, bullmq@^5.1.0, cors@^2.8.5, express@^4.19.2, ioredis@^5.3.2, jsonwebtoken@^9.0.3 (+20 more)

### Community 2 - "full_evaluation.js"
Cohesion: 0.06
Nodes (50): callMlPredict(), __dirname, DRAIN_WORKER_PATH, exportVectorsForML(), __filename, FROZEN_VOCAB_PATH, loadFrozenVocab(), ML_API_TIMEOUT_MS (+42 more)

### Community 3 - "ml_api.py"
Cohesion: 0.07
Nodes (12): health(), lifespan(), _load_models(), predict(), PredictRequest, PredictResponse, reload_model(), _build_report() (+4 more)

### Community 4 - "App.jsx"
Cohesion: 0.08
Nodes (34): App(), formatVnDateTime(), KpiSkeleton(), LEVEL_COLORS, Skeleton(), ToastContainer(), toLocalDatetimeInputString(), useToast() (+26 more)

### Community 5 - "Mobile/package.json"
Cohesion: 0.07
Nodes (39): dependencies, expo@^58.0.25, expo-image-picker@^58.0.10, expo-status-bar@~58.0.5, lucide-react-native@^1.73.0, react@19.3.0, react-native@0.88.1, @react-native-async-storage/async-storage@2.2.0 (+31 more)

### Community 6 - "FE/package.json"
Cohesion: 0.09
Nodes (29): dependencies, lucide-react@^0.380.0, react@^18.3.1, react-dom@^18.3.1, recharts@^2.12.7, socket.io-client@^4.8.3, xlsx@^0.18.5, devDependencies (+21 more)

### Community 7 - "parser/index.js"
Cohesion: 0.08
Nodes (23): refreshDynamicKeywords(), app, VALID_LEVELS, addToBuffer(), flushBuffer(), logBuffer, logParserWorker, LOG_QUEUE_NAME (+15 more)

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
Cohesion: 0.06
Nodes (41): buildBglTimeWindows(), loadBglDataset(), parseBglLogFile(), __dirname, LOG_FILE, main(), OUT_FILE, VOCAB_OUT_FILE (+33 more)

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

### Community 39 - "log_generator.js"
Cohesion: 0.33
Nodes (5): generateRandomBatch(), LEVELS, MESSAGES, sendLogsToCollector(), SERVICES

## Knowledge Gaps
- **1 isolated node(s):** `RFC-3164`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 200 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dotenv` connect `opensearch.js` to `BE/package.json`, `full_evaluation.js`, `parser/index.js`, `search-api/index.js`, `authService.js`, `bgl/generate_vectors.js`, `cronService.js`, `alertService.js`?**
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
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `full_evaluation.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06057945566286216 - nodes in this community are weakly interconnected._