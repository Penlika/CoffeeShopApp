import React from 'react';
import {StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS, SPACING} from '../theme/theme';
import Icon from 'react-native-vector-icons/FontAwesome'; // Importing FontAwesome icons

const GradientBGIcon = ({name, color, size}) => {
  return (
    <View style={styles.Container}>
      <LinearGradient
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}
        style={styles.LinearGradientBG}>
        <Icon name={name} color={color} size={size} />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  Container: {
    borderWidth: 2,
    borderColor: COLORS.secondaryDarkGreyHex,
    borderRadius: SPACING.space_12, // Makes the container rounded
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondaryDarkGreyHex,
    overflow: 'hidden',
    height: SPACING.space_36, // Adjusted height for the icon
    width: SPACING.space_36, // Adjusted width for the icon
  },
  LinearGradientBG: {
    flex: 1, // Ensures the gradient fills the container
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SPACING.space_12, // Rounded corners for the gradient
  },
});

export default GradientBGIcon;
