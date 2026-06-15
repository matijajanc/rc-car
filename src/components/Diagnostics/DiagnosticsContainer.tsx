import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Orientation from 'react-native-orientation-locker';
import { EventRegister } from 'react-native-event-listeners';
import ScreenHeader from '../Common/ScreenHeader/ScreenHeader';
import { colors, spacing, radius, fontSize, fontWeight, screenPad } from '../../config/styles/theme';
import { DIAG_EVENT, clearEvents, getEvents } from '../../utils/diagnostics';
import type { DiagEvent } from '../../utils/diagnostics';
import type { WsStatus } from '../../utils/websocket';

const STATUS_COLOR: Record<WsStatus, string> = {
  idle: colors.textMuted,
  connecting: colors.warnUI,
  connected: colors.successUI,
  disconnected: colors.dangerUI,
};

const STATUS_LABEL: Record<WsStatus, string> = {
  idle: 'idle / offline',
  connecting: 'connecting…',
  connected: 'connected',
  disconnected: 'disconnected',
};

export default function DiagnosticsContainer(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<DiagEvent[]>(getEvents());

  useEffect(() => {
    Orientation.lockToPortrait();
    const sub = EventRegister.addEventListener(DIAG_EVENT, () => setEvents([...getEvents()]));
    return () => {
      EventRegister.removeEventListener(sub as string);
    };
  }, []);

  const rows = [...events].reverse(); // newest first

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Connection log"
        right={
          rows.length > 0 ? (
            <TouchableOpacity onPress={() => clearEvents()} style={styles.action} activeOpacity={0.7}>
              <Text style={styles.actionText}>Clear</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {rows.length === 0 ? (
        <Text style={styles.empty}>No connection events yet.</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, index) => `${item.ts}-${index}`}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: STATUS_COLOR[item.status] }]} />
              <View style={styles.rowText}>
                <Text style={styles.status}>{STATUS_LABEL[item.status]}</Text>
                <Text style={styles.meta}>
                  {new Date(item.ts).toLocaleString()}
                  {item.ip ? `  ·  ${item.ip}` : ''}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  action: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  actionText: { color: colors.textSecondary, fontSize: fontSize.label, fontWeight: fontWeight.medium },
  empty: { color: colors.textMuted, fontSize: fontSize.body, marginTop: spacing.xxxl, textAlign: 'center' },
  list: { paddingHorizontal: screenPad, paddingTop: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.md },
  rowText: { flex: 1 },
  status: { color: colors.textPrimary, fontSize: fontSize.body, fontWeight: fontWeight.medium },
  meta: { color: colors.textMuted, fontSize: fontSize.caption, marginTop: 2 },
});
