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
  const { t, i18n } = useTranslation(); // Use the useTranslation hook
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
      // Update the user document in Firestore with the selected theme mode
      await firestore().collection('users').doc(user.uid).update({
        mode: newMode, // Set the theme mode (either 'light' or 'dark')
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
            <Text style={styles.ProfilePicPlaceholder}>{t('no_profile_picture')}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.Button} onPress={() => navigation.navigate('AccountSettings')}>
          <Text style={styles.ButtonText}>{t('accountSettings')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.Button} onPress={() => Alert.alert(t('helpSupport'), 'support@yourapp.com')}>
          <Text style={styles.ButtonText}>{t('helpSupport')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.Button} onPress={() => auth().signOut()}>
          <Text style={styles.ButtonText}>{t('logout')}</Text>
        </TouchableOpacity>

        <View style={styles.ModeSwitchContainer}>
          <Text style={styles.ModeSwitchText}>
            {t('switch_to_mode', { mode: isDarkMode ? t('lightMode') : t('darkMode') })}
          </Text>
          <Switch
            value={isDarkMode}
            onValueChange={() => handleThemeModeChange(isDarkMode ? 'light' : 'dark')}
            trackColor={{ false: COLORS.primaryLightGreyHex, true: COLORS.primaryOrangeHex }}
            thumbColor={isDarkMode ? COLORS.primaryWhiteHex : COLORS.primaryBlackHex}
          />
        </View>

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
  ProfilePicPlaceholder: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  ButtonContainer: {
    marginTop: SPACING.space_20,
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
    marginTop: SPACING.space_20,
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
    borderColor: COLORS.primaryLightGreyHex,
    borderWidth: 1,
    borderRadius: BORDERRADIUS.radius_20,
    backgroundColor: COLORS.primaryDarkGreyHex,
    color: COLORS.primaryWhiteHex,
  },
});

export default ProfileScreen;
