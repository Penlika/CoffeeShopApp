import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import ProfilePic from './ProfilePic'; // Ensure ProfilePic component is correctly implemented
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const HeaderBar = ({ title, navigation }) => {
  return (
    <View style={styles.HeaderContainer}>
      <View style={styles.Container}>
        {/* Touchable to open Drawer */}
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <LinearGradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}
            style={styles.LinearGradientBG}>
            <Icon name="menu" color={COLORS.primaryLightGreyHex} size={FONTSIZE.size_16 || 16} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <Text style={styles.HeaderText}>{title}</Text>
      {/* Pass navigation prop to ProfilePic */}
      <ProfilePic navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  HeaderContainer: {
    padding: SPACING.space_30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  HeaderText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
  },
  Container: {
    borderWidth: 2,
    borderColor: COLORS.secondaryDarkGreyHex,
    borderRadius: SPACING.space_12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondaryDarkGreyHex,
    overflow: 'hidden',
    height: SPACING.space_36,
    width: SPACING.space_36,
  },
  LinearGradientBG: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SPACING.space_12,
  },
});

export default HeaderBar;
