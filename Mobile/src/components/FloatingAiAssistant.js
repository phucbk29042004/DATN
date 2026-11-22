import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Terminal, X, Send, Activity, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

export default function FloatingAiAssistant() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { currentUser } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Xin chào ${currentUser?.displayName || 'bạn'}! Tôi là Trợ Lý AI của LogPulse. Tôi có thể giúp bạn giải đáp số liệu KPI, phân tích nguyên nhân sự cố log và hướng dẫn xử lý.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage({
          uri: asset.uri,
          base64: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null,
        });
      }
    } catch (err) {
      console.warn('Lỗi chọn ảnh:', err);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || loading) return;
    const userQuery = input.trim() || 'Hãy phân tích hình ảnh lỗi hệ thống này giúp tôi.';
    const imgBase64 = selectedImage?.base64 || null;
    const imgUri = selectedImage?.uri || null;
    setSelectedImage(null);
    setInput('');

    const newMsgs = [...messages, { id: Date.now().toString(), role: 'user', text: userQuery, imageUri: imgUri }];
    setMessages(newMsgs);
    setLoading(true);

    try {
      const res = await apiClient('/api/v1/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: userQuery }],
          image: imgBase64,
          systemContext: `Người dùng: ${currentUser?.displayName || 'Ẩn danh'} (${currentUser?.role || 'viewer'})`,
        }),
      });

      const cleanAnswer = (res.reply || res.answer || 'Không thể lấy phản hồi từ AI')
        .replace(/[*#]/g, '') // Lọc sạch markdown hoa thị theo quy chuẩn dự án
        .trim();

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', text: cleanAnswer },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: `Lỗi kết nối Trợ lý AI: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Bubble */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setIsOpen(true)}
        style={[
          styles.floatingBubble,
          {
            backgroundColor: colors.primary,
            bottom: 84 + Math.max(insets.bottom, 8),
            shadowColor: colors.primary,
          },
        ]}
      >
        <Terminal size={20} color="#ffffff" />
      </TouchableOpacity>

      {/* AI Assistant Modal */}
      <Modal visible={isOpen} animationType="slide" transparent onRequestClose={() => setIsOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.drawerContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.drawerHeader, { borderBottomColor: colors.borderSubtle }]}>
              <View style={styles.headerTitleRow}>
                <View style={[styles.aiBadge, { backgroundColor: colors.primaryLight }]}>
                  <Terminal size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>Trợ Lý Vận Hành Hệ Thống</Text>
                  <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                    Quyền hạn: {currentUser?.role === 'admin' ? 'Quản Trị Viên' : 'Giám Sát Viên'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Chat Messages */}
            <ScrollView style={styles.messagesContainer} contentContainerStyle={{ paddingVertical: 12 }}>
              {messages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.messageBubble,
                    m.role === 'user'
                      ? [styles.userBubble, { backgroundColor: colors.primary }]
                      : [styles.assistantBubble, { backgroundColor: colors.surfaceVariant, borderColor: colors.borderSubtle }],
                  ]}
                >
                  {m.imageUri && (
                    <Image source={{ uri: m.imageUri }} style={styles.msgImage} resizeMode="cover" />
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      { color: m.role === 'user' ? '#ffffff' : colors.text },
                    ]}
                  >
                    {m.text}
                  </Text>
                </View>
              ))}
              {loading && (
                <View style={[styles.loadingBox, { backgroundColor: colors.surfaceVariant }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    AI đang suy nghĩ và tra cứu dữ liệu...
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Image Preview Row if selected */}
            {selectedImage && (
              <View style={[styles.imagePreviewRow, { backgroundColor: colors.surfaceVariant, borderTopColor: colors.borderSubtle }]}>
                <Image source={{ uri: selectedImage.uri }} style={styles.imageThumb} />
                <Text style={[styles.imagePreviewText, { color: colors.textSecondary }]}>Đã đính kèm ảnh để AI phân tích</Text>
                <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeImageBtn}>
                  <X size={15} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            {/* Input Bar */}
            <View style={[styles.inputRow, { borderTopColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
              <TouchableOpacity
                onPress={pickImage}
                style={[
                  styles.pickImageBtn,
                  {
                    backgroundColor: selectedImage ? 'rgba(6, 182, 212, 0.15)' : colors.surfaceVariant,
                    borderColor: selectedImage ? colors.primary : colors.border,
                  },
                ]}
              >
                <ImageIcon size={18} color={selectedImage ? colors.primary : colors.textMuted} />
              </TouchableOpacity>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder={selectedImage ? "Nhập câu hỏi kèm ảnh..." : "Hỏi AI về log, sự cố, chỉ số KPI..."}
                placeholderTextColor={colors.textMuted}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={(!input.trim() && !selectedImage) || loading}
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: (input.trim() || selectedImage) && !loading ? colors.primary : colors.surfaceVariant,
                  },
                ]}
              >
                <Send size={18} color={(input.trim() || selectedImage) && !loading ? '#ffffff' : colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingBubble: {
    position: 'absolute',
    right: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 12.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 13.5,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickImageBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: 8,
  },
  imagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 10,
  },
  imageThumb: {
    width: 34,
    height: 34,
    borderRadius: 6,
  },
  imagePreviewText: {
    fontSize: 12,
    flex: 1,
  },
  removeImageBtn: {
    padding: 4,
  },
});

