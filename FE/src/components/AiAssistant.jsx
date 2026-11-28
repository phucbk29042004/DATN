import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Send, X, Trash2, Terminal, User, Loader, Zap, AlertTriangle, Image as ImageIcon, Paperclip } from 'lucide-react';
import { API_BASE } from '../config.js';

/**
 * AiAssistant — Floating chatbot + Nút "Phân tích cùng AI" trong Modal log
 *
 * Props:
 *   - lang: 'vi' | 'en'
 *   - t: translations object
 *   - theme: 'dark' | 'light'
 *   - currentUser: user object
 *   - kpiStats: dashboard kpi stats
 */
function cleanAsterisks(text) {
  if (!text) return '';
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^\s*\*\s+/gm, '- ')
    .replace(/\*/g, '');
}

export default function AiAssistant({ lang, t, theme, currentUser, kpiStats }) {
  const storageKey = `logpulse_ai_chat_${currentUser?.username || 'guest'}`;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // { base64, mimeType, previewUrl }
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);

  const isVi = lang === 'vi';

  // Nạp lại lịch sử chat khi đổi tài khoản đăng nhập
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      setMessages(Array.isArray(parsed) ? parsed : []);
    } catch {
      setMessages([]);
    }
  }, [storageKey]);

  // Lưu lịch sử chat vào localStorage để không mất khi F5 / đăng nhập lại
  useEffect(() => {
    try {
      const hasTyping = messages.some(m => m.isTyping);
      if (hasTyping) return;
      const serializable = messages.slice(-50).map(({ role, content, provider, isError }) => ({
        role,
        content,
        ...(provider ? { provider } : {}),
        ...(isError ? { isError: true } : {})
      }));
      localStorage.setItem(storageKey, JSON.stringify(serializable));
    } catch {
      // Ignore storage quota errors
    }
  }, [messages, storageKey]);

  // Cleanup typing timer
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  // Xử lý nạp file ảnh
  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage({
        base64: e.target.result,
        mimeType: file.type,
        previewUrl: e.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  // Hỗ trợ Paste ảnh trực tiếp từ Clipboard (Ctrl + V)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleImageFile(file);
          break;
        }
      }
    }
  };

  // Position state: null by default (fixed bottom-right). Temporary drag only, never persisted.
  const [position, setPosition] = useState(null);

  useEffect(() => {
    try {
      localStorage.removeItem('logpulse_ai_fab_pos');
    } catch (e) {}
  }, []);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0, hasMoved: false });

  // Keep position clamped on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        if (!prev) return prev;
        const maxX = window.innerWidth - 56;
        const maxY = window.innerHeight - 56;
        const clampedX = Math.max(10, Math.min(prev.x, maxX));
        const clampedY = Math.max(10, Math.min(prev.y, maxY));
        if (clampedX !== prev.x || clampedY !== prev.y) {
          return { x: clampedX, y: clampedY };
        }
        return prev;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse Drag Handler
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click

    const currentX = position?.x ?? (window.innerWidth - 52 - 24);
    const currentY = position?.y ?? (window.innerHeight - 52 - 24);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: currentX,
      posY: currentY,
      hasMoved: false
    };

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaY = moveEvent.clientY - dragStartRef.current.startY;

      if (!dragStartRef.current.hasMoved && (Math.hypot(deltaX, deltaY) > 5)) {
        dragStartRef.current.hasMoved = true;
        isDraggingRef.current = true;
      }

      if (dragStartRef.current.hasMoved) {
        let newX = dragStartRef.current.posX + deltaX;
        let newY = dragStartRef.current.posY + deltaY;

        const maxX = window.innerWidth - 56;
        const maxY = window.innerHeight - 56;
        newX = Math.max(10, Math.min(newX, maxX));
        newY = Math.max(10, Math.min(newY, maxY));

        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (dragStartRef.current.hasMoved) {
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 80);
      } else {
        isDraggingRef.current = false;
        setIsOpen(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Touch Drag Handler for mobile/touch
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const currentX = position?.x ?? (window.innerWidth - 52 - 24);
    const currentY = position?.y ?? (window.innerHeight - 52 - 24);

    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      posX: currentX,
      posY: currentY,
      hasMoved: false
    };

    const handleTouchMove = (moveEvent) => {
      if (moveEvent.touches.length !== 1) return;
      const t = moveEvent.touches[0];
      const deltaX = t.clientX - dragStartRef.current.startX;
      const deltaY = t.clientY - dragStartRef.current.startY;

      if (!dragStartRef.current.hasMoved && (Math.hypot(deltaX, deltaY) > 5)) {
        dragStartRef.current.hasMoved = true;
        isDraggingRef.current = true;
      }

      if (dragStartRef.current.hasMoved) {
        let newX = dragStartRef.current.posX + deltaX;
        let newY = dragStartRef.current.posY + deltaY;

        const maxX = window.innerWidth - 56;
        const maxY = window.innerHeight - 56;
        newX = Math.max(10, Math.min(newX, maxX));
        newY = Math.max(10, Math.min(newY, maxY));

        setPosition({ x: newX, y: newY });
      }
    };

    const handleTouchEnd = () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);

      if (dragStartRef.current.hasMoved) {
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 80);
      } else {
        isDraggingRef.current = false;
        setIsOpen(true);
      }
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  // Fixed drawer at bottom-right corner
  const getDrawerStyle = () => {
    const width = Math.min(380, window.innerWidth - 32);
    const height = Math.min(560, window.innerHeight - 32);
    return {
      position: 'fixed',
      right: '24px',
      bottom: '24px',
      left: 'auto',
      top: 'auto',
      width: `${width}px`,
      maxHeight: `${height}px`,
      zIndex: 9999
    };
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    setPosition(null); // Reset FAB icon back to default bottom-right position
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if ((!text && !selectedImage) || loading) return;

    const currentImg = selectedImage;
    const userMsg = {
      role: 'user',
      content: text || (isVi ? 'Phân tích hình ảnh hệ thống này' : 'Analyze this system image'),
      image: currentImg ? currentImg.previewUrl : null
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setSelectedImage(null);
    setLoading(true);

    try {
      const totalCount = kpiStats?.total_logs_24h ? kpiStats.total_logs_24h.toLocaleString() : '10,000';
      const systemContext = `[THÔNG TIN HỆ THỐNG VÀ THỐNG KÊ THỜI GIAN THỰC]:
- Vai trò người dùng hiện tại: ${currentUser?.role === 'admin' ? 'QUẢN TRỊ VIÊN (ADMIN)' : 'NGƯỜI DÙNG XEM (VIEWER)'} (${currentUser?.displayName || 'Ẩn danh'}).
- Tổng số log ghi nhận trên hệ thống Dashboard: ${totalCount} logs.
- Số lượng bất thường (anomalies) trong 1h: ${kpiStats?.anomaly_count_1h ?? 0} sự cố.
- Số sự cố mức FATAL trong 1h: ${kpiStats?.fatal_count_1h ?? 0} cảnh báo.
- Trạng thái cụm OpenSearch: Hoạt động bình thường (Port 9200 OK).
- Dòng log realtime đang thu nạp: Đang hoạt động thông suốt.`;

      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          systemContext,
          image: currentImg ? { base64: currentImg.base64, mimeType: currentImg.mimeType } : null
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const fullText = cleanAsterisks(data.reply);
      const provider = data.provider;

      setLoading(false);
      // Khởi tạo tin nhắn cho hiệu ứng Typewriter Render mượt mà
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        provider,
        isTyping: true
      }]);

      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      let currIdx = 0;
      const step = 4;
      typingTimerRef.current = setInterval(() => {
        currIdx += step;
        if (currIdx >= fullText.length) {
          clearInterval(typingTimerRef.current);
          setMessages(prev => {
            const list = [...prev];
            const last = list[list.length - 1];
            if (last && last.role === 'assistant') {
              list[list.length - 1] = { ...last, content: fullText, isTyping: false };
            }
            return list;
          });
        } else {
          const partial = fullText.slice(0, currIdx);
          setMessages(prev => {
            const list = [...prev];
            const last = list[list.length - 1];
            if (last && last.role === 'assistant') {
              list[list.length - 1] = { ...last, content: partial, isTyping: true };
            }
            return list;
          });
        }
      }, 15);

    } catch (err) {
      setLoading(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: cleanAsterisks(err.message),
        isError: true
      }]);
    }
  }, [input, messages, loading, currentUser, kpiStats, selectedImage, isVi]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  return (
    <>
      {/* Floating Action Button - Có thể kéo di chuyển tự do, tự ẩn khi mở chat */}
      {!isOpen && (
        <button
          className="ai-fab"
          style={position ? {
            left: `${position.x}px`,
            top: `${position.y}px`,
            right: 'auto',
            bottom: 'auto',
            cursor: 'grab',
            userSelect: 'none',
            touchAction: 'none'
          } : {
            cursor: 'grab',
            userSelect: 'none',
            touchAction: 'none'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={(e) => {
            if (isDraggingRef.current) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            setIsOpen(true);
          }}
          title={isVi ? 'Trợ lý vận hành LogPulse (Kéo để di chuyển)' : 'LogPulse Operations Assistant (Drag to move)'}
          aria-label="Open Operations Assistant"
        >
          <Terminal size={20} />
        </button>
      )}

      {/* Chat Drawer */}
      {isOpen && (
        <div className="ai-drawer" data-theme={theme} style={getDrawerStyle()}>
          {/* Header */}
          <div className="ai-drawer-header">
            <div className="ai-drawer-title">
              <Terminal size={18} />
              <span>{isVi ? 'Trợ lý vận hành LogPulse' : 'LogPulse Assistant'}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                className="ai-header-btn"
                onClick={clearChat}
                title={isVi ? 'Xóa lịch sử' : 'Clear history'}
                aria-label="Clear chat"
              >
                <Trash2 size={15} />
              </button>
              <button
                className="ai-header-btn"
                onClick={handleCloseChat}
                title={isVi ? 'Đóng' : 'Close'}
                aria-label="Close AI"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="ai-messages">
            {messages.length === 0 && (
              <div className="ai-welcome">
                <Terminal size={32} />
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {isVi ? 'Xin chào! Tôi là Trợ lý vận hành LogPulse.' : 'Hello! I\'m LogPulse Assistant.'}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {isVi
                    ? 'Hãy hỏi tôi bất cứ điều gì về log, anomaly hoặc cách khắc phục sự cố hệ thống.'
                    : 'Ask me anything about logs, anomalies, or system troubleshooting.'}
                </p>
                <div className="ai-suggestions">
                  {(isVi ? [
                    'Hệ thống có anomaly nào đáng lo không?',
                    'Giải thích cách Drain Mining hoạt động',
                    'Log FATAL nghĩa là gì?'
                  ] : [
                    'Are there any concerning anomalies?',
                    'How does Drain Mining work?',
                    'What does a FATAL log mean?'
                  ]).map((suggestion, idx) => (
                    <button
                      key={idx}
                      className="ai-suggestion-btn"
                      onClick={() => {
                        setInput(suggestion);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`ai-msg ai-msg-${msg.role}`}>
                <div className="ai-msg-avatar">
                  {msg.role === 'user' ? <User size={14} /> : <Terminal size={14} />}
                </div>
                <div className={`ai-msg-bubble ${msg.isError ? 'ai-msg-error' : ''}`}>
                  {msg.image && (
                    <div style={{ marginBottom: '0.45rem', borderRadius: '8px', overflow: 'hidden', maxWidth: '240px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={msg.image} alt="Log screenshot" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </div>
                  )}
                  <div className="ai-msg-text" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                    {cleanAsterisks(msg.content)}
                    {msg.isTyping && <span className="typewriter-cursor">▋</span>}
                  </div>
                  {msg.provider && (
                    <span className="ai-msg-provider">via {msg.provider}</span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="ai-msg ai-msg-assistant">
                <div className="ai-msg-avatar"><Terminal size={14} /></div>
                <div className="ai-msg-bubble ai-msg-typing">
                  <Loader size={14} className="spin" />
                  <span>{isVi ? 'Đang phân tích...' : 'Analyzing...'}</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Selected Image Preview */}
          {selectedImage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.35rem 0.75rem',
                background: 'rgba(6, 182, 212, 0.08)',
                borderTop: '1px solid rgba(6, 182, 212, 0.25)',
                fontSize: '0.75rem',
                color: 'var(--accent-primary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img
                  src={selectedImage.previewUrl}
                  alt="Thumb"
                  style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--accent-primary)' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-primary)' }}>
                  {isVi ? 'Đã đính kèm ảnh (Gemini Vision)' : 'Image attached for analysis'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 2 }}
                title="Xóa ảnh"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div className="ai-input-bar" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem' }}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              className="ai-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title={isVi ? 'Tải lên hoặc dán (Ctrl+V) ảnh lỗi/sơ đồ để phân tích' : 'Upload or paste image'}
              style={{
                background: selectedImage ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                border: 'none',
                color: selectedImage ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <ImageIcon size={18} />
            </button>

            <textarea
              ref={inputRef}
              className="ai-input"
              placeholder={isVi ? 'Hỏi AI, tải lên ảnh hoặc bấm Ctrl+V để dán ảnh...' : 'Ask AI, upload or paste image...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              rows={1}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <button
              className="ai-send-btn"
              onClick={sendMessage}
              disabled={(!input.trim() && !selectedImage) || loading}
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * AiExplainButton — Nút "Phân tích cùng AI" dùng trong Modal chi tiết log
 *
 * Props:
 *   - logEntry: Object log cần phân tích
 *   - lang: 'vi' | 'en'
 */
export function AiExplainButton({ logEntry, lang }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isVi = lang === 'vi';

  const handleExplain = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setExplanation(null);

    try {
      const res = await fetch(`${API_BASE}/ai/explain-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: logEntry })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setExplanation(data.explanation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-explain-section">
      <button
        className="btn-primary ai-explain-btn"
        onClick={handleExplain}
        disabled={loading}
      >
        {loading ? (
          <><Loader size={14} className="spin" /> {isVi ? 'Đang phân tích...' : 'Analyzing...'}</>
        ) : (
          <><Zap size={14} /> {isVi ? 'Phân tích nguyên nhân (RCA)' : 'Analyze Root Cause (RCA)'}</>
        )}
      </button>

      {error && (
        <div className="ai-explain-result ai-explain-error" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <AlertTriangle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {explanation && (
        <div className="ai-explain-result">
          <div className="ai-explain-header">
            <Terminal size={16} />
            <span>{isVi ? 'Kết quả phân tích nguyên nhân' : 'Root Cause Analysis Result'}</span>
          </div>
          <div className="ai-explain-text" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
            {cleanAsterisks(explanation)}
          </div>
        </div>
      )}
    </div>
  );
}

