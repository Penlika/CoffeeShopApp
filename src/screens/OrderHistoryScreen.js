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
  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        const userId = auth().currentUser?.uid;
        if (!userId) {
          console.error('No user ID found');
          return;
        }

        const ordersSnapshot = await firestore()
          .collection('users')
          .doc(userId)
          .collection('orderHistory')
          .orderBy('orderedAt', 'desc')
          .get();

          const ordersData = ordersSnapshot.docs.map((doc) => {
            const orderData = doc.data();
            const expandedItems = orderData.items.map((item) => ({
              ...item,
              price: item.prices[0]?.price ?? 0,
              quantity: item.prices[0]?.quantity ?? 1,
              size: item.prices[0]?.size ?? 'N/A',
              roasted: item.prices[0]?.roasted ?? 'Unknown',
              special_ingredient: item.prices[0]?.special_ingredient ?? 'None',
            }));
            return {
              id: doc.id,
              imagelink_square: orderData.imagelink_square ?? 'defaultImageUrl',
              items: expandedItems,
              orderedAt: orderData.orderedAt.toDate(),
              paymentMethod: orderData.paymentMethod,
              paymentStatus: orderData.paymentStatus,
              totalAmount: orderData.totalAmount,
            };
          });

          setOrderHistoryList(ordersData);
      } catch (error) {
        console.error('Error fetching order history:', error);
      }
    };


    fetchOrderHistory();
  }, []);

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
                  key={data.id}
                  navigationHandler={navigationHandler}
                  CartList={data.items}
                  CartListPrice={data.totalAmount}
                  OrderDate={data.orderedAt.toLocaleString()} // Format the date
                  paymentMethod={data.paymentMethod}
                  paymentStatus={data.paymentStatus}
                />
              ))}
            </View>
            )}
          </View>
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
