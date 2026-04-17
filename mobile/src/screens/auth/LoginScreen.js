import React, { useState, useEffect, useCallback } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { G } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { isBiometricAvailable, authenticateWithBiometrics, getBiometricTypeName } from '../../services/biometrics';
import { getToken, setToken } from '../../services/auth';
import { getMeApi } from '../../services/api';
import GoldButton from '../../components/ui/GoldButton';
import InputField from '../../components/ui/InputField';
import ErrorBanner from '../../components/ui/ErrorBanner';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const SECURE_TOKEN_KEY = 'wt_secure_token';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login, loadUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    async function checkBiometric() {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      if (available) {
        const typeName = await getBiometricTypeName();
        setBiometricType(typeName);
        const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
        setBiometricEnabled(enabled === 'true');
      }
    }
    checkBiometric();
  }, []);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      if (biometricAvailable) {
        const tkn = await getToken();
        if (tkn) await SecureStore.setItemAsync(SECURE_TOKEN_KEY, tkn);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError(e.message || 'Login failed. Check your credentials.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [email, password, login, biometricAvailable]);

  const handleBiometricLogin = useCallback(async () => {
    try {
      const result = await authenticateWithBiometrics(`Use ${biometricType} to sign in`);
      if (result.success) {
        const secureToken = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
        if (!secureToken) {
          setError('No stored credentials. Please sign in with your password first.');
          return;
        }
        await getMeApi(secureToken);
        await setToken(secureToken);
        await loadUser(secureToken);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (result.error && result.error !== 'UserCancel' && result.error !== 'SystemCancel') {
        setError(`${biometricType} authentication failed.`);
      }
    } catch (e) {
      setError(`${biometricType} error: ${e.message}`);
    }
  }, [biometricType, loadUser]);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Decorative background glow */}
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo section */}
        <View style={styles.logoSection}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>💰</Text>
          </View>
          <Text style={styles.logoTitle}>Rolling Revenue</Text>
          <Text style={styles.logoSubtitle}>Your Money Tool</Text>
        </View>

        {/* Error */}
        {error ? <ErrorBanner message={error} onDismiss={() => setError('')} /> : null}

        {/* Form card */}
        <View style={styles.formCard}>
          <Text style={styles.formHeading}>Welcome back</Text>
          <Text style={styles.formSubheading}>Sign in to your account</Text>

          <View style={styles.fieldGap}>
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
              placeholder="Your password"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          <GoldButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.signInBtn}
          />

          {biometricAvailable && biometricEnabled && (
            <TouchableOpacity
              style={styles.biometricBtn}
              onPress={handleBiometricLogin}
              activeOpacity={0.7}
            >
              <View style={styles.biometricIconWrap}>
                <Feather
                  name={biometricType === 'Face ID' ? 'eye' : 'airplay'}
                  size={18}
                  color={G.gold}
                />
              </View>
              <Text style={styles.biometricText}>Sign in with {biometricType}</Text>
              <Feather name="chevron-right" size={16} color={G.muted} />
            </TouchableOpacity>
          )}

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>New here?</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={styles.registerBtnText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <View style={styles.footerDot} />
          <Text style={styles.footer}>AI advisor · gpt-oss:120b · DGX Spark</Text>
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
    top: -60,
    left: '50%',
    marginLeft: -120,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(201,168,76,0.06)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: 40,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(59,130,246,0.04)',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: G.card,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: G.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  logoEmoji: {
    fontSize: 36,
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: G.gold,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  logoSubtitle: {
    fontSize: 13,
    color: G.textSoft,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Form card
  formCard: {
    backgroundColor: G.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: G.border,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  formHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: G.text,
    marginBottom: 4,
  },
  formSubheading: {
    fontSize: 13,
    color: G.textSoft,
    marginBottom: 20,
  },
  fieldGap: {
    gap: 4,
  },
  signInBtn: {
    marginTop: 20,
    marginBottom: 12,
  },

  // Biometric
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: G.goldFade,
    marginBottom: 4,
  },
  biometricIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(201,168,76,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  biometricText: {
    flex: 1,
    color: G.goldSoft,
    fontSize: 14,
    fontWeight: '600',
  },

  // Divider
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

  // Register
  registerBtn: {
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: G.surface,
  },
  registerBtnText: {
    color: G.text,
    fontSize: 14,
    fontWeight: '600',
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    gap: 6,
  },
  footerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: G.gold,
    opacity: 0.5,
  },
  footer: {
    textAlign: 'center',
    color: G.muted,
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
