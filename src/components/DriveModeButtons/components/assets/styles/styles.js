import {StyleSheet} from "react-native"
import { colors } from "../../../../../config/styles/colors";
import { GAUGES_LEFT } from "../../../../../config/styles/dashboard";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
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
    //borderColor:'rgba(255,255,255,.1)',
    //borderColor:'rgba(255,255,255,.5)',
    borderColor:'#000',
    borderWidth:1,
    alignItems:'center',
    justifyContent: 'center',
    borderRadius:8,
    backgroundColor:'#131313'
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
    position:'absolute',
    // Derived from SPEEDOMETER_LEFT (see config/styles/dashboard) so the gauges
    // always track the speedometer and stay nested at its right edge.
    left: GAUGES_LEFT,
    // Span the full height so the gauges' height:'50%' resolves (a flex:1 on an
    // absolute box with no top/bottom has no definite height to size against).
    top:0,
    bottom:0,
  }
});

export default styles;
