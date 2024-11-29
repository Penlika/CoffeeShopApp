import React, {useState} from 'react';
import {StyleSheet, Text, TextInput, View, TouchableOpacity, Alert, ActivityIndicator} from 'react-native';
import {COLORS, FONTSIZE, SPACING} from '../theme/theme';
import auth from '@react-native-firebase/auth';

const LoginScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailPattern.test(email);
  };

  const handleLogin = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      await auth().signInWithEmailAndPassword(email, password);
      navigation.navigate('Tab'); // Navigate to Tab Navigator
    } catch (error) {
      if (error.code === 'auth/invalid-email') {
        Alert.alert('Invalid Email', 'Please check the email address.');
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert('Wrong Password', 'The password you entered is incorrect.');
      } else {
        Alert.alert('Login Failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primaryWhiteHex} />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.link}>Forgot Password?</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.space_20,
  },
  title: {
    fontSize: FONTSIZE.size_24,
    fontFamily: 'Poppins-Bold',
    marginBottom: SPACING.space_20,
    textAlign: 'center',
  },
  input: {
    height: 45,
    borderColor: COLORS.primaryGreyHex,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: SPACING.space_10,
    paddingLeft: SPACING.space_10,
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

export default LoginScreen;
