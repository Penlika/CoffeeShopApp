import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import FontAwesome icons
import firestore from '@react-native-firebase/firestore'; // Firestore integration
import auth from '@react-native-firebase/auth'; // Firebase Auth integration
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';

const ImageBackgroundInfo = ({
  EnableBackHandler,
  imagelink_portrait,
  type,
  id,
  name,
  special_ingredient,
  ingredients,
  average_rating,
  ratings_count,
  roasted,
  BackHandler,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch the current favorite status for the item
  useEffect(() => {
    const fetchFavoriteStatus = async () => {
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

        const doc = await favoriteRef.get();
        setIsFavorite(doc.exists); // Check if the item is already a favorite
      } catch (error) {
        console.error('Error fetching favorite status:', error);
      }
    };

    fetchFavoriteStatus();
  }, [id]);

  // Toggle favorite status
  const handleToggleFavorite = async () => {
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

      if (isFavorite) {
        // Remove from favorites
        await favoriteRef.delete();
        setIsFavorite(false);
      } else {
        // Add to favorites
        await favoriteRef.set({
          name,
          imagelink_square: imagelink_portrait,
          special_ingredient,
          roasted,
          type,
          timestamp: firestore.FieldValue.serverTimestamp(),
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  return (
    <View>
      <ImageBackground
        source={{ uri: imagelink_portrait }}
        style={styles.ItemBackgroundImage}
        imageStyle={styles.ImageBackgroundStyle}
        resizeMode="cover"
      >
        {EnableBackHandler ? (
          <View style={styles.ImageHeaderBarContainerWithBack}>
            <TouchableOpacity onPress={() => BackHandler()}>
              <Icon name="arrow-left" color={COLORS.primaryLightGreyHex} size={FONTSIZE.size_16} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToggleFavorite}>
              <Icon
                name="heart"
                color={isFavorite ? COLORS.primaryRedHex : COLORS.primaryLightGreyHex}
                size={FONTSIZE.size_16}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ImageHeaderBarContainerWithoutBack}>
            <TouchableOpacity onPress={handleToggleFavorite}>
              <Icon
                name="heart"
                color={isFavorite ? COLORS.primaryRedHex : COLORS.primaryLightGreyHex}
                size={FONTSIZE.size_16}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.ImageInfoOuterContainer}>
          <View style={styles.ImageInfoInnerContainer}>
            <View style={styles.InfoContainerRow}>
              <View>
                <Text style={styles.ItemTitleText}>{name}</Text>
                <Text style={styles.ItemSubtitleText}>{special_ingredient}</Text>
              </View>
              <View style={styles.ItemPropertiesContainer}>
                <View style={styles.ProperFirst}>
                  <Icon
                    name={type === 'tea' ? 'coffee' : 'leaf'}
                    size={type === 'Bean' ? FONTSIZE.size_18 : FONTSIZE.size_24}
                    color={COLORS.primaryOrangeHex}
                  />
                  <Text
                    style={[
                      styles.PropertyTextFirst,
                      {
                        marginTop: type === 'Bean' ? SPACING.space_4 + SPACING.space_2 : 0,
                      },
                    ]}
                  >
                    {type}
                  </Text>
                </View>
                <View style={styles.ProperFirst}>
                  <Icon
                    name={type === 'Bean' ? 'map-marker' : 'tint'}
                    size={FONTSIZE.size_16}
                    color={COLORS.primaryOrangeHex}
                  />
                  <Text style={styles.PropertyTextLast}>{ingredients}</Text>
                </View>
              </View>
            </View>
            <View style={styles.InfoContainerRow}>
              <View style={styles.RatingContainer}>
                <Icon name="star" color={COLORS.primaryOrangeHex} size={FONTSIZE.size_20} />
                <Text style={styles.RatingText}>{average_rating}</Text>
                <Text style={styles.RatingCountText}>({ratings_count})</Text>
              </View>
              <View style={styles.RoastedContainer}>
                <Text style={styles.RoastedText}>{roasted}</Text>
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};


const styles = StyleSheet.create({
  ItemBackgroundImage: {
    width: '100%',
    aspectRatio: 20 / 25, // Maintains the aspect ratio
    justifyContent: 'space-between',
  },
  ImageBackgroundStyle: {
    borderRadius: BORDERRADIUS.radius_20, // Rounds the image corners
  },
  ImageHeaderBarContainerWithBack: {
    padding: SPACING.space_30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ImageHeaderBarContainerWithoutBack: {
    padding: SPACING.space_30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  ImageInfoOuterContainer: {
    paddingVertical: SPACING.space_24,
    paddingHorizontal: SPACING.space_30,
    backgroundColor: COLORS.primaryBlackRGBA,
    borderTopLeftRadius: BORDERRADIUS.radius_20 * 2,
    borderTopRightRadius: BORDERRADIUS.radius_20 * 2,
  },
  ImageInfoInnerContainer: {
    justifyContent: 'space-between',
    gap: SPACING.space_15,
  },
  InfoContainerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ItemTitleText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_24,
    color: COLORS.primaryWhiteHex,
  },
  ItemSubtitleText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  ItemPropertiesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_20,
  },
  ProperFirst: {
    height: 55,
    width: 55,
    borderRadius: BORDERRADIUS.radius_15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
  },
  PropertyTextFirst: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
  },
  PropertyTextLast: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_2 + SPACING.space_4,
  },
  RatingContainer: {
    flexDirection: 'row',
    gap: SPACING.space_10,
    alignItems: 'center',
  },
  RatingText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
  },
  RatingCountText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  RoastedContainer: {
    height: 55,
    width: 55 * 2 + SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
  },
  RoastedText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_10,
    color: COLORS.primaryWhiteHex,
  },
});

export default ImageBackgroundInfo;
