import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquare, X, Send, Shield, User, RefreshCw, Paperclip, Terminal } from 'lucide-react-native';
import io from 'socket.io-client';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiClient, getAuthToken } from '../api/client';
import { getServerUrl } from '../api/config';

export default function SreMessengerModal({
  visible = true,
  embedded = false,
  onClose,
  taggedLog,
  onClearTaggedLog,
  onInspectLog,
}) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTaggedLog, setActiveTaggedLog] = useState(taggedLog);

  const flatListRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (taggedLog) {
      setActiveTaggedLog(taggedLog);
    }
  }, [taggedLog]);

  // Nạp lịch sử tin nhắn
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient('/chat/messages?limit=50');
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      console.warn('[Mobile SRE Chat] Lỗi tải tin nhắn:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Kết nối Socket.IO
  useEffect(() => {
    if (!visible && !embedded) return;

    fetchMessages();

    let isMounted = true;
    (async () => {
      const serverUrl = await getServerUrl();
      const token = await getAuthToken();
      if (!isMounted) return;

      const socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        ...(token ? { auth: { token } } : {}),
      });

      socket.on('sre_chat_message', (msg) => {
        if (!isMounted || !msg) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });

      socketRef.current = socket;
    })();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [visible, embedded, fetchMessages]);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if ((visible || embedded) && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages, visible, embedded]);

  // Gửi tin nhắn
  const handleSend = async () => {
    if ((!input.trim() && !activeTaggedLog) || sending) return;

    const messageText = input.trim();
    const payload = {
      sender: currentUser?.username || 'mobile-user',
      displayName: currentUser?.displayName || currentUser?.username || 'Mobile User',
      role: currentUser?.role || 'viewer',
      content: messageText || 'Đã gửi một bản ghi log sự cố cần kiểm tra.',
      logAttachment: activeTaggedLog || null,
    };

    setSending(true);
    setInput('');
    const tempTaggedLog = activeTaggedLog;
    setActiveTaggedLog(null);
    if (onClearTaggedLog) onClearTaggedLog();

    try {
      const savedMsg = await apiClient('/chat/messages', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (savedMsg && savedMsg.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === savedMsg.id)) return prev;
          return [...prev, savedMsg];
        });
      }
    } catch (err) {
      showToast(err.message || 'Không thể gửi tin nhắn. Vui lòng thử lại!', 'error');
      setActiveTaggedLog(tempTaggedLog);
    } finally {
      setSending(false);
    }
  };

  const renderMessageItem = ({ item }) => {
    const senderUsername = item.nguoi_gui || item.sender_name || item.sender || '';
    const senderDisplay = item.ten_hien_thi || item.sender_name || senderUsername || 'Người dùng';
    const senderRole = (item.vai_tro || item.sender_role || 'viewer').toLowerCase();
    const msgContent = item.noi_dung ?? item.message ?? '';
    const msgTime = item.thoi_gian || item.created_at;
    const rawAttachment = item.dinh_kem_log ?? item.tagged_log;

    const isMe = senderUsername === (currentUser?.username || '') || senderDisplay === (currentUser?.displayName || '');
    const isAdmin = senderRole === 'admin';

    let tagged = null;
    if (rawAttachment) {
      try {
        tagged = typeof rawAttachment === 'string' ? JSON.parse(rawAttachment) : rawAttachment;
      } catch {
        tagged = null;
      }
    }

    return (
      <View style={[styles.msgWrapper, isMe ? styles.msgWrapperMe : styles.msgWrapperOther]}>
        <View style={styles.msgHeader}>
          {isAdmin ? (
            <Shield size={12} color={colors.link || colors.primary} style={{ marginRight: 3 }} />
          ) : (
            <User size={12} color={colors.textSecondary} style={{ marginRight: 3 }} />
          )}
          <Text style={[styles.senderName, { color: colors.textSecondary }]}>
            {senderDisplay}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: isAdmin ? colors.primaryLight : colors.surfaceVariant }]}>
            <Text style={[styles.roleText, { color: isAdmin ? (colors.link || colors.primary) : colors.textSecondary }]}>
              {isAdmin ? 'ADMIN' : 'VIEWER'}
            </Text>
          </View>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>
            {msgTime ? new Date(msgTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>

        <View style={[
          styles.msgBubble,
          isMe
            ? { backgroundColor: colors.primary, borderColor: colors.primary }
            : { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }
        ]}>
          <Text style={[styles.msgText, { color: isMe ? '#ffffff' : colors.text }]}>
            {msgContent}
          </Text>

          {/* Tagged Log Attachment */}
          {tagged && (
            <TouchableOpacity
              style={[styles.taggedLogCard, { backgroundColor: isMe ? 'rgba(0,0,0,0.2)' : colors.surface }]}
              onPress={() => onInspectLog && onInspectLog(tagged)}
              activeOpacity={0.8}
            >
              <View style={styles.taggedHeader}>
                <Terminal size={12} color={isMe ? '#e0f2fe' : colors.primary} />
                <Text style={[styles.taggedService, { color: isMe ? '#e0f2fe' : colors.primary }]}>
                  {tagged.service || 'Log Attachment'}
                </Text>
                <View style={[styles.taggedLevel, { backgroundColor: tagged.level === 'FATAL' || tagged.level === 'ERROR' ? '#ef4444' : '#eab308' }]}>
                  <Text style={styles.taggedLevelText}>{tagged.level || 'LOG'}</Text>
                </View>
              </View>
              <Text style={[styles.taggedMessage, { color: isMe ? '#f1f5f9' : colors.textSecondary }]} numberOfLines={2}>
                {tagged.message || tagged.template || 'Chi tiết bản ghi log'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const content = (
    <KeyboardAvoidingView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: embedded ? 62 + Math.max(insets.bottom, 8) : insets.bottom,
        },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
            <MessageSquare size={18} color={colors.link || colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Kênh Trao Đổi SRE</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Trao đổi nội bộ Admin & Viewer · Real-time
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={fetchMessages} style={styles.actionBtn}>
            <RefreshCw size={17} color={colors.textSecondary} />
          </TouchableOpacity>
          {!embedded && onClose && (
            <TouchableOpacity onPress={onClose} style={styles.actionBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Message List */}
      {loading && messages.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Đang kết nối kênh chat...</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyBox}>
          <MessageSquare size={36} color={colors.textMuted} style={{ opacity: 0.4, marginBottom: 8 }} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Chưa có trao đổi nào. Hãy gửi tin nhắn đầu tiên!
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Tagged Log Preview Banner */}
      {activeTaggedLog && (
        <View style={[styles.activeTagBanner, { backgroundColor: colors.surface, borderTopColor: colors.borderSubtle }]}>
          <Paperclip size={13} color={colors.link || colors.primary} />
          <Text style={[styles.activeTagText, { color: colors.textSecondary }]} numberOfLines={1}>
            Đính kèm log: <Text style={{ fontWeight: '600', color: colors.link || colors.primary }}>{activeTaggedLog.service}</Text> - {activeTaggedLog.message || activeTaggedLog.template}
          </Text>
          <TouchableOpacity onPress={() => { setActiveTaggedLog(null); if (onClearTaggedLog) onClearTaggedLog(); }}>
            <X size={15} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Bar */}
      <View style={[styles.inputBar, { borderTopColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.inputField, { backgroundColor: colors.surfaceVariant, color: colors.text, borderColor: colors.borderSubtle }]}
          placeholder="Nhập tin nhắn trao đổi SRE..."
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: (!input.trim() && !activeTaggedLog) || sending ? colors.borderSubtle : colors.primary }
          ]}
          onPress={handleSend}
          disabled={(!input.trim() && !activeTaggedLog) || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Send size={16} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  if (embedded) return content;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    padding: 6,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  msgWrapper: {
    maxWidth: '85%',
  },
  msgWrapperMe: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  msgWrapperOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  msgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    marginRight: 6,
  },
  roleBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginRight: 6,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '800',
  },
  timeText: {
    fontSize: 10,
  },
  msgBubble: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  taggedLogCard: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  taggedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  taggedService: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  taggedLevel: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  taggedLevelText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '800',
  },
  taggedMessage: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  activeTagBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  activeTagText: {
    fontSize: 12,
    flex: 1,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  inputField: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

