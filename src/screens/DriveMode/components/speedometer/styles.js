import {StyleSheet} from "react-native";
import { colors } from "../../../../config/styles/colors";

export const styles = StyleSheet.create({
  speedometerBox: {
    flex:1,
    position:'absolute',
    // top:30,
    left:120,
    width:300,
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
  speed: {
    position:'absolute',
    justifyContent:'center',
    alignSelf: 'center',
    fontSize:90,
    color:'#fff',
  },
});
