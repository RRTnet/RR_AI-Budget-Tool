import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { G } from '../constants/colors';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';

const darkTheme = {
  dark: true,
  colors: {
    primary: G.gold,
    background: G.bg,
    card: G.surface,
    text: G.text,
    border: G.border,
    notification: G.gold,
  },
};

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingLogo}>💰</Text>
      <Text style={styles.loadingTitle}>Rolling Revenue</Text>
      <ActivityIndicator
        size="large"
        color={G.gold}
        style={styles.spinner}
      />
    </View>
  );
}

export default function RootNavigator() {
  const auth = useAuth();

  if (auth.loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={darkTheme}>
      {auth.token ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: G.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    fontSize: 48,
    marginBottom: 12,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: G.gold,
    letterSpacing: 0.5,
    marginBottom: 32,
  },
  spinner: {
    marginTop: 8,
  },
});
