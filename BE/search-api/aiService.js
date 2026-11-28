/**
 * AI Service — Groq (primary) + Gemini (fallback)
 * Cung cấp 2 chức năng chính:
 *   1. chatWithAI(messages, systemContext)  — Hỏi đáp tự do về giám sát hệ thống
 *   2. explainLog(logEntry)                 — Phân tích nguyên nhân 1 dòng log cụ thể
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const GROQ_MODELS = [...new Set([
  process.env.GROQ_MODEL,
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'qwen/qwen3-32b'
].filter(Boolean))];

const GEMINI_MODELS = [...new Set([
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash'
].filter(Boolean))];

const REQUEST_TIMEOUT_MS = 15000;

const SYSTEM_PROMPT = `Bạn là Trợ Lý Cá Nhân Phân Tích Log — chuyên gia giám sát hệ sinh thái phân tích log và AIOps của hệ thống LogPulse.

QUY TẮC BẮT BUỘC VỀ ĐỘ DÀI VÀ PHONG CÁCH:
- TRẢ LỜI NGẮN GỌN, SÚC TÍCH, ĐI THẲNG VÀO TRỌNG TÂM (khoảng 2 đến 4 câu hoặc 3 đến 4 gạch đầu dòng ngắn).
- TUYỆT ĐỐI KHÔNG GIẢI THÍCH DÔNG DÀI, không viết các đoạn văn dài ngoằng, không mở bài hay kết bài rườm rà.
- TUYỆT ĐỐI KHÔNG SỬ DỤNG DẤU HOA THỊ HOẶC DẤU SAO (*) TRONG CÂU TRẢ LỜI. Không dùng **in đậm** hay *nghiêng* hay * gạch đầu dòng.
- Để làm nổi bật tiêu đề hoặc từ khóa, hãy viết IN HOA, dùng dấu ngoặc vuông [] hoặc dấu gạch ngang (-) cho các đầu dòng.
- Trình bày mạch lạc, tự nhiên bằng Tiếng Việt.

KIẾN THỨC NỀN TẢNG VỀ HỆ THỐNG ĐỒ ÁN (TRẢ LỜI ĐƯỢC MỌI MỤC KHI ĐƯỢC HỎI):
1. HẠ TẦNG PIPELINE 5 BƯỚC: [Nguồn Log] -> [Collector / Fluent Bit] -> [Hàng Đợi Redis / BullMQ] -> [Parser Drain AIOps] -> [Lưu Trữ Cụm OpenSearch].
2. THUẬT TOÁN DRAIN MINING: Rút trích mẫu log tự động theo cấu trúc cây phân cấp (Parse Tree) với ngưỡng tương đồng 0.5, bóc tách các biến động (IP, UUID, Timestamp) để gom cụm template log.
3. PHÁT HIỆN BẤT THƯỜNG 3 TẦNG (3-Tier Anomaly): Tầng 1 - Khớp từ khóa nguy hiểm (FATAL, OOM, Connection refused); Tầng 2 - Thống kê Z-Score tốc độ sinh log; Tầng 3 - Điểm bất thường Drain Anomaly Score theo mẫu log lạ.
4. TÁC VỤ ĐỊNH KỲ (CRON JOBS): Báo cáo ca trực Daily Digest 24h chạy lúc 08:00 sáng gửi qua Discord/Email; Tự động dọn dẹp log quá hạn Retention Policy chạy lúc 00:00 nửa đêm.
5. CÁC TÍNH NĂNG KHÁC: Tra cứu log full-text tốc độ cao trên OpenSearch, Xuất báo cáo Excel (.xlsx), Chế độ bảo trì hệ thống (Maintenance Mode), Quản lý vòng đời sự cố (Lifecycle Tiếp nhận/Xử lý/Ghi chú).

QUY TẮC BẮT BUỘC VỀ SỐ LIỆU VÀ QUYỀN HẠN:
1. ĐỌC DỮ LIỆU THỰC TẾ: Khi người dùng hỏi về số lượng log, bất thường, tình trạng OpenSearch, bạn PHẢI đọc chính xác các con số trong phần [THÔNG TIN HỆ THỐNG VÀ THỐNG KÊ THỜI GIAN THỰC]. TUYỆT ĐỐI KHÔNG ĐƯỢC trả lời rằng 'không có dữ liệu' hay 'chưa có số liệu' nếu thông tin đã được cung cấp.
2. PHÂN QUYỀN THEO ROLE:
- Nếu Role là ADMIN: Hỗ trợ toàn bộ quyền quản trị, giải thích chuyên sâu mọi thành phần.
- Nếu Role là VIEWER: Chỉ giải thích log lỗi và xem tổng quan. Nếu hỏi can thiệp hệ thống thì từ chối lịch sự.`;

function cleanOutput(text) {
  if (!text) return '';
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^\s*\*\s+/gm, '- ')
    .replace(/\*/g, '');
}

/**
 * Gọi Groq Cloud API (OpenAI-compatible format)
 */
