import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { G } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { streamAdvisorResponse } from '../../services/stream';
import ErrorBanner from '../../components/ui/ErrorBanner';
import GoldButton from '../../components/ui/GoldButton';

const QUICK_QUESTIONS = [
  'Analyze my spending',
  'Am I saving enough?',
  'Tips to reduce expenses',
  'Goal progress update',
];

export default function AdvisorScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState('');
  const [modelInfo, setModelInfo] = useState(null);
  const [inputFocused, setInputFocused] = useState(false);

  const scrollViewRef = useRef(null);
  const abortControllerRef = useRef(null);
  const cursorAnim = useRef(new Animated.Value(1)).current;
  const cursorAnimRef = useRef(null);

  // Blinking cursor animation
  useEffect(() => {
    if (isStreaming) {
      cursorAnimRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(cursorAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      cursorAnimRef.current.start();
    } else {
      if (cursorAnimRef.current) {
        cursorAnimRef.current.stop();
      }
      cursorAnim.setValue(1);
    }
    return () => {
      if (cursorAnimRef.current) {
        cursorAnimRef.current.stop();
      }
    };
  }, [isStreaming]);

  // Auto-scroll as response grows
  useEffect(() => {
    if (response && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [response]);

  const handleAsk = useCallback(async (customQuestion) => {
    const q = customQuestion || question.trim();
    if (isLoading || isStreaming) return;

    setError('');
    setResponse('');
    setModelInfo(null);
    setIsDone(false);
    setIsLoading(true);

    // Create new AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 120 second timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 120000);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await streamAdvisorResponse(
        q,
        token,
        // onToken
        (tokenText) => {
          setIsLoading(false);
          setIsStreaming(true);
          setResponse((prev) => prev + tokenText);
        },
        // onDone
        (info) => {
          setIsStreaming(false);
          setIsDone(true);
          setModelInfo(info);
          clearTimeout(timeoutId);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        // onError
        (err) => {
          setIsLoading(false);
          setIsStreaming(false);
          setError(err.message || 'AI advisor encountered an error.');
          clearTimeout(timeoutId);
        },
        controller.signal
      );
    } catch (e) {
      setIsLoading(false);
      setIsStreaming(false);
      setError(e.message || 'Failed to connect to AI advisor.');
      clearTimeout(timeoutId);
    }
  }, [question, token, isLoading, isStreaming]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setIsLoading(false);
    }
  }, []);

  const handleQuickQuestion = useCallback((q) => {
    setQuestion(q);
    handleAsk(q);
  }, [handleAsk]);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>💎</Text>
          <View>
            <Text style={styles.headerTitle}>AI Financial Advisor</Text>
            <Text style={styles.headerSub}>Powered by qwen3:30b on DGX Spark</Text>
          </View>
        </View>
        {modelInfo && (
          <View style={styles.modelBadge}>
            <Text style={styles.modelBadgeText}>{modelInfo.model}</Text>
          </View>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Quick question chips */}
        <View style={styles.quickSection}>
          <Text style={styles.quickLabel}>Quick questions</Text>
          <View style={styles.quickChips}>
            {QUICK_QUESTIONS.map((q) => (
              <TouchableOpacity
                key={q}
                style={[styles.quickChip, (isLoading || isStreaming) && styles.chipDisabled]}
                onPress={() => handleQuickQuestion(q)}
                disabled={isLoading || isStreaming}
                activeOpacity={0.7}
              >
                <Text style={styles.quickChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Error */}
        {error ? <ErrorBanner message={error} onDismiss={() => setError('')} /> : null}

        {/* Response area */}
        {(isLoading || isStreaming || response || isDone) ? (
          <View style={styles.responseContainer}>
            <View style={styles.responseHeader}>
              <Text style={styles.responseHeaderText}>💡 AI Response</Text>
              {(isLoading || isStreaming) && (
                <TouchableOpacity onPress={handleStop} style={styles.stopBtn}>
                  <Text style={styles.stopBtnText}>Stop</Text>
                </TouchableOpacity>
              )}
            </View>

            {isLoading && !isStreaming && (
              <View style={styles.connectingRow}>
                <View style={styles.loadingDots}>
                  <Text style={styles.connectingText}>Connecting to AI advisor</Text>
                  <Text style={styles.dotsText}>...</Text>
                </View>
              </View>
            )}

            {(isStreaming || response) && (
              <View style={styles.textRow}>
                <Text style={styles.responseText}>{response}</Text>
                {isStreaming && (
                  <Animated.Text style={[styles.cursor, { opacity: cursorAnim }]}>
                    |
                  </Animated.Text>
                )}
              </View>
            )}

            {isDone && modelInfo && (
              <View style={styles.doneRow}>
                <View style={styles.doneBadge}>
                  <Text style={styles.doneBadgeText}>✓ {modelInfo.model}</Text>
                </View>
                {modelInfo.tokens > 0 && (
                  <View style={styles.tokenBadge}>
                    <Text style={styles.tokenBadgeText}>{modelInfo.tokens} tokens</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderEmoji}>🤖</Text>
            <Text style={styles.placeholderTitle}>Ask your AI advisor</Text>
            <Text style={styles.placeholderText}>
              Get personalized financial insights based on your spending patterns, income, and savings goals.
            </Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Input area */}
      <View style={[styles.inputArea, { paddingBottom: insets.bottom + 12 }]}>
        <TextInput
          style={[styles.textInput, inputFocused && styles.textInputFocused]}
          value={question}
          onChangeText={setQuestion}
          placeholder="Ask about your finances..."
          placeholderTextColor={G.textSoft}
          multiline
          maxLength={500}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          editable={!isLoading && !isStreaming}
        />
        <GoldButton
          title={isStreaming ? 'Streaming...' : isLoading ? 'Loading...' : 'Ask Advisor'}
          onPress={() => handleAsk()}
          loading={false}
          disabled={isLoading || isStreaming || !question.trim()}
          style={styles.askBtn}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: G.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: G.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: G.text,
  },
  headerSub: {
    fontSize: 11,
    color: G.textSoft,
    marginTop: 1,
  },
  modelBadge: {
    backgroundColor: G.goldFade,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: G.gold,
  },
  modelBadgeText: {
    fontSize: 11,
    color: G.gold,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  quickSection: {
    marginBottom: 20,
  },
  quickLabel: {
    fontSize: 12,
    color: G.textSoft,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  quickChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: G.border,
    backgroundColor: G.card,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  quickChipText: {
    fontSize: 13,
    color: G.textSoft,
    fontWeight: '500',
  },
  responseContainer: {
    backgroundColor: G.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: G.border,
    padding: 16,
    marginBottom: 16,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  responseHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: G.gold,
  },
  stopBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: G.red,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  stopBtnText: {
    color: G.red,
    fontSize: 12,
    fontWeight: '600',
  },
  connectingRow: {
    paddingVertical: 8,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectingText: {
    color: G.textSoft,
    fontSize: 14,
    fontStyle: 'italic',
  },
  dotsText: {
    color: G.gold,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 2,
  },
  textRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  responseText: {
    fontSize: 15,
    color: G.text,
    lineHeight: 24,
    flexShrink: 1,
  },
  cursor: {
    fontSize: 18,
    color: G.gold,
    fontWeight: '300',
    lineHeight: 24,
  },
  doneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: G.border,
  },
  doneBadge: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: G.green,
  },
  doneBadgeText: {
    fontSize: 11,
    color: G.green,
    fontWeight: '700',
  },
  tokenBadge: {
    backgroundColor: G.goldFade,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: G.gold,
  },
  tokenBadgeText: {
    fontSize: 11,
    color: G.gold,
    fontWeight: '700',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  placeholderEmoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: G.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: G.textSoft,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: G.border,
    backgroundColor: G.surface,
    gap: 10,
  },
  textInput: {
    backgroundColor: G.card,
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: G.text,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  textInputFocused: {
    borderColor: G.gold,
  },
  askBtn: {
    marginBottom: 0,
  },
});
