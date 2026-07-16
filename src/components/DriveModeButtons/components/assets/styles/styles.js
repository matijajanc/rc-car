import { StyleSheet } from 'react-native';
import { colors } from '../../../../../config/styles/colors';
import { radius } from '../../../../../config/styles/theme';
import { GAUGES_LEFT } from '../../../../../config/styles/dashboard';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 15,
    paddingRight: 15,
    paddingBottom: 15,
    paddingLeft: 15,
  },
  leftRightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 15,
    height: '100%',
    zIndex: 2,
  },
  button: {
    width: 100,
    height: 100,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
  },
  // Pressed state: a clear monochrome highlight (colour stays reserved for the
  // gauges these buttons sit beside).
  buttonActive: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  buttonArrow: {
    color: 'transparent',
  },
  btnLeft: {
    marginRight: 10,
  },
  throttlePad: {
    position: 'absolute',
    // Same 40px inset as the old throttle buttons — clears the landscape
    // edge-swipe (back) gesture zone.
    left: 40,
    top: 15,
    bottom: 15,
    width: 96,
    zIndex: 2,
  },
  throttleInner: {
    flex: 1,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  // Top 3/4 = variable forward; the fill grows up from the neutral line.
  forwardZone: {
    flex: 3,
    justifyContent: 'flex-end',
  },
  forwardFill: {
    width: '100%',
    backgroundColor: colors.accentGlow,
    borderTopWidth: 2,
    borderTopColor: colors.accent,
  },
  neutralLine: {
    height: 2,
    backgroundColor: colors.accentBorder,
  },
  // Bottom 1/4 = fixed reverse.
  reverseZone: {
    flex: 1,
  },
  reverseFill: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  padReadout: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
  },
  padReadoutActive: {
    color: colors.accent,
  },
  mainBox: {
    //flex:1,
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    zIndex: 1,
  },
  carDataBox: {
    position: 'absolute',
    // Derived from SPEEDOMETER_LEFT (see config/styles/dashboard) so the gauges
    // always track the speedometer and stay nested at its right edge.
    left: GAUGES_LEFT,
    // Span the full height so the gauges' height:'50%' resolves (a flex:1 on an
    // absolute box with no top/bottom has no definite height to size against).
    top: 0,
    bottom: 0,
    transform: [{ translateY: 15 }],
  },
});

export default styles;
