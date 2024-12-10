import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import ProfilePic from './ProfilePic';

const HeaderBar = ({ title, navigation }) => {
  return (
    <View style={styles.HeaderContainer}>
        <Image
          source={require('../assets/trans.png')}
          style={styles.IconImage}
          resizeMode="contain"
        />
      <Text style={styles.HeaderText}>{title}</Text>

      <ProfilePic navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  HeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.space_30,
    position: 'relative',
    backgroundColor:COLORS.primaryBlackHex,
  },
  HeaderText: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
  },
  IconImage: {
    width: 90,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HeaderBar;
