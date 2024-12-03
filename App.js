import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import SplashScreen from 'react-native-splash-screen';
import TabNavigator from './src/navigators/TabNavigator';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

// Import Firebase app
import firebase from '@react-native-firebase/app';

// Import i18next and i18n config
import './src/languages/i18n'; // Ensure this path is correct based on where you save your i18n.js

const firebaseConfig = {
  apiKey: 'AIzaSyAaK_2739wqm928C0f7rIq5-6zdLmO2-b8',
  authDomain: 'reacttest-26675.firebaseapp.com',
  projectId: 'reacttest-26675',
  storageBucket: 'reacttest-26675.appspot.com',
  messagingSenderId: '583761591180',
  appId: '1:583761591180:android:cb4da69569b783abe834a9',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const Stack = createNativeStackNavigator();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // Use null to indicate unknown state initially

  useEffect(() => {
    SplashScreen.hide();

    // Check if the user is already logged in or not on app start
    const checkLoginStatus = async () => {
      const user = auth().currentUser;
      if (user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();

    const unsubscribe = auth().onAuthStateChanged(user => {
      if (user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch user data after login status is confirmed
  useEffect(() => {
    const fetchDataFromFirebase = async () => {
      if (isLoggedIn) {
        try {
          const userId = auth().currentUser.uid;
          const userData = await firebase.firestore().collection('users').doc(userId).get();
          console.log(userData.data()); // Handle fetched user data as needed
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchDataFromFirebase();
  }, [isLoggedIn]);

  if (isLoggedIn === null) {
    return null; // Optionally show a loading spinner until state is known
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="Tab" component={TabNavigator} options={{ animation: 'slide_from_bottom' }} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ animation: 'slide_from_right' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
