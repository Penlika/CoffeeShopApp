import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  Text,
  Alert 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS, FONTFAMILY, FONTSIZE } from '../theme/theme';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Buffer } from 'buffer';
import { Linking } from 'react-native';

const btoa = (input) => {
  return Buffer.from(input).toString('base64');
};
const parseQueryString = (url) => {
  const queryString = url.split('?')[1];
  const params = {};
  if (queryString) {
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      params[key] = decodeURIComponent(value);
    });
  }
  return params;
};
const PayPalWebViewScreen = ({ navigation, route }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [orderId, setOrderId] = useState(null);
  const amount = route.params.amount;
  const userId = auth().currentUser?.uid;

  // PayPal Sandbox Configuration
  const CLIENT_ID = 'Ab76SZcyZKrYfyNBdEzeXV0hoMd4bKFaADi7JAdIIvmT0XYCQgKv5Pt4gqVtKRGAHONXNqWeTZixUwN_';
  const CLIENT_SECRET = 'EI48cuCqaF7mVTsMoOcPgGGHLH0-f-MH1RSJ7Yz2boWGx_FVZqYnBYCMUlOcfjCnvn0HKtqYkfZLTEKP';
  const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com';
  const RETURN_URL = 'com.coffeeshop.app://payment/return';
  const CANCEL_URL = 'com.coffeeshop.app://payment/cancel';

  useEffect(() => {
    // Set up deep link listener
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Initial deep link check
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);
  
  const handleDeepLink = async ({ url }) => {
    console.log('Received deep link URL:', url);
    
    try {
      const urlParams = parseQueryString(url);
      const payerId = urlParams.PayerID;
      const token = urlParams.token;
      
      if (!payerId || !token) {
        throw new Error('Missing PayerID or token');
      }
      
      if (!orderId) {
        setOrderId(token);
      }
      
      const accessToken = await getAccessToken();
      const captureResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${token}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payer_id: payerId,
        }),
      });

      const captureData = await captureResponse.json();
      console.log('Capture Response:', captureData);

      if (captureData.status === 'COMPLETED') {
        const processResult = await processOrder();
        if (processResult) {
          Alert.alert('Success', 'Payment completed successfully!', [
            { text: 'OK', onPress: () => navigation.navigate('History') },
          ]);
        }
      } else {
        throw new Error(`Payment capture failed: ${captureData.message || captureData.status}`);
      }
    } catch (error) {
      console.error('Deep Link Processing Error:', error);
      Alert.alert('Error', `Payment processing failed: ${error.message}`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  };
  

  const getAccessToken = async () => {
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
  
    const data = await response.json();
    console.log('Access Token Response:', data);
    return data.access_token;
  };

  useEffect(() => {
    const fetchAccessToken = async () => {
      try {
        const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
        });
        const data = await response.json();
  
        if (data.access_token) {
          createOrder(data.access_token);
        } else {
          throw new Error('Failed to get access token');
        }
      } catch (error) {
        console.error('Access Token Error:', error);
        Alert.alert('Error', 'Failed to connect to PayPal');
      }
    };

    const createOrder = async (accessToken) => {
      try {
        const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
              {
                amount: {
                  currency_code: 'USD',
                  value: amount,
                },
              },
            ],
            application_context: {
              return_url: RETURN_URL,
              cancel_url: CANCEL_URL,
            },
          }),
        });
        const data = await response.json();
        console.log('Order Creation Response:', data); // Add logging to inspect the response
    
        if (data.id) {
          setOrderId(data.id);
          const approvalUrl = data.links.find((link) => link.rel === 'approve')?.href;
          if (approvalUrl) {
            setWebViewUrl(approvalUrl);
            setIsLoading(false);
          } else {
            throw new Error('Approval URL not found');
          }
        } else {
          throw new Error('Failed to create order');
        }
      } catch (error) {
        console.error('Order Creation Error:', error);
        Alert.alert('Error', `Failed to create order: ${error.message}`);
        setIsLoading(false); // Make sure to stop loading in case of an error
      }
    };
    
  
    fetchAccessToken();
  }, [amount]);

  const processOrder = async () => {
    try {
      if (!userId) {
        throw new Error('No user ID found');
      }

      const userRef = firestore().collection('users').doc(userId);
      const cartSnapshot = await userRef.collection('cartItems').get();
  
      console.log('Cart Snapshot:', {
        empty: cartSnapshot.empty,
        size: cartSnapshot.size,
        docs: cartSnapshot.docs.map(doc => doc.data())
      });

      if (cartSnapshot.empty) {
        // If cart is empty, check if the amount matches a potential previous order
        const previousOrderQuery = await userRef
          .collection('orderHistory')
          .where('totalAmount', '==', amount)
          .limit(1)
          .get();

        if (!previousOrderQuery.empty) {
          console.log('Found a previous order matching the amount');
          return true;
        }

        throw new Error('Cart is empty and no matching previous order found');
      }
  
      const batch = firestore().batch();
      const cartItems = cartSnapshot.docs;

      // Create order in order history
      const orderHistoryRef = userRef.collection('orderHistory').doc();
      batch.set(orderHistoryRef, {
        items: cartItems.map(doc => doc.data()),
        totalAmount: amount,
        orderedAt: firestore.FieldValue.serverTimestamp(),
        paymentStatus: 'completed',
        paymentMethod: 'PayPal',
      });
      // Delete items from cart
      cartItems.forEach(doc => {
        batch.delete(userRef.collection('cartItems').doc(doc.id));
      });
  
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Order Processing Error:', error);
      console.error('Error Details:', {
        userId,
        amount,
        errorMessage: error.message,
        errorStack: error.stack
      });

      Alert.alert('Error', `Failed to process order: ${error.message}`, [
        { 
          text: 'OK', 
          onPress: () => {
            // Navigate to cart or previous screen
            navigation.navigate('Cart');
          }
        }
      ]);
      return false;
    }
  };

  const handleWebViewNavigationStateChange = (newNavState) => {
    const { url } = newNavState;
    if (url.startsWith('com.coffeeshop.app://')) {
      Linking.openURL(url).catch((err) => 
        console.warn('Failed to open URL:', err)
      );
      return false;
    }
    
    return true;
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
          <Text style={styles.loadingText}>Initializing PayPal...</Text>
        </View>
      )}

      {webViewUrl && (
        <WebView
          source={{ uri: webViewUrl }}
          style={styles.webview}
          onNavigationStateChange={handleWebViewNavigationStateChange}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={(error) => {
            console.error('WebView Error:', error);
            Alert.alert('Error', 'Failed to load payment page');
          }}
          javaScriptEnabled
          domStorageEnabled
          scalesPageToFit
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
  },
  webview: {
    flex: 1,
  },
});

export default PayPalWebViewScreen;