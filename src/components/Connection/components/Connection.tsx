import React from 'react';
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from './assets/styles/styles';

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

  return (
    <View style={styles.container}>
      <Image style={styles.logo} source={require('./assets/images/logo.png')} />

      <Text style={styles.label}>NodeJS server IP address</Text>
      <TextInput
        style={styles.textInput}
        value={domain}
        onChangeText={onChangeDomain}
        placeholder="192.168.0.10"
        placeholderTextColor="#666"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!connecting}
      />

      <View style={styles.statusRow}>
        {status === 'error' && (
          <Text style={styles.statusError}>
            {'⚠  Could not reach the server. Check the IP and try again.'}
          </Text>
        )}
        {connecting && <Text style={styles.statusInfo}>Connecting…</Text>}
      </View>

      <TouchableOpacity
        style={[styles.button, connecting && styles.buttonDisabled]}
        onPress={onConnect}
        disabled={connecting}
        activeOpacity={0.8}>
        {connecting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Connect</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onSkip} style={styles.skip} activeOpacity={0.7}>
        <Text style={styles.skipText}>Open without connecting</Text>
      </TouchableOpacity>
    </View>
  );
}
