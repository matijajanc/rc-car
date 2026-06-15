import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from './assets/styles/styles';
import { colors } from '../../../config/styles/colors';

export type ConnectionStatus = 'idle' | 'connecting' | 'error';

interface Props {
  domain: string;
  status: ConnectionStatus;
  onChangeDomain: (value: string) => void;
  onConnect: () => void;
  onSkip: () => void;
}

export default function Connection({
  domain,
  status,
  onChangeDomain,
  onConnect,
  onSkip,
}: Props): React.JSX.Element {
  const connecting = status === 'connecting';
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Image style={styles.logo} source={require('./assets/images/logo.png')} />

      <View style={styles.card}>
        <Text style={styles.title}>Connect to your car</Text>
        <Text style={styles.subtitle}>
          Enter the IP address of the NodeJS bridge server running on your network.
        </Text>

        <Text style={styles.fieldLabel}>SERVER IP</Text>
        <TextInput
          style={[styles.textInput, focused && styles.textInputFocused]}
          value={domain}
          onChangeText={onChangeDomain}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="192.168.0.10"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
          editable={!connecting}
        />

        <View style={styles.statusRow}>
          {status === 'error' && (
            <Text style={styles.statusError}>
              {'Could not reach the server. Check the IP and try again.'}
            </Text>
          )}
          {connecting && <Text style={styles.statusInfo}>Connecting…</Text>}
        </View>

        <TouchableOpacity
          style={[styles.button, connecting && styles.buttonDisabled]}
          onPress={onConnect}
          disabled={connecting}
          activeOpacity={0.85}>
          {connecting ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <Text style={styles.buttonText}>Connect</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onSkip} style={styles.skip} activeOpacity={0.7}>
        <Text style={styles.skipText}>Open without connecting</Text>
      </TouchableOpacity>
    </View>
  );
}
