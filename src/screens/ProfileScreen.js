import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, Switch, Image } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { Appearance } from 'react-native';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import { Picker } from '@react-native-picker/picker'; // Correct import

const ProfileScreen = () => {
  const [profileData, setProfileData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');
  const [selectedLanguage, setSelectedLanguage] = useState('english'); // Default language
  const navigation = useNavigation();

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      // Real-time listener to fetch and update profile data
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot((doc) => {
          if (doc.exists) {
            setProfileData(doc.data());
            setSelectedLanguage(doc.data()?.language || 'english');
            setIsDarkMode(doc.data()?.mode === 'dark');
          } else {
            console.log('No user data found!');
            setProfileData(null);
          }
        });

      // Clean up listener when component unmounts
      return () => unsubscribe();
    }
  }, []);

  const handleLogout = async () => {
    try {
      await auth().signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error("Error logging out: ", error);
      Alert.alert('Logout Failed', 'There was an error logging out. Please try again.');
    }
  };

  const handleHelpSupport = () => {
    Alert.alert('Help & Support', 'Contact us at support@yourapp.com');
  };

  const handleAccountSettings = () => {
    navigation.navigate('AccountSettings');
  };

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
      // Update the user document in Firestore with the selected language
      await firestore().collection('users').doc(user.uid).update({
        language: newLanguage, // Set the language preference
      });
    }
    setSelectedLanguage(newLanguage);
  };

  return (
    <View style={[styles.ScreenContainer, { backgroundColor: isDarkMode ? COLORS.primaryBlackHex : COLORS.white }]}>
      <ScrollView contentContainerStyle={styles.ScrollViewFlex}>
        <Text style={styles.ScreenTitle}>Profile</Text>

        {/* Profile Picture */}
        <View style={styles.ProfilePicContainer}>
          {profileData?.profilePic ? (
            <Image source={{ uri: profileData.profilePic }} style={styles.ProfilePic} />
          ) : (
            <Text style={styles.ProfilePicPlaceholder}>No Profile Picture</Text>
          )}
        </View>

        <View style={styles.ButtonContainer}>
          <TouchableOpacity style={styles.Button} onPress={handleAccountSettings}>
            <Text style={styles.ButtonText}>Account Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.Button} onPress={handleHelpSupport}>
            <Text style={styles.ButtonText}>Help & Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.Button} onPress={handleLogout}>
            <Text style={styles.ButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ModeSwitchContainer}>
          <Text style={styles.ModeSwitchText}>Switch to {isDarkMode ? 'Light' : 'Dark'} Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={() => handleThemeModeChange(isDarkMode ? 'light' : 'dark')}
            trackColor={{ false: COLORS.primaryLightGreyHex, true: COLORS.primaryOrangeHex }}
            thumbColor={isDarkMode ? COLORS.primaryWhiteHex : COLORS.primaryBlackHex}
          />
        </View>

        {/* Language Dropdown */}
        <View style={styles.LanguageContainer}>
          <Text style={styles.LanguageText}>Select Language</Text>
          <Picker
            selectedValue={selectedLanguage}
            style={styles.LanguagePicker}
            onValueChange={(itemValue) => handleLanguageChange(itemValue)}
          >
            <Picker.Item label="English" value="english" />
            <Picker.Item label="Spanish" value="spanish" />
            <Picker.Item label="French" value="french" />
            {/* Add more languages as needed */}
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
