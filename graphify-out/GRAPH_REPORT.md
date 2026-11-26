# Graph Report - DATN  (2026-11-26)

## Corpus Check
- 92 files · ~84,916 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .pkl 4, (none) 3, .example 2)

## Summary
- 602 nodes · 1303 edges · 20 communities (17 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c947db57`
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
- dotenv
- expo
- bgl/generate_vectors.js
- pipelineMetrics.js
- opensearch.js
- opensearchQueries.js
- api_security.test.js
- vercel.json
- log_generator.js

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 37 edges
2. `apiClient()` - 21 edges
3. `react-native` - 21 edges
4. `App()` - 19 edges
5. `useAuth()` - 19 edges
6. `lucide-react-native` - 17 edges
7. `scripts` - 17 edges
8. `react-native-safe-area-context` - 16 edges
9. `lucide-react` - 14 edges
10. `useToast()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `CronJobsModal()`  [EXTRACTED]
  FE/src/App.jsx → FE/src/components/CronJobsModal.jsx
- `App()` --calls--> `CustomDateTimePicker()`  [EXTRACTED]
  FE/src/App.jsx → FE/src/components/CustomDateTimePicker.jsx
- `App()` --calls--> `PasswordChangeModal()`  [EXTRACTED]
  FE/src/App.jsx → FE/src/components/PasswordChangeModal.jsx
- `App()` --calls--> `PipelineHealthWidget()`  [EXTRACTED]
  FE/src/App.jsx → FE/src/components/PipelineHealthWidget.jsx
- `App()` --calls--> `TabHelpModal()`  [EXTRACTED]
  FE/src/App.jsx → FE/src/components/TabHelpModal.jsx

## Import Cycles
- None detected.

## Communities (20 total, 3 thin omitted)

### Community 0 - "useTheme"
Cohesion: 0.07
Nodes (74): App(), MainApp(), apiClient(), getAuthToken(), setAuthToken(), CURRENT_LAN_IP, DEFAULT_API_BASE, DEFAULT_COLLECTOR_BASE (+66 more)

### Community 1 - "BE/package.json"
Cohesion: 0.12
Nodes (22): dependencies, bcryptjs@^3.0.3, better-sqlite3@^13.2.0, cors@^2.8.5, ioredis@^5.3.2, jsonwebtoken@^9.0.3, node-cron@^4.6.0, nodemailer@^10.3.1 (+14 more)

### Community 2 - "full_evaluation.js"
Cohesion: 0.06
Nodes (50): callMlPredict(), __dirname, DRAIN_WORKER_PATH, exportVectorsForML(), __filename, FROZEN_VOCAB_PATH, loadFrozenVocab(), ML_API_TIMEOUT_MS (+42 more)

### Community 3 - "ml_api.py"
Cohesion: 0.07
Nodes (12): health(), lifespan(), _load_models(), predict(), PredictRequest, PredictResponse, reload_model(), _build_report() (+4 more)

### Community 4 - "App.jsx"
Cohesion: 0.08
Nodes (33): App(), formatVnDateTime(), KpiSkeleton(), LEVEL_COLORS, Skeleton(), ToastContainer(), toLocalDatetimeInputString(), useToast() (+25 more)

### Community 5 - "Mobile/package.json"
Cohesion: 0.07
Nodes (39): dependencies, expo@^58.0.25, expo-image-picker@^58.0.10, expo-status-bar@~58.0.5, lucide-react-native@^1.73.0, react@19.3.0, react-native@0.88.1, @react-native-async-storage/async-storage@2.2.0 (+31 more)

### Community 6 - "FE/package.json"
Cohesion: 0.09
Nodes (29): dependencies, lucide-react@^0.380.0, react@^18.3.1, react-dom@^18.3.1, recharts@^2.12.7, socket.io-client@^4.8.3, xlsx@^0.18.5, devDependencies (+21 more)

### Community 7 - "parser/index.js"
Cohesion: 0.17
Nodes (13): refreshDynamicKeywords(), bullmq@^5.1.0, addToBuffer(), flushBuffer(), logBuffer, logParserWorker, LOG_QUEUE_NAME, REALTIME_LOG_CHANNEL (+5 more)

### Community 8 - "search-api/index.js"
Cohesion: 0.05
Nodes (63): DATA_DIR, db, dbDir, __dirname, __filename, ghiLichSuCron(), ghiNhatKyHeThong(), initDatabase() (+55 more)

### Community 9 - "scripts"
Cohesion: 0.12
Nodes (17): scripts, benchmark, benchmark:full, generate:logs, generate:vectors-bgl, generate:vectors-hdfs, ml:train-bgl, ml:train-hdfs (+9 more)

### Community 10 - "dotenv"
Cohesion: 0.22
Nodes (7): app, VALID_LEVELS, dotenv@^16.4.5, express@^4.19.2, rawLogsQueue, dotenv, express

### Community 11 - "expo"
Cohesion: 0.13
Nodes (14): backgroundColor, adaptiveIcon, expo, android, ios, name, orientation, slug (+6 more)

### Community 12 - "bgl/generate_vectors.js"
Cohesion: 0.06
Nodes (41): buildBglTimeWindows(), loadBglDataset(), parseBglLogFile(), __dirname, LOG_FILE, main(), OUT_FILE, VOCAB_OUT_FILE (+33 more)

### Community 13 - "pipelineMetrics.js"
Cohesion: 0.28
Nodes (8): REDIS_HOST, REDIS_PORT, redisConnection, calculateAvgLatency(), calculateThroughput(), getPipelineHealth(), latencySamples, secondBuckets

### Community 14 - "opensearch.js"
Cohesion: 0.39
Nodes (7): luuLogDuPhong(), @opensearch-project/opensearch@^2.6.0, bulkIndexLogs(), getDailyIndexName(), indexLogDocument(), opensearchClient, @opensearch-project/opensearch

### Community 15 - "opensearchQueries.js"
Cohesion: 0.19
Nodes (17): __dirname, extractDrainTemplate(), fallbackAnomalyAnalytics(), fallbackDrainTemplates(), fallbackKpiStats(), fallbackLogStats(), fallbackRecentAnomalies(), fallbackSearchLogs() (+9 more)

### Community 39 - "log_generator.js"
Cohesion: 0.33
Nodes (5): generateRandomBatch(), LEVELS, MESSAGES, sendLogsToCollector(), SERVICES

## Knowledge Gaps
- **1 isolated node(s):** `RFC-3164`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 201 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dotenv` connect `dotenv` to `BE/package.json`, `full_evaluation.js`, `parser/index.js`, `search-api/index.js`, `bgl/generate_vectors.js`, `opensearch.js`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `RFC-3164` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.06758775205377147 - nodes in this community are weakly interconnected._
- **Why does `scripts` connect `scripts` to `BE/package.json`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Should `BE/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.11857707509881422 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `App.jsx` to `FE/package.json`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `full_evaluation.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06057945566286216 - nodes in this community are weakly interconnected._