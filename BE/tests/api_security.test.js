import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const testDbPath = path.join(os.tmpdir(), `logpulse_test_${Date.now()}_${process.pid}.sqlite`);
process.env.NODE_ENV = 'test';
process.env.SQLITE_DB_PATH = testDbPath;
process.env.JWT_SECRET = 'test_jwt_secret_key_for_ci';
process.env.ENABLE_DEMO_STREAMER = 'false';

const { httpServer, io } = await import('../search-api/index.js');
const { app: collectorApp, validateLogPayload } = await import('../collector/index.js');
const { redisConnection, redisPub, redisSub, rawLogsQueue } = await import('../queue/config.js');
const { default: db, luuTinNhanNoiBo, layDanhSachTinNhanNoiBo, luuLogDuPhong } = await import('../database/sqlite.js');
const { vectorizeWithFrozenVocab } = await import('../anomaly-engine/template-mining/vectorizer.js');
const { stopCronJobs } = await import('../search-api/cronService.js');
const { alertConfig, loadConfigFromSqlite } = await import('../search-api/alertService.js');

let apiBaseUrl;
let collectorServer;
let collectorBaseUrl;
let adminToken;
let viewerToken;

async function reqJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

before(async () => {
  await new Promise((resolve) => {
    httpServer.listen(0, '127.0.0.1', () => {
      const addr = httpServer.address();
      apiBaseUrl = `http://127.0.0.1:${addr.port}/api/v1`;
      resolve();
    });
  });

  await new Promise((resolve) => {
    collectorServer = collectorApp.listen(0, '127.0.0.1', () => {
      const addr = collectorServer.address();
      collectorBaseUrl = `http://127.0.0.1:${addr.port}/api/v1`;
      resolve();
    });
  });

  const adminLogin = await reqJson(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  assert.equal(adminLogin.status, 200);
  adminToken = adminLogin.body.token;

  const viewerLogin = await reqJson(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ username: 'viewer', password: 'viewer123' })
  });
  assert.equal(viewerLogin.status, 200);
  viewerToken = viewerLogin.body.token;
});

after(async () => {
  stopCronJobs();
  io.close();
  await new Promise((r) => httpServer.close(() => r()));
  await new Promise((r) => collectorServer.close(() => r()));
  await rawLogsQueue.close().catch(() => {});
  redisConnection.disconnect();
  redisPub.disconnect();
  redisSub.disconnect();
  db.close();
  for (const suffix of ['', '-wal', '-shm']) {
    try {
      if (fs.existsSync(testDbPath + suffix)) fs.unlinkSync(testDbPath + suffix);
    } catch {}
  }
});

test('RBAC: Chặn request ẩn danh (401) trên các endpoint quản trị & sự cố', async () => {
  const checks = [
    reqJson(`${apiBaseUrl}/config`),
    reqJson(`${apiBaseUrl}/config`, { method: 'POST', body: JSON.stringify({ retentionDays: 15 }) }),
    reqJson(`${apiBaseUrl}/alerts/maintenance`, { method: 'POST', body: JSON.stringify({ enabled: true, minutes: 15 }) }),
    reqJson(`${apiBaseUrl}/anomalies/test_id_1/status`, { method: 'PATCH', body: JSON.stringify({ status: 'ACKNOWLEDGED' }) }),
    reqJson(`${apiBaseUrl}/anomalies/test_id_1/notes`, { method: 'POST', body: JSON.stringify({ note: 'test' }) }),
    reqJson(`${apiBaseUrl}/storage/retention/cleanup`, { method: 'POST', body: JSON.stringify({ days: 30 }) }),
    reqJson(`${apiBaseUrl}/reports/digest/trigger`, { method: 'POST' }),
    reqJson(`${apiBaseUrl}/audit/logs`),
    reqJson(`${apiBaseUrl}/cron/history`),
    reqJson(`${apiBaseUrl}/chat/messages`, { method: 'POST', body: JSON.stringify({ content: 'hello' }) })
  ];

  const results = await Promise.all(checks);
  for (const res of results) {
    assert.equal(res.status, 401, `Kỳ vọng HTTP 401 khi không có token, nhận ${res.status}`);
  }
});

