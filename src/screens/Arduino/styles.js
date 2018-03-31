import {StyleSheet} from "react-native"
import { colors } from "../../config/styles/colors";

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
    //flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'flex-start',
    paddingBottom:25
  },
  image: {
    marginTop:25,
    marginBottom:20,
    alignSelf: 'center'
  },
  sectionHeader: {
    color:'#fff',
    marginTop:20,
    paddingTop:10,
    paddingBottom:10,
    paddingLeft:15,
    paddingRight:15,
    backgroundColor:'rgba(0,0,0,0.8)'
  },
  listItem: {
    flexDirection: 'row',
    paddingTop:8,
    paddingBottom:8,
    paddingLeft:15,
    paddingRight:15,
  },
  pin: {
    color:'#fff',
    marginRight:15,
    backgroundColor:'rgba(0,0,0,0.8)',
    paddingTop:2,
    paddingBottom:2,
    paddingRight:8,
    paddingLeft:8
  },
  text: {
    color:'#fff',
    flexGrow:2
  },
  type: {
    color:'#fff',
  },
  color: {
    color:'#fff',
    justifyContent:'flex-end',
    marginRight:10
  }
});
