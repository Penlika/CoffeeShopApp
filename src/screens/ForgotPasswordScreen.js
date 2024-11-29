import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from 'react-native';
import {COLORS, FONTSIZE, SPACING} from '../theme/theme';

const ForgotPasswordScreen = ({navigation}) => {
  const [email, setEmail] = useState('');

  const handleForgotPassword = () => {
    // Handle forgot password logic here
    console.log('Password reset for', email);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TouchableOpacity style={styles.button} onPress={handleForgotPassword}>
        <Text style={styles.buttonText}>Reset Password</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Back to Login</Text>
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

export default ForgotPasswordScreen;
