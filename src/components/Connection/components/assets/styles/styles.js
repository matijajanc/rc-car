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
    paddingTop:10,
    paddingBottom:10,
    paddingLeft:15,
    paddingRight:15,
    backgroundColor:'#000'
  },
  button: {
    backgroundColor: colors.blue,
    paddingTop:10,
    paddingBottom:10,
    paddingLeft:30,
    paddingRight:30,
    borderRadius:400
  },
  buttonText: {
    color: '#fff',
    fontSize:16
  }
});
