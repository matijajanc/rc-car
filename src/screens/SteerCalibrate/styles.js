import {StyleSheet} from "react-native"
import { colors } from "../../config/styles/colors";

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'flex-start',
    paddingTop:25
  },
  contentBox: {
    flexDirection:'row',
    justifyContent:'center',
    alignItems:'center',
    paddingLeft:15,
    paddingRight:15
  },
  tyreBox: {
    alignItems:'center',
    marginLeft:'auto',
    marginRight:'auto'
  },
  tyre: {
    justifyContent:'center'
  },
  button: {
    // borderWidth:1,
    // borderColor:'rgba(0,0,0,0.2)',
    alignItems:'center',
    justifyContent:'center',
    width:50,
    height:50,
    backgroundColor:colors.button,
    borderRadius:100,
  },
  arrow: {
  },
  right: {
    transform: [{ rotate: '180deg'}]
  },
  angleBg: {
    flexDirection:'row',
    marginTop:50,
    justifyContent:'center'
  },
  angle: {
    color:'#fff',
    fontSize:28,
  }
});
