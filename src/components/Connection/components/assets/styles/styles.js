import {StyleSheet} from "react-native"
import { colors } from "../../../../../config/styles/colors";

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
  textInput: {
    borderBottomWidth: 0,
    fontSize:20,
    color:'#fff',
    marginBottom:30,
    paddingLeft:15,
    paddingRight:15,
    backgroundColor:'rgba(0, 0, 0, 0.3)'
  },
  button: {
  }
});
