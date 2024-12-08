import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import SplashScreen from 'react-native-splash-screen';
import TabNavigator from './src/navigators/TabNavigator';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import i18next from './src/languages/i18n'; // Your i18n configuration
import { I18nextProvider } from 'react-i18next';
import firebase from '@react-native-firebase/app';
import { Linking } from 'react-native';


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

    // Handle deep link when the app is launched from a link
    const handleInitialLink = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('Initial deep link URL:', initialUrl);
        // You can add logic to handle deep link here (e.g., navigate to specific screen)
      }
    };

    handleInitialLink();

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

  // Listen to deep link events while the app is running
  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      console.log('Received deep link URL:', url);
      // Handle deep link logic, e.g., navigate to a specific screen or process URL data
    };

    Linking.addEventListener('url', handleDeepLink);

    return () => {
      Linking.removeEventListener('url', handleDeepLink); // Clean up listener
    };
  }, []);

  if (isLoggedIn === null) {
    return null; // Optionally show a loading spinner until state is known
  }

  return (
    <I18nextProvider i18n={i18next}>
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
    </I18nextProvider>
  );
};

export default App;
