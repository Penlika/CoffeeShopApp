import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { COLORS, FONTSIZE, SPACING } from '../theme/theme';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      const errors = [];
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
        errors.push('Password must contain at least one special character');
      }
      if (!/(?=.*[0-9])/.test(password)) {
        errors.push('Password must contain at least one number');
      }
      return errors;
    }
    return [];
  };
  const handleRegister = async () => {
    if (!username) {
      Alert.alert('Error', 'Username is required');
      return;
    }
    if (!email) {
      Alert.alert('Error', 'Email is required');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Password is required');
      return;
    }
    if (!confirmPassword) {
      Alert.alert('Error', 'Confirm Password is required');
      return;
    }

    // Validate password
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      Alert.alert('Password Requirements', passwordErrors.join('\n'));
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      // Check if the username already exists in Firestore
      const usernameQuery = await firestore()
        .collection('users')
        .where('username', '==', username)
        .get();

      if (!usernameQuery.empty) {
        Alert.alert('Error', 'Username already exists. Please choose a different one.');
        return;
      }

      // Create the user with Firebase Authentication
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);

      // Get the user info
      const user = userCredential.user;

      // Create user data in Firestore
      await firestore().collection('users').doc(user.uid).set({
        username,
        email,
        createdAt: firestore.FieldValue.serverTimestamp(),
        mode:'dark',
      });

      Alert.alert('Success', 'Account created successfully!');
      navigation.navigate('Login'); // Redirect to Login screen after successful registration
    } catch (error) {
      let errorMessage = 'An error occurred. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'The email address is invalid.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak.';
      }
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        placeholderTextColor={COLORS.primaryWhiteHex}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor={COLORS.primaryWhiteHex}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        placeholderTextColor={COLORS.primaryWhiteHex}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholderTextColor={COLORS.primaryWhiteHex}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.space_20,
    backgroundColor: COLORS.primaryBlackHex,
  },
  title: {
    fontSize: FONTSIZE.size_24,
    fontFamily: 'Poppins-Bold',
    marginBottom: SPACING.space_20,
    textAlign: 'center',
    color: COLORS.primaryWhiteHex,
  },
  input: {
    height: 45,
    borderColor: COLORS.primaryWhiteHex,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: SPACING.space_10,
    paddingLeft: SPACING.space_10,
    color: COLORS.primaryWhiteHex,
  },
  button: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingVertical: SPACING.space_10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_18,
    fontFamily: 'Poppins-Semibold',
  },
  link: {
    color: COLORS.primaryOrangeHex,
    textAlign: 'center',
    marginTop: SPACING.space_10,
  },
});

export default RegisterScreen;