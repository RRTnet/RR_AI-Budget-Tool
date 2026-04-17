import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { G } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { updateReminderSettingsApi } from '../../services/api';
import { isBiometricAvailable, getBiometricTypeName } from '../../services/biometrics';
import InputField from '../../components/ui/InputField';
import GoldButton from '../../components/ui/GoldButton';
import ErrorBanner from '../../components/ui/ErrorBanner';
import Card from '../../components/ui/Card';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, token, logout, setUser } = useAuth();

  // Biometric
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Reminders
  const [reminderEnabled, setReminderEnabled] = useState(
    user?.reminder_enabled ?? false
  );
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [reminderTime, setReminderTime] = useState(user?.reminder_time || '09:00');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [reminderChannel, setReminderChannel] = useState(user?.reminder_channel || 'whatsapp');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

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

  const handleBiometricToggle = useCallback(async (value) => {
    setBiometricEnabled(value);
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, String(value));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSaveReminders = useCallback(async () => {
    setSaving(true);
    setError('');
    setSavedSuccess(false);
    try {
      const payload = {
        reminder_enabled: reminderEnabled,
        reminder_time: reminderTime,
        timezone,
        reminder_channel: reminderChannel,
      };
      if (phoneNumber.trim()) {
        payload.phone_number = phoneNumber.trim();
      }
      await updateReminderSettingsApi(token, payload);
      setSavedSuccess(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      setError(e.message || 'Failed to save reminder settings.');
    } finally {
      setSaving(false);
    }
  }, [token, reminderEnabled, phoneNumber, reminderTime, timezone, reminderChannel]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Rolling Revenue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await logout();
          },
        },
      ]
    );
  }, [logout]);

  const currencySymbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹', AUD: 'A$' };
  const currencyDisplay = user?.currency
    ? `${user.currency} (${currencySymbols[user.currency] || user.currency})`
    : 'USD ($)';

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {error ? <ErrorBanner message={error} onDismiss={() => setError('')} /> : null}

        {savedSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ Settings saved successfully</Text>
          </View>
        )}

        {/* Account Section */}
        <SectionHeader title="Account" />
        <Card style={styles.section}>
          <View style={styles.infoRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoName}>{user?.name || 'User'}</Text>
              <Text style={styles.infoEmail}>{user?.email || ''}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoDetail}>
            <Feather name="dollar-sign" size={16} color={G.textSoft} />
            <Text style={styles.infoDetailLabel}>Currency</Text>
            <Text style={styles.infoDetailValue}>{currencyDisplay}</Text>
          </View>
          {user?.phone_number && (
            <View style={styles.infoDetail}>
              <Feather name="phone" size={16} color={G.textSoft} />
              <Text style={styles.infoDetailLabel}>Phone</Text>
              <Text style={styles.infoDetailValue}>{user.phone_number}</Text>
            </View>
          )}
        </Card>

        {/* Biometrics Section */}
        <SectionHeader title="Security" />
        <Card style={styles.section}>
          {biometricAvailable ? (
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <View style={styles.switchTitleRow}>
                  <Feather
                    name={biometricType === 'Face ID' ? 'eye' : 'airplay'}
                    size={18}
                    color={G.gold}
                    style={styles.switchIcon}
                  />
                  <Text style={styles.switchLabel}>
                    {biometricType} Login
                  </Text>
                </View>
                <Text style={styles.switchHint}>
                  {biometricEnabled
                    ? `${biometricType} is enabled for quick sign-in`
                    : `Enable ${biometricType} for faster, secure access`}
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: G.border, true: G.goldFade }}
                thumbColor={biometricEnabled ? G.gold : G.muted}
                ios_backgroundColor={G.border}
              />
            </View>
          ) : (
            <View style={styles.biometricUnavail}>
              <Feather name="lock" size={20} color={G.muted} />
              <Text style={styles.biometricUnavailText}>
                Biometric authentication is not available on this device.
              </Text>
            </View>
          )}
        </Card>

        {/* Daily Reminders Section */}
        <SectionHeader title="Daily Reminders" />
        <Card style={styles.section}>
          {/* Enable toggle */}
          <View style={[styles.switchRow, styles.switchRowNoBorder]}>
            <View style={styles.switchLeft}>
              <Text style={styles.switchLabel}>Enable Reminders</Text>
              <Text style={styles.switchHint}>Daily financial check-in notifications</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: G.border, true: G.goldFade }}
              thumbColor={reminderEnabled ? G.gold : G.muted}
              ios_backgroundColor={G.border}
            />
          </View>

          {reminderEnabled && (
            <>
              <View style={styles.divider} />
              <InputField
                label="Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+1 234 567 8900"
                keyboardType="phone-pad"
                style={styles.reminderField}
              />
              <InputField
                label="Reminder Time (HH:MM)"
                value={reminderTime}
                onChangeText={setReminderTime}
                placeholder="09:00"
                keyboardType="numbers-and-punctuation"
                style={styles.reminderField}
              />
              <InputField
                label="Timezone"
                value={timezone}
                onChangeText={setTimezone}
                placeholder="America/New_York"
                style={styles.reminderField}
              />

              <Text style={styles.fieldLabel}>Reminder Channel</Text>
              <View style={styles.channelRow}>
                {[
                  { key: 'whatsapp', label: '📱 WhatsApp' },
                  { key: 'sms', label: '💬 SMS' },
                ].map((ch) => (
                  <TouchableOpacity
                    key={ch.key}
                    style={[
                      styles.channelChip,
                      reminderChannel === ch.key && styles.channelChipActive,
                    ]}
                    onPress={() => setReminderChannel(ch.key)}
                  >
                    <Text
                      style={[
                        styles.channelChipText,
                        reminderChannel === ch.key && styles.channelChipTextActive,
                      ]}
                    >
                      {ch.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <GoldButton
            title="Save Reminder Settings"
            onPress={handleSaveReminders}
            loading={saving}
            disabled={saving}
            style={styles.saveBtn}
          />
        </Card>

        {/* App Info */}
        <SectionHeader title="App" />
        <Card style={styles.section}>
          <View style={styles.appInfoRow}>
            <Text style={styles.appInfoLabel}>Version</Text>
            <Text style={styles.appInfoValue}>2.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.appInfoRow}>
            <Text style={styles.appInfoLabel}>AI Model</Text>
            <Text style={styles.appInfoValue}>gpt-oss:120b</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.appInfoRow}>
            <Text style={styles.appInfoLabel}>Platform</Text>
            <Text style={styles.appInfoValue}>DGX Spark</Text>
          </View>
        </Card>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color={G.red} style={styles.signOutIcon} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: G.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: G.text,
  },
  container: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 12,
    color: G.textSoft,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 4,
  },
  section: {
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: G.goldFade,
    borderWidth: 2,
    borderColor: G.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: G.gold,
  },
  infoText: {
    flex: 1,
  },
  infoName: {
    fontSize: 17,
    fontWeight: '700',
    color: G.text,
    marginBottom: 3,
  },
  infoEmail: {
    fontSize: 13,
    color: G.textSoft,
  },
  divider: {
    height: 1,
    backgroundColor: G.border,
    marginVertical: 12,
  },
  infoDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoDetailLabel: {
    flex: 1,
    fontSize: 14,
    color: G.textSoft,
  },
  infoDetailValue: {
    fontSize: 14,
    color: G.text,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  switchRowNoBorder: {
    borderBottomWidth: 0,
  },
  switchLeft: {
    flex: 1,
    marginRight: 12,
  },
  switchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  switchIcon: {
    marginRight: 6,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: G.text,
  },
  switchHint: {
    fontSize: 12,
    color: G.textSoft,
    lineHeight: 16,
  },
  biometricUnavail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  biometricUnavailText: {
    flex: 1,
    fontSize: 13,
    color: G.muted,
    lineHeight: 18,
  },
  reminderField: {
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 12,
    color: G.textSoft,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  channelChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: G.border,
    backgroundColor: G.surface,
    alignItems: 'center',
  },
  channelChipActive: {
    borderColor: G.gold,
    backgroundColor: G.goldFade,
  },
  channelChipText: {
    fontSize: 13,
    color: G.textSoft,
    fontWeight: '500',
  },
  channelChipTextActive: {
    color: G.goldSoft,
    fontWeight: '700',
  },
  saveBtn: {
    marginTop: 4,
  },
  appInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  appInfoLabel: {
    fontSize: 14,
    color: G.textSoft,
  },
  appInfoValue: {
    fontSize: 14,
    color: G.text,
    fontWeight: '600',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    borderWidth: 1,
    borderColor: G.red,
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: 'rgba(239,68,68,0.08)',
    gap: 8,
  },
  signOutIcon: {
    marginRight: 2,
  },
  signOutText: {
    color: G.red,
    fontSize: 15,
    fontWeight: '700',
  },
  successBanner: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: G.green,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  successText: {
    color: G.green,
    fontSize: 13,
    fontWeight: '600',
  },
});
