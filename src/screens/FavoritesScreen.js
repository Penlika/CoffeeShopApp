import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { COLORS, SPACING } from '../theme/theme';
import HeaderBar from '../components/HeaderBar';
import EmptyListAnimation from '../components/EmptyListAnimation';
import FavoritesItemCard from '../components/FavoritesItemCard';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const FavoritesScreen = ({ navigation }) => {
  const [favoritesList, setFavoritesList] = useState([]);
  const [loading, setLoading] = useState(true);
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
    const currentUser = auth().currentUser;

    if (!currentUser) {
      console.error('No user is currently logged in.');
      setLoading(false);
      return;
    }

    const userId = currentUser.uid;
    const favoritesRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('favorites');

    // Set up the real-time listener
    const unsubscribe = favoritesRef.onSnapshot(
      (snapshot) => {
        if (!snapshot.empty) {
          const fetchedFavorites = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setFavoritesList(fetchedFavorites);
        } else {
          setFavoritesList([]);
        }
        setLoading(false); // Stop loading after the first fetch
      },
      (error) => {
        console.error('Error listening to favorites:', error);
        setLoading(false);
      }
    );

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const deleteFromFavoriteList = async (id) => {
    try {
      const currentUser = auth().currentUser;

      if (!currentUser) {
        console.error('No user is currently logged in.');
        return;
      }

      const userId = currentUser.uid;
      const favoriteRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('favorites')
        .doc(id);

      await favoriteRef.delete();
    } catch (error) {
      console.error('Error deleting favorite:', error);
    }
  };

  const ToggleFavourite = async (favourite, id) => {
    if (favourite) {
      await deleteFromFavoriteList(id);
    }
  };

  return (
    <View style={[styles.ScreenContainer, { backgroundColor: isDarkMode ? COLORS.primaryBlackHex : COLORS.white }]}>
      <StatusBar backgroundColor={isDarkMode ? COLORS.primaryBlackHex : COLORS.primaryWhiteHex} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ScrollViewFlex}>
          <View
            style={[styles.ScrollViewInnerView, { marginBottom: tabBarHeight }]}>
            <View style={styles.ItemContainer}>
              <HeaderBar title="Favourites" />

              {favoritesList.length === 0 ? (
                <EmptyListAnimation title={'No Favourites'} />
              ) : (
                <View style={styles.ListItemContainer}>
                  {favoritesList.map((data) => (
                    <TouchableOpacity
                      onPress={() => {
                        navigation.push('Details', {
                          index: data.index,
                          id: data.id,
                          type: data.type,
                        });
                      }}
                      key={data.id}>
                      <FavoritesItemCard
                        id={data.id}
                        imagelink_portrait={data.imagelink_square} // Match your Firebase data structure
                        name={data.name}
                        special_ingredient={data.special_ingredient}
                        type={data.type}
                        ingredients={data.ingredients}
                        average_rating={data.average_rating}
                        ratings_count={data.ratings_count}
                        description={data.description || ''}
                        favourite={true}
                        ToggleFavouriteItem={() => ToggleFavourite(true, data.id)}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}
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

export default FavoritesScreen;
