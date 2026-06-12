import { StyleSheet } from 'react-native';
import { colors } from '../../../../../config/styles/colors';

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    position: 'absolute',
    top: 70,
  },
  label: {
    color: '#9aa0a6',
    fontSize: 13,
    marginBottom: 8,
  },
  textInput: {
    width: 260,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: colors.lightBlue,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statusRow: {
    width: 290,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  statusError: {
    color: colors.red,
    fontSize: 14,
    textAlign: 'center',
  },
  statusInfo: {
    color: colors.lightBlue,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.blue,
    minWidth: 170,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 400,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  skip: {
    marginTop: 18,
  },
  skipText: {
    color: '#777',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
