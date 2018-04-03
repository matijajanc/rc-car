import {StyleSheet} from "react-native"
import { colors } from "../../config/styles/colors";

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'flex-start',
    paddingTop:25,
    paddingLeft:15,
    paddingRight:15
  },
});
