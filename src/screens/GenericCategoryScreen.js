import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, Text, StyleSheet, StatusBar, TextInput, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { COLORS, FONTSIZE, SPACING } from '../theme/theme';
import GenericCard from '../components/GenericCard';
import auth from '@react-native-firebase/auth';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CollectionDisplayNames = {
  coffee: 'Coffee',
  tea: 'Tea',
  blended_beverages: 'Blended Beverages',
  milk_juice_more: 'Milk, Juice & More',
};

const GenericCategoryScreen = ({ route, navigation }) => {
  const { collectionKey } = route.params;
  const [items, setItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const ListRef = useRef(null); // Reference for FlatList to control scroll position

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
    const unsubscribe = firestore()
      .collection(collectionKey)
      .onSnapshot((snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setItems(data);
        setOriginalItems(data); // Storing original data to reset later
        setFilteredItems(data); // Initialize filteredItems with all items
      });

    return () => unsubscribe();
  }, [collectionKey]);

  const handleSearch = (search) => {
    setSearchText(search);
    if (search) {
      ListRef?.current?.scrollToOffset({ animated: true, offset: 0 });
      const filtered = originalItems.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      resetSearch();
    }
  };

  const resetSearch = () => {
    ListRef?.current?.scrollToOffset({ animated: true, offset: 0 });
    setSearchText('');
    setFilteredItems(originalItems);
  };

  return (
    <View style={[styles.ScreenContainer, { backgroundColor: isDarkMode ? COLORS.primaryBlackHex : COLORS.white }]}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} barStyle="light-content" />
      <Text style={[styles.ScreenTitle ,{ color: isDarkMode ? COLORS.primaryWhiteHex : COLORS.primaryBlackHex }]}>{CollectionDisplayNames[collectionKey]}</Text>
      
      {/* Search Bar */}
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
          onChangeText={handleSearch}
          placeholderTextColor={COLORS.primaryLightGreyHex}
          style={styles.TextInputContainer}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={resetSearch}>
            <Ionicons style={styles.InputIcon} name="close" size={FONTSIZE.size_16} color={COLORS.primaryLightGreyHex} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={ListRef}
        data={filteredItems}
        contentContainerStyle={styles.FlatListContainer}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GenericCard
            {...item}
            name={item.name}
            subtitle={item.special_ingredient}
            rating={item.average_rating}
            image={item.imagelink_square}
            price={item.prices?.[0]?.price || '0.00'}
            onPress={() =>
              navigation.push('Details', { id: item.id, collection: collectionKey })
            }
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  ScreenContainer: {
    flex: 1,
  },
  ScreenTitle: {
    fontSize: FONTSIZE.size_28,
    color: COLORS.primaryWhiteHex,
    padding: SPACING.space_20,
  },
  FlatListContainer: {
    padding: SPACING.space_20,
  },
  InputContainerComponent: {
    flexDirection: 'row',
    margin: SPACING.space_30,
    borderRadius: 20,
    backgroundColor: COLORS.primaryDarkGreyHex,
    alignItems: 'center',
  },
  InputIcon: {
    marginHorizontal: SPACING.space_20,
  },
  TextInputContainer: {
    flex: 1,
    height: 40,
    fontFamily: 'Poppins-Medium',
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
});

export default GenericCategoryScreen;
