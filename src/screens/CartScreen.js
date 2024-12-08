import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { COLORS, SPACING } from '../theme/theme';
import HeaderBar from '../components/HeaderBar';
import EmptyListAnimation from '../components/EmptyListAnimation';
import PaymentFooter from '../components/PaymentFooter';
import CartItem from '../components/CartItem';

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartPrice, setCartPrice] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();

  // Calculate cart price directly from cartItems state
  const calculateCartPrice = (items) => {
    return items.reduce((total, item) => {
      const price = item.prices[0]?.price || 0;
      const quantity = item.prices[0]?.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };
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
    const fetchCartItems = async () => {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        console.log('No user ID found');
        return;
      }
      try {
        const unsubscribe = firestore()
          .collection('users')
          .doc(userId)
          .collection('cartItems')
          .onSnapshot(snapshot => {
            const items = snapshot.docs.map(doc => {
              const data = doc.data();
              // Normalize prices to always be an array
              const normalizedPrices = Array.isArray(data.prices) 
                ? data.prices 
                : data.prices && typeof data.prices === 'object' 
                  ? [data.prices['0'] || { price: 0, quantity: 1, size: '', currency: '$' }]
                  : [{ 
                      price: data.totalPrice || 0,
                      quantity: 1,
                      size: '',
                      currency: '$'
                    }];
              // Ensure price and quantity are properly typed
              const processedPrices = normalizedPrices.map(price => ({
                price: parseFloat(price.price || 0),
                quantity: parseInt(price.quantity || 1),
                size: price.size || '',
                currency: price.currency || '$'
              }));
              return {
                id: doc.id,
                ...data,
                prices: processedPrices
              };
            });
            setCartItems(items);
            setCartPrice(calculateCartPrice(items));
          }, error => {
            console.error('Snapshot error:', error);
          });
        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching cart items:', error);
      }
    };
    fetchCartItems();
  }, []);

  const buttonPressHandler = () => {
    navigation.push('Payment', { amount: cartPrice });
  };

  const incrementCartItemQuantityHandler = async (id) => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;
    try {
      const cartItemRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('cartItems')
        .doc(id);
      const doc = await cartItemRef.get();
      if (doc.exists) {
        const currentData = doc.data();
        const currentQuantity = currentData?.prices[0]?.quantity || 0;
        const originalPrice = currentData?.prices[0]?.price || 0;
        const originalSize = currentData?.prices[0]?.size || '';
        const updatedQuantity = currentQuantity + 1;
        await cartItemRef.update({
          'prices.0.quantity': updatedQuantity,
          'prices.0.price': originalPrice,
          'prices.0.size': originalSize,
          totalPrice: originalPrice * updatedQuantity,
        });
        // Update local state with new quantity and recalculate total cart price
        const updatedCartItems = cartItems.map((item) =>
          item.id === id
            ? {
                ...item,
                prices: [{
                  price: originalPrice,
                  size: originalSize,
                  quantity: updatedQuantity
                }],
              }
            : item
        );
  
        setCartItems(updatedCartItems);
        setCartPrice(calculateCartPrice(updatedCartItems)); // Recalculate total cart price
      }
    } catch (error) {
      console.error('Error incrementing quantity:', error);
    }
  };
  
  const decrementCartItemQuantityHandler = async (id) => {
    const userId = auth().currentUser?.uid;
    if (!userId) return;
  
    try {
      const cartItemRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('cartItems')
        .doc(id);
  
      const doc = await cartItemRef.get();
      if (doc.exists) {
        const currentData = doc.data();
        const currentQuantity = currentData?.prices[0]?.quantity || 0;
        const originalPrice = currentData?.prices[0]?.price || 0;
        const originalSize = currentData?.prices[0]?.size || '';
  
        if (currentQuantity > 1) {
          const updatedQuantity = currentQuantity - 1;
  
          await cartItemRef.update({
            'prices.0.quantity': updatedQuantity,
            'prices.0.price': originalPrice,
            'prices.0.size': originalSize,
            totalPrice: originalPrice * updatedQuantity,
          });
  
          // Update local state with new quantity and recalculate total cart price
          const updatedCartItems = cartItems.map((item) =>
            item.id === id
              ? {
                  ...item,
                  prices: [{
                    price: originalPrice,
                    size: originalSize,
                    quantity: updatedQuantity
                  }],
                }
              : item
          );
  
          setCartItems(updatedCartItems);
          setCartPrice(calculateCartPrice(updatedCartItems)); // Recalculate total cart price
        } else {
          // If quantity is 1, delete the item from the cart
          await cartItemRef.delete();
          
          // Remove item from local state and recalculate total cart price
          const updatedCartItems = cartItems.filter(item => item.id !== id);
          setCartItems(updatedCartItems);
          setCartPrice(calculateCartPrice(updatedCartItems)); // Recalculate total cart price
        }
      }
    } catch (error) {
      console.error('Error decrementing quantity:', error);
    }
  };

  return (
    <View style={[styles.ScreenContainer, { backgroundColor: isDarkMode ? COLORS.primaryBlackHex : COLORS.white }]}>
      <StatusBar backgroundColor={isDarkMode ? COLORS.primaryBlackHex : COLORS.primaryWhiteHex} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
        <View
          style={[styles.ScrollViewInnerView, { marginBottom: tabBarHeight }]}>
          <View style={styles.ItemContainer}>
            <HeaderBar title="Cart" />
            {cartItems.length === 0 ? (
              <EmptyListAnimation title="Cart is Empty" />
            ) : (
              <View style={styles.ListItemContainer}>
                {cartItems.map(data => (
                    <TouchableOpacity
                    onPress={() => {
                      navigation.push('Details', {
                        index: data.index,
                        id: data.id,
                        type: data.type,
                      });
                    }}
                    key={data.id}>
                    <CartItem
                      id={data.id}
                      name={data.name}
                      imagelink_square={data.imagelink_square}
                      special_ingredient={data.special_ingredient}
                      roasted={data.roasted}
                      prices={data.prices}
                      type={data.type}
                      incrementCartItemQuantityHandler={incrementCartItemQuantityHandler}
                      decrementCartItemQuantityHandler={decrementCartItemQuantityHandler}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          {cartItems.length !== 0 && (
            <PaymentFooter
              buttonPressHandler={buttonPressHandler}
              buttonTitle="Pay"
              price={{ price: cartPrice, currency: '$' }}
            />
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
    gap: SPACING.space_20,
  },
});

export default CartScreen;
