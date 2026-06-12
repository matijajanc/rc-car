import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Orientation from 'react-native-orientation-locker';
import { EventRegister } from 'react-native-event-listeners';
import { colors } from '../../config/styles/colors';
import { DIAG_EVENT, clearEvents, getEvents } from '../../utils/diagnostics';
import type { DiagEvent } from '../../utils/diagnostics';
import type { WsStatus } from '../../utils/websocket';

const STATUS_COLOR: Record<WsStatus, string> = {
  idle: '#777',
  connecting: colors.orange,
  connected: colors.green,
  disconnected: colors.red,
};

const STATUS_LABEL: Record<WsStatus, string> = {
  idle: 'idle / offline',
  connecting: 'connecting…',
  connected: 'connected',
  disconnected: 'disconnected',
};

export default function DiagnosticsContainer(): React.JSX.Element {
  const navigation = useNavigation();
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
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Connection log</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => {
              clearEvents();
            }}
            style={styles.action}
          >
            <Text style={styles.actionText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.action}>
            <Text style={styles.actionText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>

      {rows.length === 0 ? (
        <Text style={styles.empty}>No connection events yet.</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, index) => `${item.ts}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: STATUS_COLOR[item.status] }]} />
              <View style={styles.rowText}>
                <Text style={styles.status}>{STATUS_LABEL[item.status]}</Text>
                <Text style={styles.meta}>
                  {new Date(item.ts).toLocaleString()}
                  {item.ip ? `  •  ${item.ip}` : ''}
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
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '600' },
  actions: { flexDirection: 'row' },
  action: {
    backgroundColor: '#222',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionText: { color: colors.lightBlue, fontSize: 14 },
  empty: { color: '#777', fontSize: 15, marginTop: 40, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  rowText: { flex: 1 },
  status: { color: '#fff', fontSize: 15 },
  meta: { color: '#888', fontSize: 12, marginTop: 2 },
});
