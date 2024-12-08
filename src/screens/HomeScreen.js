import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList, ToastAndroid } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import HeaderBar from '../components/HeaderBar';
import CoffeeCard from '../components/CoffeeCard';
import Ionicons from 'react-native-vector-icons/Ionicons';

const HomeScreen = ({ navigation }) => {
  const [beverages, setBeverages] = useState({});
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [categoryIndex, setCategoryIndex] = useState({ index: 0, category: 'All' });
  const [isDarkMode, setIsDarkMode] = useState(false); // Default theme mode
  const ListRef = useRef(null);

  useEffect(() => {
    // Get current user and fetch their theme mode
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
    const categoriesRef = ['coffee', 'tea', 'blended_beverages', 'milk_juice_more'];
    const unsubscribeList = categoriesRef.map((collection) =>
      firestore()
        .collection(collection)
        .onSnapshot((snapshot) => {
          const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setBeverages((prev) => ({ ...prev, [collection]: data }));
          if (collection === 'coffee') setCategories(getCategoriesFromData(data));
        })
    );

    return () => unsubscribeList.forEach((unsubscribe) => unsubscribe());
  }, []);

  const getCategoriesFromData = (data) => {
    let temp = {};
    data.forEach((item) => (temp[item.name] = (temp[item.name] || 0) + 1));
    let categories = Object.keys(temp);
    categories.unshift('All');
    return categories;
  };

  const filterData = (category, data) => {
    return category === 'All' ? data : data.filter((item) => item.name === category);
  };

  const handleSearch = (search) => {
    if (search) {
      ListRef?.current?.scrollToOffset({ animated: true, offset: 0 });
      setCategoryIndex({ index: 0, category: 'All' });
      setBeverages((prev) => ({
        ...prev,
        coffee: prev.coffee.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
        tea: prev.tea.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
        blended_beverages: prev.blended_beverages.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
        milk_juice_more: prev.milk_juice_more.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
      }));
    } else {
      resetSearch();
    }
  };

  const resetSearch = () => {
    ListRef?.current?.scrollToOffset({ animated: true, offset: 0 });
    setCategoryIndex({ index: 0, category: 'All' });
    setSearchText('');
  };

  const addToCart = async (item, price) => {
    const userId = auth().currentUser?.uid;
  
    if (!userId) {
      console.error("User is not logged in");
      return;
    }
  
    try {
      // Reference to the user's cart collection
      const cartRef = firestore().collection('users').doc(userId).collection('cartItems');
  
      // Create the cart item object with the prices array structure
      const cartItem = {
        name: item.name,
        roasted: item.roasted || "Unknown",
        imagelink_square: item.imagelink_square,
        special_ingredient: item.special_ingredient || "None",
        type: item.type,
        prices: [{
          size: price.size,
          price: price.price,
          quantity: 1,
          currency: '$'
        }],
        totalPrice: price.price
      };
  
      // Check if item already exists in cart with the same size
      const existingItemQuery = await cartRef
        .where('name', '==', cartItem.name)
        .where('prices.0.size', '==', price.size)
        .get();
  
      if (!existingItemQuery.empty) {
        // If item exists, update quantity
        const existingItemDoc = existingItemQuery.docs[0];
        const currentData = existingItemDoc.data();
        const currentQuantity = currentData.prices[0].quantity || 0;
  
        await existingItemDoc.ref.update({
          'prices.0.quantity': currentQuantity + 1,
          totalPrice: (currentQuantity + 1) * price.price
        });
      } else {
        // If item doesn't exist, add new item to cart
        await cartRef.add(cartItem);
      }
  
      // Provide user feedback
      ToastAndroid.showWithGravity(`${item.name} added to cart`, ToastAndroid.SHORT, ToastAndroid.CENTER);
  
      // Optional: Navigate to the cart screen
      // navigation.navigate('Cart');
  
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };
  

  const renderFlatList = (data, title, category) => (
    <>
      <Text style={styles.CoffeeBeansTitle}>{title}</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={filterData(category, data)}
        contentContainerStyle={styles.FlatListContainer}
        keyExtractor={(item) => item.id} // Ensure every item has a unique id
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.push('Details', { id: item.id })}>
            <CoffeeCard
              {...item}
              price={item.prices[0]}
              buttonPressHandler={() => addToCart(item, item.prices[0])}
            />
          </TouchableOpacity>
        )}
      />
    </>
  );

  return (
    <View style={[styles.ScreenContainer, { backgroundColor: isDarkMode ? COLORS.primaryBlackHex : COLORS.white }]}>
      <StatusBar backgroundColor={isDarkMode ? COLORS.primaryBlackHex : COLORS.primaryWhiteHex} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ScrollViewFlex}>
        <HeaderBar />
        <Text style={styles.ScreenTitle}>Find the best{'\n'}beverages for you</Text>

        {/* Search Input */}
        <View style={styles.InputContainerComponent}>
          <TouchableOpacity onPress={() => handleSearch(searchText)}>
            <Ionicons
              style={styles.InputIcon}
              name="search"
              size={FONTSIZE.size_18}
              color={searchText.length > 0 ? COLORS.primaryOrangeHex : COLORS.primaryLightGreyHex}
            />
          </TouchableOpacity>
          <TextInput
            placeholder="Find Your Beverage..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={COLORS.primaryLightGreyHex}
            style={styles.TextInputContainer}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={resetSearch}>
              <Ionicons style={styles.InputIcon} name="close" size={FONTSIZE.size_16} color={COLORS.primaryLightGreyHex} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Scroller */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.CategoryScrollViewStyle}>
          {categories.map((category) => (
            <View key={category} style={styles.CategoryScrollViewContainer}>
              <TouchableOpacity
                style={styles.CategoryScrollViewItem}
                onPress={() => {
                  ListRef?.current?.scrollToOffset({ animated: true, offset: 0 });
                  setCategoryIndex({ index: categories.indexOf(category), category });
                }}
              >
                <Text
                  style={[styles.CategoryText, categoryIndex.category === category && { color: COLORS.primaryOrangeHex }]}
                >
                  {category}
                </Text>
                {categoryIndex.category === category && <View style={styles.ActiveCategory} />}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Render beverage lists */}
        {[
          { collection: 'coffee', title: 'Coffee' },
          { collection: 'tea', title: 'Tea' },
          { collection: 'blended_beverages', title: 'Blended Beverages' },
          { collection: 'milk_juice_more', title: 'Milk, Juice & More' },
        ].map(({ collection, title }) => (
          <View key={collection}>
            {renderFlatList(beverages[collection] || [], title, categoryIndex.category)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  ScreenContainer: {
    flex: 1,
  },
  ScrollViewFlex: {
    flexGrow: 1,
  },
  ScreenTitle: {
    fontSize: FONTSIZE.size_28,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    paddingLeft: SPACING.space_30,
  },
  InputContainerComponent: {
    flexDirection: 'row',
    margin: SPACING.space_30,
    borderRadius: BORDERRADIUS.radius_20,
    backgroundColor: COLORS.primaryDarkGreyHex,
    alignItems: 'center',
  },
  InputIcon: {
    marginHorizontal: SPACING.space_20,
  },
  TextInputContainer: {
    flex: 1,
    height: SPACING.space_20 * 3,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  CategoryScrollViewStyle: {
    paddingHorizontal: SPACING.space_36,
    marginBottom: SPACING.space_20,
  },
  CategoryScrollViewContainer: {
    marginRight: SPACING.space_15,
  },
  CategoryScrollViewItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  CategoryText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryLightGreyHex,
  },
  ActiveCategory: {
    marginTop: SPACING.space_10,
    width: SPACING.space_60,
    height: 2,
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: 50,
  },
  CoffeeBeansTitle: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_20,
    paddingLeft: SPACING.space_30,
  },
  FlatListContainer: {
    paddingLeft: SPACING.space_30,
  },
});

export default HomeScreen;
