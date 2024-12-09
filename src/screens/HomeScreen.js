import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList, ToastAndroid } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import HeaderBar from '../components/HeaderBar';
import CoffeeCard from '../components/CoffeeCard';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CollectionDisplayNames = {
  'coffee': 'Coffee',
  'tea': 'Tea',
  'blended_beverages': 'Blended Beverages',
  'milk_juice_more': 'Milk, Juice & More'
};

const HomeScreen = ({ navigation }) => {
  const [beverages, setBeverages] = useState({});
  const [originalBeverages, setOriginalBeverages] = useState({});
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [categoryIndex, setCategoryIndex] = useState({ index: 0, category: 'All' });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const ListRef = useRef(null);

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
    const categoriesRef = ['coffee', 'tea', 'blended_beverages', 'milk_juice_more'];
    const beverageData = {};
    const unsubscribeList = categoriesRef.map((collection) =>
      firestore()
        .collection(collection)
        .onSnapshot((snapshot) => {
          const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), collection }));
          beverageData[collection] = data;
          setBeverages((prev) => ({ ...prev, [collection]: data }));
          setOriginalBeverages((prev) => ({ ...prev, [collection]: data }));

          // Update categories after all collections are loaded
          if (Object.keys(beverageData).length === categoriesRef.length) {
            const allData = Object.values(beverageData).flat();
            setCategories(getCategoriesFromData(allData));
          }
        })
    );

    return () => unsubscribeList.forEach((unsubscribe) => unsubscribe());
  }, []);

  const getCategoriesFromData = (data) => {
    let temp = {};
    data.forEach((item) => {
      const displayName = CollectionDisplayNames[item.collection];
      temp[displayName] = (temp[displayName] || 0) + 1;
    });
    let categories = Object.keys(temp);
    categories.unshift('All');
    return categories;
  };

  const filterData = (category, data) => {
    if (category === 'All') return data;

    // Find the collection key for the selected display name
    const matchingCollection = Object.keys(CollectionDisplayNames)
      .find(key => CollectionDisplayNames[key] === category);

    return data.filter((item) => item.collection === matchingCollection);
  };

  const handleSearch = (search) => {
    if (search) {
      ListRef?.current?.scrollToOffset({ animated: true, offset: 0 });
      setCategoryIndex({ index: 0, category: 'All' });

      const filteredBeverages = {};
      Object.keys(originalBeverages).forEach(collection => {
        filteredBeverages[collection] = originalBeverages[collection].filter(item =>
          item.name.toLowerCase().includes(search.toLowerCase())
        );
      });

      setBeverages(filteredBeverages);
    } else {
      resetSearch();
    }
  };

  const resetSearch = () => {
    ListRef?.current?.scrollToOffset({ animated: true, offset: 0 });
    setCategoryIndex({ index: 0, category: 'All' });
    setSearchText('');
    setBeverages(originalBeverages);
  };

  const renderFlatList = (data, title, collectionKey, category) => {
    const filteredData = filterData(category, data);
    if (filteredData.length === 0) {
      return null;
    }

    return (
      <View>
        <View style={styles.SectionHeader}>
          <Text style={[styles.SectionTitle, { color: isDarkMode ? COLORS.primaryWhiteHex : COLORS.primaryBlackHex }]}>{title}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('GenericCategory', { collectionKey })}>
            <Text style={[styles.AllButton, { color: isDarkMode ? COLORS.primaryOrangeHex : COLORS.primaryBlackHex }]}>All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filteredData}
          contentContainerStyle={styles.FlatListContainer}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.CardSeparator} />}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.push('Details', { id: item.id, collection: item.collection })}>
              <CoffeeCard
                {...item}
                price={item.prices[0]}
              />
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  return (
    <View style={[styles.ScreenContainer, { backgroundColor: isDarkMode ? COLORS.primaryBlackHex : COLORS.white }]}>
      <StatusBar backgroundColor={isDarkMode ? COLORS.primaryBlackHex : COLORS.primaryWhiteHex} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ScrollViewFlex}>
        <HeaderBar />
        <Text style={[styles.ScreenTitle, { color: isDarkMode ? COLORS.primaryWhiteHex : COLORS.primaryBlackHex }]}>
          Find the best{'\n'}beverages for you
        </Text>

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
            onChangeText={(text) => {
              setSearchText(text);
              handleSearch(text);
            }}
            placeholderTextColor={COLORS.primaryLightGreyHex}
            style={[styles.TextInputContainer, { color: isDarkMode ? COLORS.primaryWhiteHex : COLORS.primaryBlackHex }]}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={resetSearch}>
              <Ionicons style={styles.InputIcon} name="close" size={FONTSIZE.size_16} color={COLORS.primaryLightGreyHex} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Scroller */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.CategoryScrollViewStyle}>
          {categories.map((category) => {
            // Only show category if it has items in the filtered data
            const hasItems = Object.keys(CollectionDisplayNames)
              .some(collection =>
                filterData(category, beverages[collection] || []).length > 0 ||
                category === 'All'
              );

            if (!hasItems) return null;

            return (
              <View key={category} style={styles.CategoryScrollViewContainer}>
                <TouchableOpacity
                  style={styles.CategoryScrollViewItem}
                  onPress={() => {
                    ListRef?.current?.scrollToOffset({ animated: true, offset: 0 });
                    setCategoryIndex({ index: categories.indexOf(category), category });
                  }}
                >
                  <Text
                    style={[styles.CategoryText, categoryIndex.category === category && { color: COLORS.primaryOrangeHex}]}
                  >
                    {category}
                  </Text>
                  {categoryIndex.category === category && <View style={styles.ActiveCategory} />}
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
        <ScrollView>
          {Object.keys(CollectionDisplayNames).map((collectionKey) => (
            <View key={collectionKey}>
              {renderFlatList(
                beverages[collectionKey] || [],
                CollectionDisplayNames[collectionKey],
                collectionKey,
                categoryIndex.category
              )}
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  AllButton: {
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  SectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_30,
    marginTop: SPACING.space_20,
  },
  SectionTitle: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
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
    marginBottom: SPACING.space_4,
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
    paddingTop: SPACING.space_15,
  },
  CardSeparator: {
    width: 20, // This adds 20 spacing between cards
  },
});

export default HomeScreen;