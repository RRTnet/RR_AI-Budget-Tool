import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
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
      // Store token securely for biometric login
      if (biometricAvailable) {
        const tkn = await getToken();
        if (tkn) {
          await SecureStore.setItemAsync(SECURE_TOKEN_KEY, tkn);
        }
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
        // Validate token is still valid
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
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.logoEmoji}>💰</Text>
          <Text style={styles.logoTitle}>Rolling Revenue</Text>
          <Text style={styles.logoSubtitle}>Your Money Tool</Text>
        </View>

        {/* Error */}
        {error ? <ErrorBanner message={error} onDismiss={() => setError('')} /> : null}

        {/* Form */}
        <View style={styles.form}>
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

          <GoldButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.signInBtn}
          />

          {/* Biometric Login */}
          {biometricAvailable && biometricEnabled && (
            <TouchableOpacity
              style={styles.biometricBtn}
              onPress={handleBiometricLogin}
              activeOpacity={0.7}
            >
              <Feather
                name={biometricType === 'Face ID' ? 'eye' : 'airplay'}
                size={20}
                color={G.gold}
                style={styles.biometricIcon}
              />
              <Text style={styles.biometricText}>
                Sign in with {biometricType}
              </Text>
            </TouchableOpacity>
          )}

          {/* Register link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          AI advisor powered by qwen3:30b on DGX Spark
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: G.bg,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: G.gold,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  logoSubtitle: {
    fontSize: 14,
    color: G.textSoft,
    letterSpacing: 0.3,
  },
  form: {
    width: '100%',
  },
  signInBtn: {
    marginTop: 8,
    marginBottom: 16,
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: G.gold,
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 20,
    backgroundColor: G.goldFade,
  },
  biometricIcon: {
    marginRight: 8,
  },
  biometricText: {
    color: G.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  registerText: {
    color: G.textSoft,
    fontSize: 14,
  },
  registerLink: {
    color: G.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: G.muted,
    fontSize: 11,
    marginTop: 40,
    letterSpacing: 0.2,
  },
});
