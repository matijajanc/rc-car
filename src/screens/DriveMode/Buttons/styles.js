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
    borderColor:'rgba(255,255,255,.1)',
    borderWidth:1,
    alignItems:'center',
    justifyContent: 'center',
    borderRadius:8
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
    position:'absolute',
    justifyContent:'center',
    alignSelf: 'center',
    fontSize:90,
    color:'#fff',
  },
  speedometer: {
    flex:1,
    position:'absolute',
    width:300,
    height:280
  }
});