test('RBAC: Chặn Viewer (403) khi gọi endpoint Admin nhưng cho phép thêm Note sự cố', async () => {
  const viewerHeaders = { Authorization: `Bearer ${viewerToken}` };

  const adminOnlyReqs = await Promise.all([
    reqJson(`${apiBaseUrl}/config`, { method: 'POST', headers: viewerHeaders, body: JSON.stringify({ retentionDays: 10 }) }),
    reqJson(`${apiBaseUrl}/alerts/maintenance`, { method: 'POST', headers: viewerHeaders, body: JSON.stringify({ enabled: true }) }),
    reqJson(`${apiBaseUrl}/anomalies/test_inc_1/status`, { method: 'PATCH', headers: viewerHeaders, body: JSON.stringify({ status: 'ACKNOWLEDGED' }) }),
    reqJson(`${apiBaseUrl}/storage/retention/cleanup`, { method: 'POST', headers: viewerHeaders, body: JSON.stringify({ days: 30 }) }),
    reqJson(`${apiBaseUrl}/audit/logs`, { headers: viewerHeaders }),
    reqJson(`${apiBaseUrl}/cron/history`, { headers: viewerHeaders })
  ]);

  for (const res of adminOnlyReqs) {
    assert.equal(res.status, 403, `Kỳ vọng HTTP 403 với Viewer, nhận ${res.status}`);
  }

  const noteRes = await reqJson(`${apiBaseUrl}/anomalies/test_inc_1/notes`, {
    method: 'POST',
    headers: viewerHeaders,
    body: JSON.stringify({ note: 'Viewer điều tra tự động', type: 'INVESTIGATION' })
  });
  assert.equal(noteRes.status, 200);
});

test('Security: GET /config ẩn mật khẩu smtpPass và che webhook đối với Viewer', async () => {
  await reqJson(`${apiBaseUrl}/config`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ smtpPass: 'secret_pass_123', discordWebhookUrl: 'https://discord.com/api/webhooks/123/abc' })
  });

  const adminCfg = await reqJson(`${apiBaseUrl}/config`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(adminCfg.status, 200);
  assert.equal(adminCfg.body.smtpPass, '********');

  const viewerCfg = await reqJson(`${apiBaseUrl}/config`, {
    headers: { Authorization: `Bearer ${viewerToken}` }
  });
  assert.equal(viewerCfg.status, 200);
  assert.equal(viewerCfg.body.smtpPass, '********');
  assert.equal(viewerCfg.body.discordWebhookUrl, '********');
});

test('Incident Validation: Không cho đóng RESOLVED khi thiếu root_cause hoặc action_taken', async () => {
  const resMissing = await reqJson(`${apiBaseUrl}/anomalies/test_inc_resolve/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'RESOLVED' })
  });
  assert.equal(resMissing.status, 400);

  const resValid = await reqJson(`${apiBaseUrl}/anomalies/test_inc_resolve/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      status: 'RESOLVED',
      priority: 'P1',
      root_cause: 'Database Failure',
      action_taken: 'Restart Service'
    })
  });
  assert.equal(resValid.status, 200);
  assert.equal(resValid.body.incident.status, 'RESOLVED');
});

test('Collector Validation: Từ chối 400 khi thiếu trường chuẩn timestamp/service/level/message', async () => {
  assert.ok(validateLogPayload({ message: 'missing fields' }));
  assert.equal(validateLogPayload({
    timestamp: new Date().toISOString(),
    service: 'auth-service',
    level: 'ERROR',
    message: 'Database timeout'
  }), null);

  const badSingle = await reqJson(`${collectorBaseUrl}/logs`, {
    method: 'POST',
    body: JSON.stringify({ message: 'no timestamp or service' })
  });
  assert.equal(badSingle.status, 400);

  const badBatch = await reqJson(`${collectorBaseUrl}/logs/batch`, {
    method: 'POST',
    body: JSON.stringify({ logs: [{ service: 'api', level: 'INVALID_LVL', message: 'hi', timestamp: '2026-01-01T00:00:00Z' }] })
  });
  assert.equal(badBatch.status, 400);
});

test('SQLite: Chat lấy N tin mới nhất và lưu được vào bảng dự phòng log_du_phong', () => {
  const insertedIds = [];
  for (let i = 0; i < 6; i++) {
    const saved = luuTinNhanNoiBo({
      id: `test_chat_${i}_${Date.now()}`,
      nguoiGui: 'viewer',
      vaiTro: 'viewer',
      tenHienThi: 'Viewer Test',
      noiDung: `Msg ${i}`
    });
    insertedIds.push(saved.id);
  }
  const latest3 = layDanhSachTinNhanNoiBo(3);
  assert.equal(latest3.length, 3);
  assert.equal(latest3[2].id, insertedIds[5]);

  const fbId = luuLogDuPhong({
    id: `fb_test_${Date.now()}`,
    timestamp: new Date().toISOString(),
    service: 'collector-test',
    level: 'WARN',
    message: 'Fallback record check'
  });
  assert.ok(fbId);
});

