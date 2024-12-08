import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Image,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import ImagePicker from 'react-native-image-crop-picker';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';

const AccountSettingsScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [editMode, setEditMode] = useState({
    username: false,
    address: false,
    phone: false,
    paymentMethod: false,
  });
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      setEmail(user.email);
      firestore()
        .collection('users')
        .doc(user.uid)
        .get()
        .then((doc) => {
          if (doc.exists) {
            const userData = doc.data();
            setUsername(userData.username || '');
            setProfilePic(userData.profilePic || null);
            setAddress(userData.address || '');
            setPhone(userData.phone || '');
            setPaymentMethod(userData.paymentMethod || '');
          }
        });
    }
  }, []);
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      const user = auth().currentUser;
      if (user) {
        await user.updatePassword(newPassword);
        Alert.alert('Success', 'Password updated successfully.');
        setPasswordModalVisible(false);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update password. Please try again.');
      console.error(error);
    }
  };

  const handleFieldUpdate = async (field, value) => {
    const user = auth().currentUser;

    if (user) {
      try {
        await firestore().collection('users').doc(user.uid).update({ [field]: value });
        Alert.alert('Success', `${field} updated successfully.`);
        setEditMode((prev) => ({ ...prev, [field]: false }));
      } catch (error) {
        Alert.alert('Error', `Failed to update ${field}. Please try again.`);
      }
    }
  };

  const handleChooseProfilePic = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 300,
        height: 300,
        cropping: true,
        cropperCircleOverlay: true,
        mediaType: 'photo',
      });

      if (image) {
        const user = auth().currentUser;
        const storageRef = storage().ref(`profilePictures/${user.uid}`);
        const response = await fetch(image.path);
        const blob = await response.blob();

        await storageRef.put(blob);
        const downloadURL = await storageRef.getDownloadURL();

        firestore()
          .collection('users')
          .doc(user.uid)
          .update({ profilePic: downloadURL });

        setProfilePic(downloadURL);
        Alert.alert('Success', 'Profile picture updated successfully.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  const renderEditableField = (label, value, setValue, fieldName) => (
    <View style={styles.InputContainerComponent}>
      <Ionicons
        style={styles.InputIcon}
        name={fieldName === 'username' ? 'person-outline' : fieldName === 'address' ? 'home-outline' : fieldName === 'phone' ? 'call-outline' : 'card-outline'}
        size={FONTSIZE.size_18}
        color={COLORS.primaryLightGreyHex}
      />
      <TextInput
        placeholder={label}
        value={value}
        onChangeText={setValue}
        editable={editMode[fieldName]}
        style={[
          styles.TextInputContainer,
          !editMode[fieldName] && styles.TextInputNonEditable,
        ]}
      />
      <TouchableOpacity
        onPress={() => {
          if (editMode[fieldName]) {
            handleFieldUpdate(fieldName, value);
          } else {
            setEditMode((prev) => ({ ...prev, [fieldName]: true }));
          }
        }}
        style={styles.EditButton}
      >
        <Text style={styles.EditButtonText}>
          {editMode[fieldName] ? 'Save' : 'Edit'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ScrollViewFlex}>
        <Text style={styles.ScreenTitle}>Account Settings</Text>

        {/* Profile Picture */}
        <View style={styles.ProfilePicContainer}>
          <TouchableOpacity onPress={handleChooseProfilePic}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.ProfilePic} />
            ) : (
              <Ionicons name="person-circle-outline" size={100} color={COLORS.primaryLightGreyHex} />
            )}
          </TouchableOpacity>
        </View>

        {/* Editable Fields */}
        {renderEditableField('Username', username, setUsername, 'username')}
        {renderEditableField('Address', address, setAddress, 'address')}
        {renderEditableField('Phone', phone, setPhone, 'phone')}

        {/* Email Field (Read-Only) */}
        <View style={styles.InputContainerComponent}>
          <Ionicons
            style={styles.InputIcon}
            name="mail-outline"
            size={FONTSIZE.size_18}
            color={COLORS.primaryLightGreyHex}
          />
          <TextInput
            placeholder="Email"
            value={email}
            editable={false}
            style={[styles.TextInputContainer, styles.TextInputNonEditable]}
          />
        </View>
        <TouchableOpacity
          style={styles.ButtonContainer}
          onPress={() => setPasswordModalVisible(true)}
        >
          <Text style={styles.ButtonText}>Change Password</Text>
        </TouchableOpacity>
      </ScrollView>
      <Modal
        transparent
        visible={passwordModalVisible}
        animationType="slide"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.ModalContainer}>
          <View style={styles.ModalContent}>
            <Text style={styles.ModalTitle}>Change Password</Text>

            <TextInput
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              style={styles.ModalInput}
            />
            <TextInput
              placeholder="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.ModalInput}
            />

            <View style={styles.ModalButtonRow}>
              <TouchableOpacity
                style={[styles.ModalButton, styles.CancelButton]}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.ButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ModalButton, styles.SaveButton]}
                onPress={handlePasswordChange}
              >
                <Text style={styles.ButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
    ScreenContainer: {
      flex: 1,
      backgroundColor: COLORS.primaryBlackHex,
    },
    ScrollViewFlex: {
      flexGrow: 1,
      paddingBottom: SPACING.space_20,
    },
    ScreenTitle: {
      fontSize: FONTSIZE.size_28,
      fontFamily: FONTFAMILY.poppins_semibold,
      color: COLORS.primaryWhiteHex,
      paddingLeft: SPACING.space_30,
      marginVertical: SPACING.space_30,
    },
    ProfilePicContainer: {
      alignSelf: 'center',
      marginVertical: SPACING.space_20,
    },
    ProfilePic: {
      width: 100,
      height: 100,
      borderRadius: 50, // Makes the image circular
      borderWidth: 2,
      borderColor: COLORS.primaryOrangeHex,
    },
    InputContainerComponent: {
      flexDirection: 'row',
      marginHorizontal: SPACING.space_30,
      marginBottom: SPACING.space_20,
      borderRadius: BORDERRADIUS.radius_20,
      backgroundColor: COLORS.primaryDarkGreyHex,
      alignItems: 'center',
    },
    InputIcon: {
      marginHorizontal: SPACING.space_20,
    },
    TextInputContainer: {
      flex: 1,
      height: SPACING.space_20 * 3,
      fontFamily: FONTFAMILY.poppins_medium,
      fontSize: FONTSIZE.size_14,
      color: COLORS.primaryWhiteHex,
    },
    TextInputNonEditable: {
      backgroundColor: COLORS.primaryDarkGreyHex, // Non-editable field style
    },
    ButtonContainer: {
      backgroundColor: COLORS.primaryOrangeHex,
      paddingVertical: SPACING.space_10,
      borderRadius: BORDERRADIUS.radius_10,
      alignItems: 'center',
      marginVertical: SPACING.space_20,
    },
    ButtonText: {
      fontFamily: FONTFAMILY.poppins_semibold,
      fontSize: FONTSIZE.size_16,
      color: COLORS.primaryWhiteHex,
    },
    EditButton: {
      marginRight: SPACING.space_20,
    },
    EditButtonText: {
      fontSize: FONTSIZE.size_14,
      fontFamily: FONTFAMILY.poppins_medium,
      color: COLORS.primaryOrangeHex,
    },
    // Modal styles remain the same as before
    ModalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    ModalContent: {
      width: '80%',
      backgroundColor: COLORS.primaryDarkGreyHex,
      borderRadius: BORDERRADIUS.radius_20,
      padding: SPACING.space_20,
    },
    ModalTitle: {
      fontSize: FONTSIZE.size_20,
      color: COLORS.primaryWhiteHex,
      fontFamily: FONTFAMILY.poppins_semibold,
      marginBottom: SPACING.space_20,
    },
    ModalInput: {
      backgroundColor: COLORS.primaryLightGreyHex,
      borderRadius: BORDERRADIUS.radius_10,
      padding: SPACING.space_10,
      marginVertical: SPACING.space_10,
      color: COLORS.primaryBlackHex,
    },
    ModalButtonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: SPACING.space_20,
    },
    ModalButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: SPACING.space_10,
      borderRadius: BORDERRADIUS.radius_10,
      marginHorizontal: SPACING.space_20,
    },
    CancelButton: {
      backgroundColor: COLORS.primaryRedHex,
    },
    SaveButton: {
      backgroundColor: COLORS.primaryOrangeHex,
    },
  });
  
  export default AccountSettingsScreen;
  