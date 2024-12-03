import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList } from 'react-native';
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
  const [isDarkMode, setIsDarkMode] = useState(false);  // Default theme mode
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
    setBeverages((prev) => ({
      ...prev,
      coffee: prev.coffee,
      tea: prev.tea,
      blended_beverages: prev.blended_beverages,
      milk_juice_more: prev.milk_juice_more,
    }));
    setSearchText('');
  };

  const addToCart = (item) => {
    ToastAndroid.showWithGravity(`${item.name} added to cart`, ToastAndroid.SHORT, ToastAndroid.CENTER);
    // Handle cart logic here
  };

  const renderFlatList = (data, title, category) => (
    <>
      <Text style={styles.CoffeeBeansTitle}>{title}</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={filterData(category, data)}
        contentContainerStyle={styles.FlatListContainer}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.push('Details', { id: item.id })}>
            <CoffeeCard {...item} price={item.prices[0]} buttonPressHandler={() => addToCart(item)} />
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
          {categories.map((category, index) => (
            <View key={index} style={styles.CategoryScrollViewContainer}>
              <TouchableOpacity
                style={styles.CategoryScrollViewItem}
                onPress={() => {
                  ListRef?.current?.scrollToOffset({ animated: true, offset: 0 });
                  setCategoryIndex({ index, category });
                }}
              >
                <Text
                  style={[styles.CategoryText, categoryIndex.index === index && { color: COLORS.primaryOrangeHex }]}
                >
                  {category}
                </Text>
                {categoryIndex.index === index && <View style={styles.ActiveCategory} />}
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
        ].map(({ collection, title }) => {
          const data = beverages[collection] || [];
          return renderFlatList(data, title, categoryIndex.category);
        })}
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
    paddingHorizontal: SPACING.space_20,
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
