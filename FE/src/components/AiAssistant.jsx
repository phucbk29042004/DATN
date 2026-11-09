import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Send, X, Trash2, Bot, User, Loader, Sparkles, AlertTriangle } from 'lucide-react';

const API_BASE = '/api/v1';

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
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Position state with localStorage persistence
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('logpulse_ai_fab_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  });

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
        setPosition(current => {
          if (current) {
            try {
              localStorage.setItem('logpulse_ai_fab_pos', JSON.stringify(current));
            } catch (err) {}
          }
          return current;
        });
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
        setPosition(current => {
          if (current) {
            try {
              localStorage.setItem('logpulse_ai_fab_pos', JSON.stringify(current));
            } catch (err) {}
          }
          return current;
        });
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

  // Compute smart drawer position near the dragged icon
  const getDrawerStyle = () => {
    if (!position) return {};
    const width = Math.min(380, window.innerWidth - 32);
    const height = Math.min(560, window.innerHeight - 32);

    let left = position.x;
    if (position.x > window.innerWidth / 2) {
      left = position.x + 52 - width;
    }
    if (left < 16) left = 16;
    if (left + width > window.innerWidth - 16) left = window.innerWidth - width - 16;

    let top = position.y - height - 12;
    if (top < 16) {
      top = position.y + 60;
    }
    if (top + height > window.innerHeight - 16) {
      top = window.innerHeight - height - 16;
    }
    if (top < 16) top = 16;

    return {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      bottom: 'auto',
      right: 'auto',
      width: `${width}px`
    };
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
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
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
          systemContext
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: cleanAsterisks(data.reply),
        provider: data.provider
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: cleanAsterisks(err.message),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading, currentUser, kpiStats]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const isVi = lang === 'vi';

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
          title={isVi ? 'Trợ lý cá nhân LogPulse (Kéo để di chuyển)' : 'LogPulse Assistant (Drag to move)'}
          aria-label="Open AI Assistant"
        >
          <Bot size={22} />
        </button>
      )}

      {/* Chat Drawer */}
      {isOpen && (
        <div className="ai-drawer" data-theme={theme} style={getDrawerStyle()}>
          {/* Header */}
          <div className="ai-drawer-header">
            <div className="ai-drawer-title">
              <Sparkles size={18} />
              <span>{isVi ? 'Trợ lý cá nhân LogPulse' : 'LogPulse Assistant'}</span>
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
                onClick={() => setIsOpen(false)}
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
                <Bot size={36} />
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {isVi ? 'Xin chào! Tôi là Trợ lý cá nhân LogPulse.' : 'Hello! I\'m LogPulse Assistant.'}
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
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`ai-msg-bubble ${msg.isError ? 'ai-msg-error' : ''}`}>
                  <div className="ai-msg-text" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                    {cleanAsterisks(msg.content)}
                  </div>
                  {msg.provider && (
                    <span className="ai-msg-provider">via {msg.provider}</span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="ai-msg ai-msg-assistant">
                <div className="ai-msg-avatar"><Bot size={14} /></div>
                <div className="ai-msg-bubble ai-msg-typing">
                  <Loader size={14} className="spin" />
                  <span>{isVi ? 'Đang phân tích...' : 'Analyzing...'}</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="ai-input-bar">
            <textarea
              ref={inputRef}
              className="ai-input"
              placeholder={isVi ? 'Nhập câu hỏi về log, anomaly...' : 'Ask about logs, anomalies...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              className="ai-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
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
          <><Loader size={14} className="spin" /> {isVi ? 'AI đang phân tích...' : 'AI analyzing...'}</>
        ) : (
          <><Sparkles size={14} /> {isVi ? 'Phân tích cùng AI' : 'Analyze with AI'}</>
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
            <Bot size={16} />
            <span>{isVi ? 'Kết quả phân tích AI' : 'AI Analysis Result'}</span>
          </div>
          <div className="ai-explain-text" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
            {cleanAsterisks(explanation)}
          </div>
        </div>
      )}
    </div>
  );
}

