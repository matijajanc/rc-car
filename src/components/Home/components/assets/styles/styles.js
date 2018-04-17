import {StyleSheet} from "react-native"
import { colors } from "../../../../../config/styles/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    justifyContent:'space-between',
    borderTopWidth:1,
    borderTopColor: 'rgba(0,0,0,.4)',
    paddingTop:15,
    paddingBottom:15
  },
  icon: {
  },
  title: {
    alignSelf:'flex-start',
    fontSize:14,
    color: '#fff',
    marginLeft: 15
  },
  switch: {
    alignSelf:'flex-end',
    marginRight: 15
  }
});
