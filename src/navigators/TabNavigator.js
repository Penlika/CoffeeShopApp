import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // Icon library for tabs

// Screens
import HomeScreen from '../screens/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import CartScreen from '../screens/CartScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import DetailsScreen from '../screens/DetailsScreen'; // Details Screen
import ProfileScreen from '../screens/ProfileScreen'; // Profile Screen
import { COLORS } from '../theme/theme'; // Your theme
import AccountSettingsScreen from '../screens/AccountSettingScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// HomeStack (Stack for Home tab including Details screen and Profile screen)
const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: styles.tabBar,
    }}
  >
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
    <Stack.Screen name="Details" component={DetailsScreen} />
    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    <Stack.Screen name="AccountSettings" component={AccountSettingsScreen}/>
  </Stack.Navigator>
);

const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack} // Use HomeStack here
        options={{
          tabBarIcon: ({ focused }) => (
            <Icon
              name="home"
              size={25}
              color={focused ? COLORS.primaryOrangeHex : COLORS.primaryGreyHex}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Icon
              name="shopping-cart"
              size={25}
              color={focused ? COLORS.primaryOrangeHex : COLORS.primaryGreyHex}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Icon
              name="heart"
              size={25}
              color={focused ? COLORS.primaryOrangeHex : COLORS.primaryGreyHex}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrderHistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Icon
              name="history"
              size={25}
              color={focused ? COLORS.primaryOrangeHex : COLORS.primaryGreyHex}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    backgroundColor: COLORS.primaryBlackRGBA,
    borderTopWidth: 0,
  },
});

export default TabNavigator;
