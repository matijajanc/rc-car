import {StyleSheet} from "react-native"
import { colors } from "../../config/styles/colors";

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
  firstItem: {
    borderTopWidth:0.5,
    borderTopColor: 'rgba(255,255,255,.5)',
  },
  lastItem: {
    borderBottomWidth:0
  },
  item: {
    flexDirection: 'row',
    //alignItems:'center',
    justifyContent:'space-between',
    borderBottomWidth:0.5,
    borderBottomColor: 'rgba(255,255,255,.5)',
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
