import {StyleSheet} from "react-native"
import { colors } from "../../config/styles/colors";

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  image: {
    marginTop:25,
    marginBottom:50,
    alignItems: 'center'
  },
  sectionHeader: {
    color:'#fff',
    paddingTop:10,
    paddingBottom:10,
    paddingLeft:20,
    paddingRight:20,
    backgroundColor:'rgba(0,0,0,0.8)'
  },
  listItem: {
    flexDirection: 'row',
    alignItems:'flex-start',
    paddingTop:7,
    paddingBottom:7,
    paddingLeft:20,
    paddingRight:20,
  },
  pin: {
    color:'#fff',
  },
  text: {
    color:'#fff',
  },
  type: {
    color:'#fff',
    justifyContent:'flex-end'
  },
  color: {
    color:'#fff',
    justifyContent:'flex-end'
  }
});
