import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { G } from '../../constants/colors';

export default function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
  numberOfLines,
  style,
  inputStyle,
  editable = true,
  autoCapitalize = 'none',
  autoCorrect = false,
  returnKeyType,
  onSubmitEditing,
  maxLength,
  prefix,           // e.g. "$" or "€" — shown as gold text before the input
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[
        styles.inputRow,
        focused && styles.inputRowFocused,
        !editable && styles.disabled,
      ]}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          style={[
            styles.input,
            multiline && styles.multiline,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={G.textSoft}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType || 'default'}
          multiline={multiline}
          numberOfLines={multiline ? (numberOfLines || 3) : 1}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          maxLength={maxLength}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    color: G.textSoft,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: G.card,
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  inputRowFocused: {
    borderColor: G.gold,
  },
  prefix: {
    color: G.gold,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: G.text,
    fontSize: 15,
  },
  multiline: {
    minHeight: 80,
    paddingTop: 12,
  },
  disabled: {
    opacity: 0.6,
  },
});
