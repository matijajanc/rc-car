import {StyleSheet} from "react-native";
import { colors } from "../../../../../config/styles/colors";

export default styles = StyleSheet.create({
  speedometerBox: {
    flex:1,
    position:'absolute',
    // top:30,
    left:120,
    width:310,
    height:280,
    justifyContent:'center',
    alignItems: 'center',
    alignSelf:'center',
  },
  speedLine: {
    flex:1,
    position:'absolute',
    top:0,
    left:0,
    //backgroundColor:'blue'
  },
  speedometer: {
    flex:1,
    position:'absolute',
    top:5,
    left:5,
    // width:'300@s',
    // height:'100%',
    width:300,
    height:282
  },
  speedBox: {
    position:'absolute',
    justifyContent:'center',
    alignSelf: 'center',
  },
  speed: {
    fontSize:90,
    color:'#fff',
  },
  controlsBox: {
    //flex:1,
    marginTop:'auto',
    flexDirection:'row',
    justifyContent:'center',
    alignItems:'flex-end',
    //flexGrow:1,
    //wrap:'wrap',
    bottom:40,
    width:180,
    //height:15,
    //backgroundColor:'green'
  }
});
