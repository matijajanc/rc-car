import {StyleSheet} from "react-native"
import { colors } from "../../config/styles/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    marginTop:70,
    justifyContent:'flex-start',
  },
  inputBox: {
    flex:1,
    justifyContent: 'center',
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
