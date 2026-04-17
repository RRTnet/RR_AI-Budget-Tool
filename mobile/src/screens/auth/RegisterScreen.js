import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { G } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { registerApi } from '../../services/api';
import { setToken } from '../../services/auth';
import { getMeApi } from '../../services/api';
import GoldButton from '../../components/ui/GoldButton';
import InputField from '../../components/ui/InputField';
import ErrorBanner from '../../components/ui/ErrorBanner';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD'];
const COUNTRY_CODES = [
  { code: '+1', flag: '🇺🇸', label: 'US' },
  { code: '+44', flag: '🇬🇧', label: 'UK' },
  { code: '+91', flag: '🇮🇳', label: 'IN' },
  { code: '+61', flag: '🇦🇺', label: 'AU' },
];

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [countryCode, setCountryCode] = useState('+1');
  const [phone, setPhone] = useState('');
  const [reminderChannel, setReminderChannel] = useState('whatsapp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = useCallback(async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Name, email, and password are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const phoneNumber = phone.trim() ? `${countryCode}${phone.trim()}` : undefined;
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        currency,
        reminder_time: '09:00',
        timezone: 'UTC',
        reminder_channel: reminderChannel,
      };
      if (phoneNumber) {
        payload.phone_number = phoneNumber;
      }

      await registerApi(payload);
      // Auto-login after register
      await login(email.trim().toLowerCase(), password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError(e.message || 'Registration failed. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [name, email, password, currency, countryCode, phone, reminderChannel, login]);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Decorative background glow */}
      <View style={styles.glowTop} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>💎</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start tracking your wealth today</Text>
        </View>

        {error ? <ErrorBanner message={error} onDismiss={() => setError('')} /> : null}

        <View style={styles.formCard}>
          <InputField
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            autoCapitalize="words"
            returnKeyType="next"
          />

          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <InputField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Min 6 characters"
            secureTextEntry
            returnKeyType="next"
          />

          {/* Currency Picker */}
          <Text style={styles.sectionLabel}>Currency</Text>
          <View style={styles.chipRow}>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, currency === c && styles.chipActive]}
                onPress={() => setCurrency(c)}
              >
                <Text style={[styles.chipText, currency === c && styles.chipTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Phone with country code */}
          <Text style={styles.sectionLabel}>Phone (optional)</Text>
          <View style={styles.phoneRow}>
            <View style={styles.countryCodeRow}>
              {COUNTRY_CODES.map((cc) => (
                <TouchableOpacity
                  key={cc.code}
                  style={[styles.ccChip, countryCode === cc.code && styles.ccChipActive]}
                  onPress={() => setCountryCode(cc.code)}
                >
                  <Text style={styles.ccFlag}>{cc.flag}</Text>
                  <Text style={[styles.ccLabel, countryCode === cc.code && styles.ccLabelActive]}>
                    {cc.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <InputField
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              keyboardType="phone-pad"
              style={styles.phoneInput}
            />
          </View>

          {/* Reminder Channel */}
          <Text style={styles.sectionLabel}>Reminder Channel</Text>
          <View style={styles.chipRow}>
            {[
              { key: 'whatsapp', label: '📱 WhatsApp' },
              { key: 'sms', label: '💬 SMS' },
            ].map((ch) => (
              <TouchableOpacity
                key={ch.key}
                style={[styles.chip, styles.chipWide, reminderChannel === ch.key && styles.chipActive]}
                onPress={() => setReminderChannel(ch.key)}
              >
                <Text style={[styles.chipText, reminderChannel === ch.key && styles.chipTextActive]}>
                  {ch.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <GoldButton
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.submitBtn}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Have an account?</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.loginBtnText}>Sign In Instead</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: G.bg,
  },
  glowTop: {
    position: 'absolute',
    top: -40,
    left: '50%',
    marginLeft: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(201,168,76,0.05)',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: G.card,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: G.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  logoEmoji: {
    fontSize: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: G.gold,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: G.textSoft,
    letterSpacing: 0.3,
  },
  formCard: {
    backgroundColor: G.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: G.border,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 7,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    color: G.textSoft,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: G.border,
    backgroundColor: G.card,
  },
  chipWide: {
    paddingHorizontal: 18,
  },
  chipActive: {
    borderColor: G.gold,
    backgroundColor: G.goldFade,
  },
  chipText: {
    color: G.textSoft,
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: G.goldSoft,
    fontWeight: '700',
  },
  phoneRow: {
    marginBottom: 16,
  },
  countryCodeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  ccChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: G.border,
    backgroundColor: G.card,
  },
  ccChipActive: {
    borderColor: G.gold,
    backgroundColor: G.goldFade,
  },
  ccFlag: {
    fontSize: 14,
    marginRight: 4,
  },
  ccLabel: {
    fontSize: 12,
    color: G.textSoft,
    fontWeight: '500',
  },
  ccLabelActive: {
    color: G.goldSoft,
    fontWeight: '700',
  },
  phoneInput: {
    marginBottom: 0,
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 0,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: G.border,
  },
  dividerText: {
    fontSize: 12,
    color: G.muted,
    fontWeight: '500',
  },
  loginBtn: {
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: G.surface,
  },
  loginBtnText: {
    color: G.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
