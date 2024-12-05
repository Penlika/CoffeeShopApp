import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer'; // Import Drawer Navigator
import auth from '@react-native-firebase/auth';
import SplashScreen from 'react-native-splash-screen';
import TabNavigator from './src/navigators/TabNavigator';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import CustomDrawerContent from './src/components/DrawerContent'; // Create this component
import i18next from './src/languages/i18n';
import { I18nextProvider } from 'react-i18next';
import firebase from '@react-native-firebase/app';
import './src/languages/i18n';
import 'react-native-gesture-handler';

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
const Drawer = createDrawerNavigator(); // Create Drawer Navigator

const DrawerNavigator = () => (
  <Drawer.Navigator
    drawerContent={(props) => <CustomDrawerContent {...props} />}
    screenOptions={{
      headerShown: false,
      drawerType: 'slide',
    }}
  >
    <Drawer.Screen name="MainTab" component={TabNavigator} />
  </Drawer.Navigator>
);

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    SplashScreen.hide();

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

  useEffect(() => {
    const fetchDataFromFirebase = async () => {
      if (isLoggedIn) {
        try {
          const userId = auth().currentUser.uid;
          const userData = await firebase.firestore().collection('users').doc(userId).get();
          console.log(userData.data());
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchDataFromFirebase();
  }, [isLoggedIn]);

  if (isLoggedIn === null) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18next}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLoggedIn ? (
            <Stack.Screen name="Drawer" component={DrawerNavigator} options={{ animation: 'slide_from_bottom' }} />
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