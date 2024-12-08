import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, Switch, Image } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { Appearance } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';

const ProfileScreen = () => {
  const { t, i18n } = useTranslation();
  const [profileData, setProfileData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');
  const [selectedLanguage, setSelectedLanguage] = useState('en'); // Default language
  const navigation = useNavigation();

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot((doc) => {
          if (doc.exists) {
            setProfileData(doc.data());
            setSelectedLanguage(doc.data()?.language || 'en');
            setIsDarkMode(doc.data()?.mode === 'dark');
          } else {
            setProfileData(null);
          }
        });

      return () => unsubscribe();
    }
  }, []);

  const handleThemeModeChange = async (newMode) => {
    const user = auth().currentUser;
    if (user) {
      await firestore().collection('users').doc(user.uid).update({
        mode: newMode,
      });
    }
    setIsDarkMode(newMode === 'dark');
  };

  const handleLanguageChange = async (newLanguage) => {
    const user = auth().currentUser;
    if (user) {
      await firestore().collection('users').doc(user.uid).update({
        language: newLanguage,
      });
    }
    setSelectedLanguage(newLanguage);
    i18n.changeLanguage(newLanguage); // Update i18n language
  };

  return (
    <View style={[styles.ScreenContainer, { backgroundColor: isDarkMode ? COLORS.primaryBlackHex : COLORS.white }]}>
      <ScrollView contentContainerStyle={styles.ScrollViewFlex}>
        <Text style={styles.ScreenTitle}>{t('profile')}</Text>

        {/* Profile Picture */}
        <View style={styles.ProfilePicContainer}>
          {profileData?.profilePic ? (
            <Image source={{ uri: profileData.profilePic }} style={styles.ProfilePic} />
          ) : (
            <Image source={require('../assets/images.jpg')} style={styles.ProfilePic} />
          )}
        </View>

        <TouchableOpacity style={styles.Button} onPress={() => navigation.navigate('AccountSettings')}>
          <Text style={styles.ButtonText}>{t('accountSettings')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.Button} onPress={() => Alert.alert(t('helpSupport'), 'support@CoffeeShop.com')}>
          <Text style={styles.ButtonText}>{t('helpSupport')}</Text>
        </TouchableOpacity>

        {/* Dark/Light Mode Switch */}
        <View style={styles.ModeSwitchContainer}>
          <Text style={styles.ModeSwitchText}>{isDarkMode ? t('dark') : t('light')}</Text>
          <Switch
            value={isDarkMode}
            onValueChange={() => handleThemeModeChange(isDarkMode ? 'light' : 'dark')}
            trackColor={{ false: COLORS.primaryLightGreyHex, true: COLORS.primaryOrangeHex }}
            thumbColor={isDarkMode ? COLORS.primaryWhiteHex : COLORS.primaryBlackHex}
          />
        </View>

        {/* Language Picker */}
        <View style={styles.LanguageContainer}>
          <Text style={styles.LanguageText}>{t('selectLanguage')}</Text>
          <Picker
            selectedValue={selectedLanguage}
            style={styles.LanguagePicker}
            onValueChange={(itemValue) => handleLanguageChange(itemValue)}
          >
            <Picker.Item label={t('english')} value="en" />
            <Picker.Item label={t('spanish')} value="es" />
            <Picker.Item label={t('french')} value="fr" />
          </Picker>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={[styles.Button, styles.LogoutButton]} onPress={() => auth().signOut()}>
          <Text style={styles.ButtonText}>{t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  ScreenContainer: {
    flex: 1,
    paddingTop: SPACING.space_30,
  },
  ScrollViewFlex: {
    flexGrow: 1,
    paddingHorizontal: SPACING.space_30,
  },
  ScreenTitle: {
    fontSize: FONTSIZE.size_28,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_20,
  },
  ProfilePicContainer: {
    alignItems: 'center',
    marginBottom: SPACING.space_30,
  },
  ProfilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.primaryOrangeHex,
  },
  Button: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_20,
    paddingVertical: SPACING.space_12,
    marginBottom: SPACING.space_15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ButtonText: {
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
  },
  ModeSwitchContainer: {
    marginTop: SPACING.space_20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ModeSwitchText: {
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  LanguageContainer: {
    backgroundColor: COLORS.primaryOrangeHex,
    marginTop: SPACING.space_20,
    borderWidth: 1,
    borderColor: COLORS.primaryLightGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    padding: SPACING.space_15,
  },
  LanguageText: {
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    marginBottom: SPACING.space_10,
  },
  LanguagePicker: {
    height: 50,
    width: '100%',
    backgroundColor: COLORS.primaryDarkGreyHex,
    color: COLORS.primaryWhiteHex,
  },
  LogoutButton: {
    marginTop: 'auto',  // This will push it to the bottom
  },
});

export default ProfileScreen;
