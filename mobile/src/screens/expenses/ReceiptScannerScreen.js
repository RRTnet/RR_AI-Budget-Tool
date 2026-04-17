import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { G } from '../../constants/colors';

export default function ReceiptScannerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: G.bg }]}>
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { paddingTop: insets.top }]}>
        <Feather name="camera-off" size={52} color={G.textSoft} style={styles.permIcon} />
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permText}>
          Rolling Revenue needs camera access to scan receipts for automatic expense entry.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Camera Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelLink}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelLinkText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {/* Dark overlay */}
      <View style={styles.overlay}>
        {/* Top dark area */}
        <View style={styles.overlayTop} />

        {/* Middle row: dark | viewfinder | dark */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          {/* Viewfinder */}
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>

        {/* Bottom dark area */}
        <View style={styles.overlayBottom}>
          <Text style={styles.phaseText}>
            📸 Receipt scanning with AI coming in Phase 3
          </Text>
          <Text style={styles.hintText}>
            Position your receipt within the frame
          </Text>
          <TouchableOpacity
            style={[styles.closeBtn, { marginBottom: insets.bottom + 20 }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Feather name="x" size={20} color="#000" style={styles.closeBtnIcon} />
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const VIEWFINDER_SIZE = 280;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: G.textSoft,
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: G.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permIcon: {
    marginBottom: 20,
  },
  permTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: G.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  permText: {
    fontSize: 14,
    color: G.textSoft,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  permBtn: {
    backgroundColor: G.gold,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  permBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelLink: {
    padding: 8,
  },
  cancelLinkText: {
    color: G.textSoft,
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: VIEWFINDER_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: G.gold,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  overlayBottom: {
    flex: 1.5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  phaseText: {
    color: G.goldSoft,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  hintText: {
    color: G.textSoft,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 32,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: G.gold,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  closeBtnIcon: {
    marginRight: 6,
  },
  closeBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
});
