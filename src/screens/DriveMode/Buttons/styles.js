import {StyleSheet} from "react-native"
import { colors } from "../../../config/styles/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.background,
    flexDirection:'row',
    justifyContent: 'center',
    paddingTop:15,
    paddingRight:15,
    paddingBottom:15,
    paddingLeft:15
  },
  upDownBox: {
    position:'absolute',
    left: 15,
    bottom:15,
    zIndex:2
  },
  leftRightBox: {
    flexDirection:'row',
    alignItems:'center',
    position:'absolute',
    right:15,
    height:'100%',
    zIndex:2
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
    color:'transparent'
  },
  bottomSpace: {
    marginBottom:10
  },
  btnLeft: {
    marginRight:10,
  },
  btnRight: {

  },
  mainBox: {
    //flex:1,
    position:'absolute',
    width:'100%',
    height:'100%',
    justifyContent:'center',
    alignItems: 'center',
    alignSelf:'center',
    zIndex:1,
  },
  carDataBox: {
    flex:1,
    position:'absolute',
    left:390
  }
});