test('Drain Frozen Vocab: Luôn giữ nguyên số chiều vector cố định', () => {
  const vocab = [
    { id: 1, template: 'User logged in from <*>' },
    { id: 2, template: 'Connection timeout to port <*>' }
  ];
  const { vector, unknownCount } = vectorizeWithFrozenVocab([
    'User logged in from 192.168.1.10',
    'Completely unseen panic message xyz'
  ], vocab);
  assert.equal(vector.length, 2);
  assert.equal(vector[0], 1);
  assert.equal(unknownCount, 1);
});

test('Export CSV: Yêu cầu JWT (401) và trả CSV UTF-8 BOM khi có token', async () => {
  const unauthRes = await fetch(`${apiBaseUrl}/export/csv?type=anomalies`);
  assert.equal(unauthRes.status, 401);

  const authRes = await fetch(`${apiBaseUrl}/export/csv?type=anomalies`, {
    headers: { Authorization: `Bearer ${viewerToken}` }
  });
  assert.equal(authRes.status, 200);
  const contentType = authRes.headers.get('content-type') || '';
  assert.ok(contentType.includes('text/csv'));
  const rawBytes = Buffer.from(await authRes.arrayBuffer());
  assert.equal(rawBytes[0], 0xef);
  assert.equal(rawBytes[1], 0xbb);
  assert.equal(rawBytes[2], 0xbf);
  const text = rawBytes.subarray(3).toString('utf8');
  assert.ok(text.startsWith('Timestamp,Service,Level,Anomaly_Score,Message'));
});

test('Pipeline Health: Trả về 0ms thay vì số giả lập cứng khi chưa có log xử lý', async () => {
  const res = await reqJson(`${apiBaseUrl}/pipeline/health`);
  assert.equal(res.status, 200);
  assert.equal(res.body.latency.avgLatencyMs, 0);
});

test('Alert Config: Kế thừa SMTP / Receiver Email từ env khi SQLite rỗng', () => {
  const prevUser = process.env.SMTP_USERNAME;
  const prevPass = process.env.SMTP_PASSWORD;
  const prevAdmin = process.env.ADMIN_EMAIL;
  try {
    db.prepare("UPDATE cau_hinh_he_thong SET gia_tri = '' WHERE khoa IN ('smtpUser', 'smtpPass', 'receiverEmail')").run();
    db.prepare("UPDATE cau_hinh_he_thong SET gia_tri = 'false' WHERE khoa = 'emailEnabled'").run();
    alertConfig.smtpUser = '';
    alertConfig.smtpPass = '';
    alertConfig.receiverEmail = '';
    alertConfig.emailEnabled = false;

    process.env.SMTP_USERNAME = 'bot@gmail.com';
    process.env.SMTP_PASSWORD = 'app_password_16';
    process.env.ADMIN_EMAIL = 'admin@gmail.com';
    loadConfigFromSqlite();

    assert.equal(alertConfig.smtpUser, 'bot@gmail.com');
    assert.equal(alertConfig.smtpPass, 'app_password_16');
    assert.equal(alertConfig.receiverEmail, 'admin@gmail.com');
    assert.equal(alertConfig.emailEnabled, true);
  } finally {
    if (prevUser === undefined) delete process.env.SMTP_USERNAME; else process.env.SMTP_USERNAME = prevUser;
    if (prevPass === undefined) delete process.env.SMTP_PASSWORD; else process.env.SMTP_PASSWORD = prevPass;
    if (prevAdmin === undefined) delete process.env.ADMIN_EMAIL; else process.env.ADMIN_EMAIL = prevAdmin;
  }
});

test('Rate Limiter: Trả HTTP 429 khi vượt ngưỡng đăng nhập liên tiếp', async () => {
  let got429 = false;
  for (let i = 0; i < 18; i++) {
    const res = await reqJson(`${apiBaseUrl}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'wrong_password' })
    });
    if (res.status === 429) {
      got429 = true;
      break;
    }
  }
  assert.equal(got429, true, 'Kỳ vọng nhận HTTP 429 từ authLimiter');
});
