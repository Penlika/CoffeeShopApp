import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import PaymentMethod from '../components/PaymentMethod';
import PaymentFooter from '../components/PaymentFooter';
import PopUpAnimation from '../components/PopUpAnimation';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const PaymentList = [
  {
    name: 'PayPal',
    icon: require('../assets/paypal.png'),
    isIcon: false,
  },
];

const PaymentScreen = ({navigation, route}) => {
  const [paymentMode, setPaymentMode] = useState('Credit Card');
  const [showAnimation, setShowAnimation] = useState(false);
  const [isEditingCreditCard, setIsEditingCreditCard] = useState(false);
  
  // Credit Card State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const userId = auth().currentUser?.uid;

  // Fetch existing credit card data
  useEffect(() => {
    const fetchCreditCardData = async () => {
      try {
        const userDoc = await firestore()
          .collection('users')
          .doc(userId)
          .get();
        
        const creditCardData = userDoc.data()?.creditCard;
        if (creditCardData) {
          setCardNumber(creditCardData.cardNumber || '');
          setCardHolderName(creditCardData.cardHolderName || '');
          setExpiryDate(creditCardData.expiryDate || '');
          setCvv(creditCardData.cvv || '');
        }
      } catch (error) {
        console.error('Error fetching credit card data:', error);
      }
    };

    if (userId) {
      fetchCreditCardData();
    }
  }, [userId]);

  // Save Credit Card Information
  const saveCreditCardInfo = async () => {
    // Validate inputs
    if (!cardNumber || !cardHolderName || !expiryDate || !cvv) {
      Alert.alert('Error', 'Please fill in all credit card details');
      return;
    }

    // Validate card number (assuming 16 digits)
    if (!/^\d{16}$/.test(cardNumber)) {
      Alert.alert('Error', 'Invalid card number. Must be 16 digits.');
      return;
    }

    // Validate expiry date (MM/YY format)
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      Alert.alert('Error', 'Invalid expiry date. Use MM/YY format.');
      return;
    }

    // Validate CVV (3 or 4 digits)
    if (!/^\d{3,4}$/.test(cvv)) {
      Alert.alert('Error', 'Invalid CVV. Must be 3 or 4 digits.');
      return;
    }

    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          creditCard: {
            cardNumber,
            cardHolderName,
            expiryDate,
            cvv
          }
        });
      
      setIsEditingCreditCard(false);
      Alert.alert('Success', 'Credit card information saved');
    } catch (error) {
      console.error('Error saving credit card info:', error);
      Alert.alert('Error', 'Failed to save credit card information');
    }
  };

  const calculateCartPrice = async () => {
    try {
      const cartSnapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('cart')
        .get();

      const cartItems = cartSnapshot.docs.map(doc => doc.data());
      const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

      return totalPrice;
    } catch (error) {
      console.error('Error calculating cart price:', error);
      return 0;
    }
  };

  const addToOrderHistoryListFromCart = async () => {
    try {
      const cartSnapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('cart')
        .get();
  
      const orderItems = cartSnapshot.docs.map(doc => doc.data());
      const batch = firestore().batch();
  
      orderItems.forEach(item => {
        const orderDoc = firestore()
          .collection('users')
          .doc(userId)
          .collection('orderHistory')
          .doc();
  
        batch.set(orderDoc, item);
      });
  
      const cartCollection = firestore()
        .collection('users')
        .doc(userId)
        .collection('cart');
      
      cartSnapshot.docs.forEach(doc => {
        batch.delete(cartCollection.doc(doc.id));
      });
  
      await batch.commit();
    } catch (error) {
      console.error('Error moving items to order history:', error);
    }
  };

  const handleExpiryDateChange = (text) => {
    // Remove any non-digit characters
    const cleanText = text.replace(/\D/g, '');
    
    if (cleanText.length <= 4) {
      // First two digits (month)
      if (cleanText.length <= 2) {
        // Restrict month to 01-12
        const month = parseInt(cleanText, 10);
        if (month > 12) {
          return;
        }
      }
      
      // Add '/' after first two digits
      if (cleanText.length > 2) {
        const formattedText = `${cleanText.slice(0, 2)}/${cleanText.slice(2)}`;
        
        // Additional validation for days based on month
        const month = parseInt(cleanText.slice(0, 2), 10);
        const day = parseInt(cleanText.slice(2), 10);
        
        // Day validation
        const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (day > daysInMonth[month - 1]) {
          return;
        }
        
        setExpiryDate(formattedText);
      } else {
        setExpiryDate(cleanText);
      }
    }
  };

  const buttonPressHandler = async () => {
    // Check if credit card details are empty before proceeding
    if (paymentMode === 'Credit Card' && (!cardNumber || !cardHolderName || !expiryDate || !cvv)) {
      setIsEditingCreditCard(true);
      Alert.alert('Credit Card Required', 'Please enter your credit card details before proceeding.');
      return;
    }
  
    try {
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
  
      // Fetch cart items
      const userRef = firestore().collection('users').doc(userId);
      const cartSnapshot = await userRef.collection('cartItems').get();
  
      if (cartSnapshot.empty) {
        Alert.alert('Error', 'Your cart is empty');
        return;
      }
  
      // PayPal navigation remains the same
      if (paymentMode === 'PayPal') {
        navigation.navigate('PayPalWebView', { 
          amount: route.params.amount 
        });
        return;
      }
  
      // Process Credit Card Payment
      const batch = firestore().batch();
      const cartItems = cartSnapshot.docs;
  
      // Create order in order history
      const orderHistoryRef = userRef.collection('orderHistory').doc();
      batch.set(orderHistoryRef, {
        items: cartItems.map(doc => doc.data()),
        totalAmount: route.params.amount,
        orderedAt: firestore.FieldValue.serverTimestamp(),
        paymentStatus: 'completed',
        paymentMethod: 'Credit Card',
        cardLastFourDigits: cardNumber.slice(-4)
      });
  
      // Delete items from cart
      cartItems.forEach(doc => {
        batch.delete(userRef.collection('cartItems').doc(doc.id));
      });
  
      // Show loading animation
      setShowAnimation(true);
  
      // Commit the batch
      await batch.commit();
  
      // Delay and navigation
      setTimeout(() => {
        setShowAnimation(false);
        navigation.navigate('History');
      }, 2000);
  
    } catch (error) {
      console.error('Payment process error:', error);
      setShowAnimation(false);
      Alert.alert('Payment Error', `An error occurred during payment: ${error.message}`);
    }
  };

  const renderCreditCardContent = () => {
    if (isEditingCreditCard) {
      return (
        <View style={styles.CreditCardBG}>
          <TextInput
            style={styles.CreditCardInput}
            placeholder="Card Number"
            placeholderTextColor={COLORS.secondaryLightGreyHex}
            value={cardNumber}
            onChangeText={setCardNumber}
            keyboardType="numeric"
            maxLength={16}
          />
          <TextInput
            style={styles.CreditCardInput}
            placeholder="Card Holder Name"
            placeholderTextColor={COLORS.secondaryLightGreyHex}
            value={cardHolderName}
            onChangeText={setCardHolderName}
          />
          <View style={styles.CreditCardRowInput}>
            <TextInput
              style={[styles.CreditCardInput, {flex: 1, marginRight: 10}]}
              placeholder="Expiry Date (MM/YY)"
              placeholderTextColor={COLORS.secondaryLightGreyHex}
              value={expiryDate}
              onChangeText={handleExpiryDateChange}
              keyboardType="numeric"
              maxLength={5}
            />
            <TextInput
              style={[styles.CreditCardInput, {flex: 1}]}
              placeholder="CVV"
              placeholderTextColor={COLORS.secondaryLightGreyHex}
              value={cvv}
              onChangeText={setCvv}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>
          <TouchableOpacity 
            style={styles.SaveButton} 
            onPress={saveCreditCardInfo}
          >
            <Text style={styles.SaveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.CreditCardBG}>
        <LinearGradient
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.LinearGradientStyle}
          colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}>
          <View style={styles.CreditCardRow}>
            <Icon
              name="credit-card"
              size={FONTSIZE.size_20 * 2}
              color={COLORS.primaryOrangeHex}
            />
            <TouchableOpacity onPress={() => setIsEditingCreditCard(true)}>
              <Icon
                name="edit"
                size={FONTSIZE.size_20}
                color={COLORS.primaryWhiteHex}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.CreditCardNumberContainer}>
            {cardNumber ? (
              <>
                <Text style={styles.CreditCardNumber}>{cardNumber.slice(0,4)}</Text>
                <Text style={styles.CreditCardNumber}>{cardNumber.slice(4,8)}</Text>
                <Text style={styles.CreditCardNumber}>{cardNumber.slice(8,12)}</Text>
                <Text style={styles.CreditCardNumber}>{cardNumber.slice(12)}</Text>
              </>
            ) : (
              <Text style={styles.PlaceholderText}>No card details</Text>
            )}
          </View>
          <View style={styles.CreditCardRow}>
            <View style={styles.CreditCardNameContainer}>
              <Text style={styles.CreditCardNameSubitle}>
                Card Holder Name
              </Text>
              <Text style={styles.CreditCardNameTitle}>
                {cardHolderName || 'Not set'}
              </Text>
            </View>
            <View style={styles.CreditCardDateContainer}>
              <Text style={styles.CreditCardNameSubitle}>
                Expiry Date
              </Text>
              <Text style={styles.CreditCardNameTitle}>
                {expiryDate || 'Not set'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />

      {showAnimation ? (
        <PopUpAnimation
          style={styles.LottieAnimation}
          source={require('../lottie/successful.json')}
        />
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
        <View style={styles.HeaderContainer}>
          <TouchableOpacity
            onPress={() => {
              navigation.pop();
            }}>
            <View style={styles.Container}>
              <LinearGradient
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                colors={[COLORS.primaryGreyHex, COLORS.primaryBlackHex]}
                style={styles.LinearGradientBG}>
                <Icon name={"arrow-left"} color={"white"} size={20} />
              </LinearGradient>
            </View>
          </TouchableOpacity>
          <Text style={styles.HeaderText}>Payments</Text>
          <View style={styles.EmptyView} />
        </View>

        <View style={styles.PaymentOptionsContainer}>
          <TouchableOpacity
            onPress={() => {
              setPaymentMode('Credit Card');
            }}>
            <View
              style={[
                styles.CreditCardContainer,
                {
                  borderColor:
                    paymentMode === 'Credit Card'
                      ? COLORS.primaryOrangeHex
                      : COLORS.primaryGreyHex,
                },
              ]}>
              <Text style={styles.CreditCardTitle}>Credit Card</Text>
              {renderCreditCardContent()}
            </View>
          </TouchableOpacity>
          {PaymentList.map(data => (
            <TouchableOpacity
              key={data.name}
              onPress={() => {
                setPaymentMode(data.name);
              }}>
              <PaymentMethod
                paymentMode={paymentMode}
                name={data.name}
                icon={data.icon}
                isIcon={data.isIcon }
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <PaymentFooter
        buttonTitle={`Pay with ${paymentMode}`}
        price={{price: route.params.amount, currency: '$'}}
        buttonPressHandler={buttonPressHandler}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // ... existing styles ...
  CreditCardInput: {
    backgroundColor: COLORS.primaryGreyHex,
    color: COLORS.primaryWhiteHex,
    padding: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_10,
    marginBottom: SPACING.space_10,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
  },
  CreditCardRowInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_10,
  },
  SaveButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    padding: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_10,
    alignItems: 'center',
  },
  SaveButtonText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
  },
  PlaceholderText: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_16,
  },
  ScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  LottieAnimation: {
    flex: 1,
  },
  ScrollViewFlex: {
    flexGrow: 1,
  },
  HeaderContainer: {
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  HeaderText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
  },
  EmptyView: {
    height: SPACING.space_36,
    width: SPACING.space_36,
  },
  PaymentOptionsContainer: {
    padding: SPACING.space_15,
    gap: SPACING.space_15,
  },
  CreditCardContainer: {
    padding: SPACING.space_10,
    gap: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_15 * 2,
    borderWidth: 3,
  },
  CreditCardTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginLeft: SPACING.space_10,
  },
  CreditCardBG: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_25,
  },
  LinearGradientStyle: {
    borderRadius: BORDERRADIUS.radius_25,
    gap: SPACING.space_36,
    paddingHorizontal: SPACING.space_15,
    paddingVertical: SPACING.space_10,
  },
  CreditCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  CreditCardNumberContainer: {
    flexDirection: 'row',
    gap: SPACING.space_10,
    alignItems: 'center',
  },
  CreditCardNumber: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
    letterSpacing: SPACING.space_4 + SPACING.space_2,
  },
  CreditCardNameSubitle: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
  },
  CreditCardNameTitle: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
  },
  CreditCardNameContainer: {
    alignItems: 'flex-start',
  },
  CreditCardDateContainer: {
    alignItems: 'flex-end',
  },
  Container: {
    borderWidth: 2,
    borderColor: COLORS.secondaryDarkGreyHex,
    borderRadius: SPACING.space_12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondaryDarkGreyHex,
    overflow: 'hidden',
    height: SPACING.space_36,
    width: SPACING.space_36,
  },
  LinearGradientBG: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SPACING.space_12,
  },
});

export default PaymentScreen;
