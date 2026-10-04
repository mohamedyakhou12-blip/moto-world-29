// ============================================================
//  مكونات مشتركة
// ============================================================

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Pressable, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

// الألوان
export const COLORS = {
  bg: '#0a0a0a',
  card: '#171717',
  cardAlt: '#1f1f1f',
  border: '#262626',
  borderLight: '#404040',
  text: '#ffffff',
  textMuted: '#a3a3a3',
  textDim: '#737373',
  red: '#dc2626',
  redDark: '#7f1d1d',
  redLight: '#fca5a5',
  amber: '#f59e0b',
  amberDark: '#78350f',
  emerald: '#10b981',
  emeraldDark: '#064e3b',
  sky: '#0ea5e9',
  skyDark: '#0c4a6e',
}

export const SIZES = {
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
}

// بطاقة
export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>
}

// عنوان صفحة
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <View style={styles.pageHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  )
}

// زر
export function Button({
  title,
  onPress,
  color = COLORS.red,
  textColor = '#fff',
  size = 'md',
  icon,
  outline = false,
  disabled = false,
  style,
}: {
  title: string
  onPress?: () => void
  color?: string
  textColor?: string
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  outline?: boolean
  disabled?: boolean
  style?: any
}) {
  const padding = size === 'sm' ? 8 : size === 'lg' ? 16 : 12
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 14
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { paddingVertical: padding, paddingHorizontal: padding + 4 },
        outline ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: color } : { backgroundColor: color },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon as any} size={16} color={outline ? color : textColor} style={{ marginRight: 6 }} /> : null}
      <Text style={{ color: outline ? color : textColor, fontSize, fontWeight: '700' }}>{title}</Text>
    </TouchableOpacity>
  )
}

// حقل إدخال
export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  style,
}: {
  label?: string
  value: string
  onChangeText: (t: string) => void
  placeholder?: string
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'phone-pad'
  multiline?: boolean
  style?: any
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textDim}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && { minHeight: 80, textAlignVertical: 'top' }, style]}
      />
    </View>
  )
}

// شارة
export function Badge({ children, color = COLORS.textMuted, bg = 'transparent' }: { children: React.ReactNode; color?: string; bg?: string }) {
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: bg }]}>
      <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{children}</Text>
    </View>
  )
}

// Modal
export function ModalView({ visible, onClose, title, children, footer }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Ionicons name="close" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }}>{children}</ScrollView>
          {footer ? <View style={styles.modalFooter}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '900',
  },
  pageSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    color: COLORS.text,
    padding: 12,
    fontSize: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  modalClose: {
    padding: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
})
