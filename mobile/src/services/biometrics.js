import * as LocalAuthentication from 'expo-local-authentication';

export async function isBiometricAvailable() {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (e) {
    console.error('isBiometricAvailable error:', e);
    return false;
  }
}

export async function authenticateWithBiometrics(promptMessage = 'Authenticate to access Rolling Revenue') {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result;
  } catch (e) {
    console.error('authenticateWithBiometrics error:', e);
    return { success: false, error: e.message };
  }
}

export async function getBiometricTypeName() {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris Scan';
    }
    return 'Biometric';
  } catch (e) {
    return 'Biometric';
  }
}
