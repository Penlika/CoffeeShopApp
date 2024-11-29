import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import TabNavigator from './src/navigators/TabNavigator';
import LoginScreen from './src/screens/LoginScreen'; // Import your login screen
import RegisterScreen from './src/screens/RegisterScreen'; // Import RegisterScreen
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen'; // Import ForgotPasswordScreen
import SplashScreen from 'react-native-splash-screen';

const Stack = createNativeStackNavigator();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    SplashScreen.hide();
    // You can check if the user is logged in here
    // setIsLoggedIn(true); // Uncomment to simulate logged-in state
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {isLoggedIn ? (
          <Stack.Screen
            name="Tab"
            component={TabNavigator}
            options={{animation: 'slide_from_bottom'}}
          />
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{animation: 'slide_from_bottom'}}
          />
        )}

        {/* Register Screen */}
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{animation: 'slide_from_right'}}
        />

        {/* Forgot Password Screen */}
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{animation: 'slide_from_right'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
