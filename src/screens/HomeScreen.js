import React, {useRef, useState, useEffect} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ToastAndroid,
  FlatList,
} from 'react-native';
import {useStore} from '../store/store';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import HeaderBar from '../components/HeaderBar';
import CustomIcon from '../components/CustomIcon';
import CoffeeCard from '../components/CoffeeCard';
import {Dimensions} from 'react-native';

const HomeScreen = ({navigation}) => {
  const CoffeeList = useStore(state => state.CoffeeList);
  const BeanList = useStore(state => state.BeanList);
  const addToCart = useStore(state => state.addToCart);
  const calculateCartPrice = useStore(state => state.calculateCartPrice);

  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [categoryIndex, setCategoryIndex] = useState({
    index: 0,
    category: 'All',
  });
  const [sortedCoffee, setSortedCoffee] = useState([]);
  const ListRef = useRef(null);
  const tabBarHeight = useBottomTabBarHeight();

  // Initialize categories and sorted coffee list
  useEffect(() => {
    const initialCategories = getCategoriesFromData(CoffeeList);
    setCategories(initialCategories);
    setSortedCoffee(getCoffeeList('All', CoffeeList));
  }, [CoffeeList]);

  const getCategoriesFromData = data => {
    let temp = {};
    data.forEach(item => {
      temp[item.name] = (temp[item.name] || 0) + 1;
    });
    let categories = Object.keys(temp);
    categories.unshift('All');
    return categories;
  };

  const getCoffeeList = (category, data) => {
    return category === 'All'
      ? data
      : data.filter(item => item.name === category);
  };

  const searchCoffee = search => {
    if (search) {
      ListRef?.current?.scrollToOffset({animated: true, offset: 0});
      setCategoryIndex({index: 0, category: 'All'});
      setSortedCoffee(
        CoffeeList.filter(item =>
          item.name.toLowerCase().includes(search.toLowerCase()),
        ),
      );
    } else {
      resetSearchCoffee();
    }
  };

  const resetSearchCoffee = () => {
    ListRef?.current?.scrollToOffset({animated: true, offset: 0});
    setCategoryIndex({index: 0, category: 'All'});
    setSortedCoffee(CoffeeList);
    setSearchText('');
  };

  const CoffeCardAddToCart = ({
    id,
    index,
    name,
    roasted,
    imagelink_square,
    special_ingredient,
    type,
    prices,
  }) => {
    addToCart({
      id,
      index,
      name,
      roasted,
      imagelink_square,
      special_ingredient,
      type,
      prices,
    });
    calculateCartPrice();
    ToastAndroid.showWithGravity(
      `${name} is Added to Cart`,
      ToastAndroid.SHORT,
      ToastAndroid.CENTER,
    );
  };

  return (
    <View style={styles.ScreenContainer}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
        <HeaderBar />
        <Text style={styles.ScreenTitle}>
          Find the best{'\n'}coffee for you
        </Text>

        {/* Search Input */}
        <View style={styles.InputContainerComponent}>
          <TouchableOpacity onPress={() => searchCoffee(searchText)}>
            <CustomIcon
              style={styles.InputIcon}
              name="search"
              size={FONTSIZE.size_18}
              color={
                searchText.length > 0
                  ? COLORS.primaryOrangeHex
                  : COLORS.primaryLightGreyHex
              }
            />
          </TouchableOpacity>
          <TextInput
            placeholder="Find Your Coffee..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={COLORS.primaryLightGreyHex}
            style={styles.TextInputContainer}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={resetSearchCoffee}>
              <CustomIcon
                style={styles.InputIcon}
                name="close"
                size={FONTSIZE.size_16}
                color={COLORS.primaryLightGreyHex}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Scroller */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.CategoryScrollViewStyle}>
          {categories.map((category, index) => (
            <View key={index} style={styles.CategoryScrollViewContainer}>
              <TouchableOpacity
                style={styles.CategoryScrollViewItem}
                onPress={() => {
                  ListRef?.current?.scrollToOffset({animated: true, offset: 0});
                  setCategoryIndex({index, category});
                  setSortedCoffee(getCoffeeList(category, CoffeeList));
                }}>
                <Text
                  style={[
                    styles.CategoryText,
                    categoryIndex.index === index && {
                      color: COLORS.primaryOrangeHex,
                    },
                  ]}>
                  {category}
                </Text>
                {categoryIndex.index === index && (
                  <View style={styles.ActiveCategory} />
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Coffee Flatlist */}
        <FlatList
          ref={ListRef}
          horizontal
          ListEmptyComponent={
            <View style={styles.EmptyListContainer}>
              <Text style={styles.CategoryText}>No Coffee Available</Text>
            </View>
          }
          showsHorizontalScrollIndicator={false}
          data={sortedCoffee}
          contentContainerStyle={styles.FlatListContainer}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() =>
                navigation.push('Details', {
                  index: item.index,
                  id: item.id,
                  type: item.type,
                })
              }>
              <CoffeeCard
                {...item}
                price={item.prices[2]}
                buttonPressHandler={CoffeCardAddToCart}
              />
            </TouchableOpacity>
          )}
        />

        <Text style={styles.CoffeeBeansTitle}>Coffee Beans</Text>

        {/* Beans Flatlist */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={BeanList}
          contentContainerStyle={[
            styles.FlatListContainer,
            {marginBottom: tabBarHeight},
          ]}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() =>
                navigation.push('Details', {
                  index: item.index,
                  id: item.id,
                  type: item.type,
                })
              }>
              <CoffeeCard
                {...item}
                price={item.prices[2]}
                buttonPressHandler={CoffeCardAddToCart}
              />
            </TouchableOpacity>
          )}
        />
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
    paddingHorizontal: SPACING.space_15,
  },
  CategoryScrollViewItem: {
    alignItems: 'center',
  },
  CategoryText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_4,
  },
  ActiveCategory: {
    height: SPACING.space_10,
    width: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_10,
    backgroundColor: COLORS.primaryOrangeHex,
  },
  FlatListContainer: {
    gap: SPACING.space_20,
    paddingVertical: SPACING.space_20,
    paddingHorizontal: SPACING.space_30,
  },
  EmptyListContainer: {
    width: Dimensions.get('window').width - SPACING.space_30 * 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_36 * 3.6,
  },
  CoffeeBeansTitle: {
    fontSize: FONTSIZE.size_18,
    marginLeft: SPACING.space_30,
    marginTop: SPACING.space_20,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.secondaryLightGreyHex,
  },
});

export default HomeScreen;
