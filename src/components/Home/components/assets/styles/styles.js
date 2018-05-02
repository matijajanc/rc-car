import {StyleSheet} from "react-native"
import { colors } from "../../../../../config/styles/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignContent: 'flex-end',
    justifyContent: 'flex-end',
  },
  driveMode: {
    flex:1,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  touchImg: {
  },
  item: {
    flexDirection: 'row',
    borderTopWidth:1,
    borderTopColor: 'rgba(0,0,0,.4)',
    paddingTop:15,
    paddingBottom:15
  },
  itemBox: {
    flexDirection:'row',
  },
  title: {
    alignSelf:'center',
    justifyContent:'center',
    fontSize:14,
    color: '#fff',
    marginLeft: 15
  },
  switch: {
    marginLeft:'auto',
    marginRight: 15
  },
  svgBox: {
    width: 25,
    height:25,
    marginLeft: 15,
    paddingTop:5,
    paddingBottom:5,
    alignItems:'center',
    justifyContent:'center',
    borderRadius:400
  }
});
