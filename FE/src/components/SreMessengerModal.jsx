import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Shield, User, Paperclip, ChevronDown, CheckCheck, RefreshCw, Terminal } from 'lucide-react';

const API_BASE = import.meta.env.VITE_SEARCH_API_URL || 'http://localhost:5000/api/v1';

export default function SreMessengerModal({
  isOpen,
  onClose,
  currentUser,
  socket,
  taggedLog,
  onClearTaggedLog,
  onInspectLog
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Tải lịch sử tin nhắn khi mở modal
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/chat/messages?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.warn('[SRE Chat] Không thể nạp lịch sử tin nhắn:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen]);

  // Lắng nghe sự kiện socket realtime
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      setMessages(prev => {
        // Tránh trùng lặp
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('sre_chat_message', handleNewMessage);
    return () => {
      socket.off('sre_chat_message', handleNewMessage);
    };
  }, [socket]);

  // Gửi tin nhắn
  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text && !taggedLog) return;

    const payload = {
      content: text,
      logAttachment: taggedLog || null,
      sender: currentUser?.username || 'anonymous',
      displayName: currentUser?.displayName || 'Người dùng SRE',
      role: currentUser?.role || 'viewer'
    };

    setInput('');
    if (onClearTaggedLog) onClearTaggedLog();

    // 1. Gửi qua Socket.IO nếu có kết nối
    if (socket && socket.connected) {
      socket.emit('sre_chat_send', payload);
    } else {
      // 2. Fallback qua REST API
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE}/chat/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error('[SRE Chat Send Error]:', err.message);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="sre-messenger-window"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '90px',
        width: '420px',
        maxWidth: 'calc(100vw - 32px)',
        height: '560px',
        maxHeight: 'calc(100vh - 120px)',
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(6, 182, 212, 0.15)',
        overflow: 'hidden',
        animation: 'slideUpFade 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.1rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(6, 182, 212, 0.4)'
            }}
          >
            <MessageSquare size={16} color="var(--accent-primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Kênh Trao Đổi SRE
              <span
                style={{
                  fontSize: '0.62rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                Trực tuyến
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Phòng trao đổi sự cố giữa Admin &amp; Viewer
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={fetchMessages}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.3rem',
              borderRadius: '6px'
            }}
            title="Tải lại tin nhắn"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.3rem',
              borderRadius: '6px'
            }}
            title="Đóng chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          background: 'rgba(0, 0, 0, 0.08)'
        }}
      >
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            <MessageSquare size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p style={{ fontWeight: 600 }}>Chưa có tin nhắn nào</p>
            <p style={{ fontSize: '0.74rem' }}>Hãy gửi tin nhắn đầu tiên để thảo luận về các sự cố log!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.nguoi_gui === currentUser?.username;
            const isAdmin = msg.vai_tro === 'admin';

            return (
              <div
                key={msg.id || i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  alignSelf: isMe ? 'flex-end' : 'flex-start'
                }}
              >
                {/* Sender Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    marginBottom: '0.2rem',
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <span style={{ fontWeight: 600, color: isMe ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                    {msg.ten_hien_thi || msg.nguoi_gui}
                  </span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      background: isAdmin ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                      color: isAdmin ? '#ef4444' : '#06b6d4',
                      border: `1px solid ${isAdmin ? 'rgba(239, 68, 68, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`
                    }}
                  >
                    {isAdmin ? 'ADMIN' : 'VIEWER'}
                  </span>
                  <span style={{ opacity: 0.7, fontSize: '0.62rem' }}>
                    {msg.thoi_gian ? new Date(msg.thoi_gian).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background: isMe
                      ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.2))'
                      : 'var(--bg-secondary)',
                    border: isMe ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.84rem',
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {/* Tagged Log Card */}
                  {msg.dinh_kem_log && (
                    <div
                      onClick={() => onInspectLog && onInspectLog(msg.dinh_kem_log)}
                      style={{
                        marginBottom: msg.noi_dung ? '0.5rem' : 0,
                        padding: '0.45rem 0.6rem',
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        cursor: onInspectLog ? 'pointer' : 'default',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem'
                      }}
                      title="Bấm để xem chi tiết log này"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', fontSize: '0.68rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#f59e0b', fontWeight: 700 }}>
                          <Terminal size={12} /> Log Đính Kèm
                        </span>
                        <span style={{ padding: '0 4px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 700 }}>
                          {msg.dinh_kem_log.level || 'ERROR'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        [{msg.dinh_kem_log.service || 'unknown'}] {msg.dinh_kem_log.message}
                      </div>
                    </div>
                  )}

                  {msg.noi_dung}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Tagged Log Preview bar in Input */}
      {taggedLog && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.4rem 0.8rem',
            background: 'rgba(245, 158, 11, 0.1)',
            borderTop: '1px solid rgba(245, 158, 11, 0.3)',
            fontSize: '0.75rem',
            color: '#f59e0b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
            <Paperclip size={13} />
            <span style={{ fontWeight: 600 }}>Đang gắn kèm log:</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px', color: 'var(--text-primary)' }}>
              [{taggedLog.service}] {taggedLog.message}
            </span>
          </div>
          <button
            type="button"
            onClick={onClearTaggedLog}
            style={{ background: 'transparent', border: 'none', color: '#f59e0b', cursor: 'pointer', padding: '2px' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 0.9rem',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-card)'
        }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={currentUser ? `Nhắn tin với tư cách ${currentUser.displayName}...` : 'Nhập tin nhắn trao đổi sự cố...'}
          style={{
            flex: 1,
            padding: '0.55rem 0.8rem',
            fontSize: '0.84rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border 0.2s'
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent-primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border-color)')}
        />
        <button
          type="submit"
          disabled={!input.trim() && !taggedLog}
          style={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            border: 'none',
            background: input.trim() || taggedLog ? 'var(--accent-primary)' : 'var(--bg-input)',
            color: input.trim() || taggedLog ? '#000' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: input.trim() || taggedLog ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          title="Gửi tin nhắn"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}

