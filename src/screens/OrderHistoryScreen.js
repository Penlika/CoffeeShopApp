import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import HeaderBar from '../components/HeaderBar';
import EmptyListAnimation from '../components/EmptyListAnimation';
import PopUpAnimation from '../components/PopUpAnimation';
import OrderHistoryCard from '../components/OrderHistoryCard';
import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const OrderHistoryScreen = ({ navigation }) => {
  const [orderHistoryList, setOrderHistoryList] = useState([]); // state to hold order history data
  const [showAnimation, setShowAnimation] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const user = auth().currentUser;
    if (user) {
      const unsubscribe = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot((doc) => {
          if (doc.exists) {
            const userData = doc.data();
            setIsDarkMode(userData?.mode === 'dark');
          }
        });

      return () => unsubscribe();
    }
  }, []);
  // Fetch order history from Firestore
  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        const userId = 'user-id'; // Replace with actual user ID
        const ordersSnapshot = await firestore()
          .collection('orders')
          .where('userId', '==', userId) // Assuming the order collection has userId field
          .get();

        const ordersData = ordersSnapshot.docs.map(doc => doc.data());
        setOrderHistoryList(ordersData); // Set data to state
      } catch (error) {
        console.error('Error fetching order history:', error);
      }
    };

    fetchOrderHistory();
  }, []); // Empty dependency array to fetch only once on mount

  const navigationHandler = ({ index, id, type }) => {
    navigation.push('Details', {
      index,
      id,
      type,
    });
  };

  const buttonPressHandler = () => {
    setShowAnimation(true);
    setTimeout(() => {
      setShowAnimation(false);
    }, 2000);
  };

  return (
    <View style={[styles.ScreenContainer, { backgroundColor: isDarkMode ? COLORS.primaryBlackHex : COLORS.white }]}>
      <StatusBar backgroundColor={isDarkMode ? COLORS.primaryBlackHex : COLORS.primaryWhiteHex} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {showAnimation ? (
        <PopUpAnimation
          style={styles.LottieAnimation}
          source={require('../lottie/download.json')}
        />
      ) : null}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ScrollViewFlex}>
        <View style={[styles.ScrollViewInnerView, { marginBottom: tabBarHeight }]}>
          <View style={styles.ItemContainer}>
            <HeaderBar title="Order History" />

            {orderHistoryList.length === 0 ? (
              <EmptyListAnimation title="No Order History" />
            ) : (
              <View style={styles.ListItemContainer}>
                {orderHistoryList.map((data, index) => (
                  <OrderHistoryCard
                    key={index.toString()}
                    navigationHandler={navigationHandler}
                    CartList={data.CartList}
                    CartListPrice={data.CartListPrice}
                    OrderDate={data.OrderDate}
                  />
                ))}
              </View>
            )}
          </View>
          {orderHistoryList.length > 0 && (
            <TouchableOpacity style={styles.DownloadButton} onPress={buttonPressHandler}>
              <Text style={styles.ButtonText}>Download</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  ScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  LottieAnimation: {
    height: 250,
  },
  ScrollViewFlex: {
    flexGrow: 1,
  },
  ScrollViewInnerView: {
    flex: 1,
    justifyContent: 'space-between',
  },
  ItemContainer: {
    flex: 1,
  },
  ListItemContainer: {
    paddingHorizontal: SPACING.space_20,
    gap: SPACING.space_30,
  },
  DownloadButton: {
    margin: SPACING.space_20,
    backgroundColor: COLORS.primaryOrangeHex,
    alignItems: 'center',
    justifyContent: 'center',
    height: SPACING.space_36 * 2,
    borderRadius: BORDERRADIUS.radius_20,
  },
  ButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
  },
});

export default OrderHistoryScreen;