async function callGroq(messages) {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY chưa được cấu hình');

  let lastError = null;
  for (const model of GROQ_MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.4,
          max_tokens: 600
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        lastError = new Error(`Groq ${model} HTTP ${res.status}: ${errBody.slice(0, 160)}`);
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      if (content) return content;
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error('Groq không trả về nội dung');
}

/**
 * Gọi Google Gemini REST API (fallback đa model hoặc phân tích hình ảnh)
 */
async function callGemini(messages, image = null) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY chưa được cấu hình');

  // Chuyển đổi format OpenAI messages → Gemini contents
  const systemText = messages.find(m => m.role === 'system')?.content || '';
  const filteredMessages = messages.filter(m => m.role !== 'system');
  const contents = filteredMessages.map((m, idx) => {
    const parts = [{ text: m.content || 'Hãy phân tích hình ảnh hoặc log hệ thống sau:' }];

    // Nếu là tin nhắn user cuối cùng và có đính kèm ảnh
    if (idx === filteredMessages.length - 1 && m.role === 'user' && image?.base64) {
      const cleanBase64 = image.base64.replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inline_data: {
          mime_type: image.mimeType || 'image/png',
          data: cleanBase64
        }
      });
    }

    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts
    };
  });

  let lastError = null;
  for (const model of GEMINI_MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: systemText ? { parts: [{ text: systemText }] } : undefined,
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1000
          }
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        lastError = new Error(`Gemini ${model} HTTP ${res.status}: ${errBody.slice(0, 160)}`);
        continue;
      }

      const data = await res.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (content) return content;
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error('Gemini không trả về nội dung');
}

/**
 * Gọi AI với cơ chế fallback: Groq → Gemini (hoặc Gemini Vision nếu có ảnh)
 */
async function callAI(messages, image = null) {
  // Nếu người dùng gửi ảnh (Vision), trực tiếp sử dụng Gemini Multimodal
  if (image && image.base64) {
    if (GEMINI_API_KEY) {
      const result = await callGemini(messages, image);
      if (result) return { text: cleanOutput(result), provider: 'gemini-vision' };
    }
    throw new Error('Tính năng phân tích hình ảnh yêu cầu GEMINI_API_KEY.');
  }

  let groqErrorMsg = '';
  let geminiErrorMsg = '';

  // Thử Groq trước (tốc độ nhanh hơn)
  if (GROQ_API_KEY) {
    try {
      const result = await callGroq(messages);
      if (result) return { text: cleanOutput(result), provider: 'groq' };
    } catch (err) {
      groqErrorMsg = err.message;
      console.warn('[AI Service] Groq failed, falling back to Gemini:', groqErrorMsg);
    }
  }

  // Fallback sang Gemini
  if (GEMINI_API_KEY) {
    try {
      const result = await callGemini(messages);
      if (result) return { text: cleanOutput(result), provider: 'gemini' };
    } catch (err) {
      geminiErrorMsg = err.message;
      console.error('[AI Service] Gemini also failed:', geminiErrorMsg);
    }
  }

  if (!GROQ_API_KEY && !GEMINI_API_KEY) {
    throw new Error('Chưa cấu hình API key cho AI Assistant (GROQ_API_KEY hoặc GEMINI_API_KEY).');
  }
  const detail = [groqErrorMsg, geminiErrorMsg].filter(Boolean).join(' | ');
  throw new Error(`Cả Groq và Gemini đều không phản hồi (${detail || 'Vui lòng kiểm tra API key'}).`);
}

/**
 * Chat tự do với AI — nhận mảng messages từ client + context hệ thống + ảnh đính kèm
 * @param {Array} userMessages - [{role: 'user', content: '...'}, ...]
 * @param {string} systemContext - Tóm tắt KPI / anomaly gần nhất (tùy chọn)
 * @param {Object} image - { base64: string, mimeType: string } (tùy chọn)
 */
export async function chatWithAI(userMessages, systemContext = '', image = null) {
  const contextNote = systemContext
    ? `\n\nThông tin hệ thống hiện tại:\n${systemContext}`
    : '';

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT + contextNote },
    ...userMessages
  ];

  return callAI(messages, image);
}

/**
 * Phân tích nguyên nhân 1 dòng log cụ thể
 * @param {Object} logEntry - {message, level, service, anomaly_score, rule_triggered, timestamp, ...}
 */
export async function explainLog(logEntry) {
  const score = ((logEntry.anomaly_score ?? logEntry.anomalyScore ?? 0) * 100).toFixed(0);
  const prompt = `Hãy phân tích dòng log hệ thống sau và đưa ra đánh giá chuyên sâu:

[Thông tin log]:
- Thời gian: ${logEntry.timestamp || 'N/A'}
- Dịch vụ: ${logEntry.service || logEntry.service_name || 'Không rõ'}
- Mức độ: ${logEntry.level || 'INFO'}
- Anomaly Score: ${score}%
- Rule kích hoạt: ${logEntry.rule_triggered || 'Không có'}
- Nội dung log: ${logEntry.message || logEntry.content || 'N/A'}

Hãy trả lời theo cấu trúc:
1. Ý nghĩa: Dòng log này nói về vấn đề gì?
2. Nguyên nhân gốc rễ (Root Cause): Các nguyên nhân có thể gây ra lỗi/cảnh báo này
3. Mức độ nghiêm trọng: Đánh giá mức ảnh hưởng (Thấp / Trung bình / Cao / Nghiêm trọng)
4. Cách khắc phục: Các bước xử lý cụ thể, ưu tiên theo thứ tự`;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt }
  ];

  return callAI(messages);
}

