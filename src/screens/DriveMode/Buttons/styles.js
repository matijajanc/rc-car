import {StyleSheet} from "react-native"
import { colors } from "../../../config/styles/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    flexDirection:'row',
    justifyContent: 'center',
    paddingTop:15,
    paddingRight:15,
    paddingBottom:15,
    paddingLeft:15
    // alignContent: 'flex-end',
    // justifyContent: 'flex-end',
  },
  upDownBox: {
    justifyContent:'flex-end',
    alignSelf:'flex-end'
  },
  leftRightBox: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'flex-end'
  },
  button: {
    width:100,
    height:100,
    borderColor:'#fff',
    borderWidth:1,
    alignItems:'center',
    justifyContent: 'center'
  },
  buttonArrow: {
    color:'#fff'
  },
  bottomSpace: {
    marginBottom:10
  },
  rightSpace: {
    marginRight:10
  },
  mainBox: {
    justifyContent:'center',
    alignItems: 'center',
    alignSelf:'center',
    flexGrow:2
  },
  speed: {
    fontSize:60,
    color:'#fff',
  }
});
