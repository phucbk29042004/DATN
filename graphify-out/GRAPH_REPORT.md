# Graph Report - DATN  (2026-11-18)

## Corpus Check
- 90 files · ~87,971 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .log 2, .css 2, .bat 2)

## Summary
- 510 nodes · 1092 edges · 17 communities (16 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Mobile React Native Client
- Anomaly Detection Engine & ML
- Datasets & Benchmarks
- Frontend React Dashboard
- Backend Services & Pipeline

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 35 edges
2. `apiClient()` - 21 edges
3. `react-native` - 20 edges
4. `App()` - 18 edges
5. `useAuth()` - 17 edges
6. `scripts` - 16 edges
7. `lucide-react-native` - 16 edges
8. `react-native-safe-area-context` - 15 edges
9. `useToast()` - 13 edges
10. `dotenv` - 12 edges

## Surprising Connections (you probably didn't know these)
- `flushBuffer()` --calls--> `runAnomalyDetection()`  [EXTRACTED]
  BE/parser/index.js → BE/anomaly-engine/index.js
- `exportVectorsForML()` --calls--> `vectorizeDataset()`  [EXTRACTED]
  BE/anomaly-engine/index.js → BE/anomaly-engine/template-mining/vectorizer.js
- `runFullEvaluation()` --calls--> `checkLogLineSingle()`  [EXTRACTED]
  BE/benchmark/full_evaluation.js → BE/anomaly-engine/rule-based/detector.js
- `runBenchmark()` --calls--> `checkLogLineSingle()`  [EXTRACTED]
  BE/benchmark/pipeline_benchmark.js → BE/anomaly-engine/rule-based/detector.js
- `main()` --calls--> `vectorizeDataset()`  [EXTRACTED]
  BE/datasets/bgl/generate_vectors.js → BE/anomaly-engine/template-mining/vectorizer.js

## Import Cycles
- None detected.

## Communities (17 total, 1 thin omitted)

### Community 0 - "Mobile React Native Client"
Cohesion: 0.07
Nodes (71): App(), MainApp(), apiClient(), getAuthToken(), setAuthToken(), CURRENT_LAN_IP, DEFAULT_API_BASE, DEFAULT_COLLECTOR_BASE (+63 more)

### Community 1 - "Anomaly Detection Engine & ML"
Cohesion: 0.06
Nodes (44): callMlPredict(), __dirname, DRAIN_WORKER_PATH, exportVectorsForML(), __filename, ML_API_TIMEOUT_MS, runAnomalyDetection(), vectorizeInWorker() (+36 more)

### Community 2 - "Datasets & Benchmarks"
Cohesion: 0.06
Nodes (42): buildBglTimeWindows(), loadBglDataset(), parseBglLogFile(), __dirname, LOG_FILE, main(), OUT_FILE, __dirname (+34 more)

### Community 3 - "ML API Microservice (FastAPI)"
Cohesion: 0.07
Nodes (12): health(), lifespan(), _load_models(), predict(), PredictRequest, PredictResponse, reload_model(), _build_report() (+4 more)

### Community 4 - "Frontend React UI Components"
Cohesion: 0.10
Nodes (26): App(), formatVnDateTime(), KpiSkeleton(), LEVEL_COLORS, Skeleton(), ToastContainer(), toLocalDatetimeInputString(), useToast() (+18 more)

### Community 5 - "Mobile App Dependencies & Config"
Cohesion: 0.07
Nodes (37): expo, expo-status-bar, lucide-react-native, react, react-native, async-storage, safe-area-context (+29 more)

### Community 6 - "Frontend Dependencies & Vite Setup"
Cohesion: 0.09
Nodes (29): lucide-react, react, react-dom, recharts, socket.io-client, xlsx, devDependencies (+21 more)

### Community 7 - "Backend Dependencies & Infrastructure"
Cohesion: 0.10
Nodes (26): bcryptjs, bullmq, cors, express, ioredis, jsonwebtoken, node-cron (+18 more)

### Community 8 - "Authentication & RBAC Security"
Cohesion: 0.13
Nodes (21): authenticateToken(), changePassword(), loginUser(), optionalAuth(), requireAdmin(), USERS, allowedOrigins, app (+13 more)

### Community 9 - "BullMQ Queue & Redis Connection"
Cohesion: 0.19
Nodes (13): app, dotenv, rawLogsQueue, REDIS_HOST, REDIS_PORT, redisConnection, redisSub, calculateAvgLatency() (+5 more)

### Community 10 - "Drain Template Mining Parser"
Cohesion: 0.12
Nodes: DrainParser, Node, prune_tree, parseMessage, add_log_message, get_templates

### Community 11 - "Mobile Navigation & Stack Routers"
Cohesion: 0.15
Nodes: AppStackNavigator, AuthStackNavigator, MainTabNavigator, RootNavigator

### Community 12 - "Web Modals & Incident Lifecycle Views"
Cohesion: 0.14
Nodes: IncidentNoteModal, AdminSettingsModal, CronJobsModal, PasswordChangeModal

### Community 13 - "Multi-Channel Alert Services"
Cohesion: 0.16
Nodes: sendDiscordAlert, sendEmailAlert, sendDailyDigestReport, checkCooldown

### Community 14 - "OpenSearch Storage & Query Engine"
Cohesion: 0.18
Nodes: client, checkClusterHealth, buildSearchQuery, deleteOldLogsByRetention

### Community 15 - "Collector & Ingestion Endpoints"
Cohesion: 0.22
Nodes: app, PORT, POST /api/v1/logs, POST /api/v1/logs/batch, health

### Community 16 - "Mobile Theme & Global Styling Tokens"
Cohesion: 0.25
Nodes: ThemeContext, ThemeProvider, useTheme, darkTheme, lightTheme, colors

