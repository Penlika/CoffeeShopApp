import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';

const ImageBackgroundInfo = ({
  EnableBackHandler,
  imagelink_portrait,
  id,
  name,
  special_ingredient,
  ingredients,
  average_rating,
  ratings_count,
  BackHandler,
  type,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [realTimeRating, setRealTimeRating] = useState({
    average_rating: average_rating,
    ratings_count: ratings_count,
  });

  // Mapping for collection to icon and display name
  const COLLECTION_CONFIG = {
    coffee: {
      icon: 'coffee-maker',
      displayName: 'Coffee',
      iconLibrary: 'MaterialCommunityIcons',
    },
    tea: {
      icon: 'tea',
      displayName: 'Tea',
      iconLibrary: 'MaterialCommunityIcons',
    },
    blended_beverages: {
      icon: 'blender-outline',
      displayName: 'Blended',
      iconLibrary: 'MaterialCommunityIcons',
    },
    milk_juice_more: {
      icon: 'cup',
      displayName: 'Other',
      iconLibrary: 'MaterialCommunityIcons',
    },
  };

  // Fetch the current favorite status and real-time ratings
  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = auth().currentUser;

        if (!currentUser) {
          console.error('No user is currently logged in.');
          return;
        }

        const userId = currentUser.uid;
        // Fetch favorite status
        const favoriteRef = firestore()
          .collection('users')
          .doc(userId)
          .collection('favorites')
          .doc(id);

        const favoriteDoc = await favoriteRef.get();
        const isFavoriteStatus = favoriteDoc.exists;
        setIsFavorite(isFavoriteStatus);

        // Real-time ratings listener
        const itemRef = firestore()
          .collection(type)
          .doc(id);

        const unsubscribe = itemRef.onSnapshot((doc) => {
          if (doc.exists) {
            const docData = doc.data();

            // Log the rating update details
            const updatedRating = {
              average_rating: docData.average_rating || average_rating,
              ratings_count: docData.ratings_count || ratings_count,
            };

            setRealTimeRating(updatedRating);
          } else {
            console.log('No document found for item');
          }
        }, (error) => {
          console.error('Error fetching real-time ratings:', error);
        });

        // Listen for changes to the favorite status in real-time
        const favoriteStatusListener = favoriteRef.onSnapshot((doc) => {
          if (doc.exists) {
            setIsFavorite(true);
          } else {
            setIsFavorite(false);
          }
        });

        // Cleanup listeners on unmount
        return () => {
          unsubscribe();
          favoriteStatusListener();
        };
      } catch (error) {
        console.error('Error in fetchData:', error);
      }
    };

    fetchData();
  }, [average_rating, type, id, name, ratings_count]);

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
        const favoriteData = {
          name,
          imagelink_square: imagelink_portrait,
          special_ingredient,
          ingredients,
          type: type,
          timestamp: firestore.FieldValue.serverTimestamp(),
        };

        await favoriteRef.set(favoriteData);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  // Dynamic icon rendering
  const renderTypeIcon = () => {
    if (!type) {
      console.warn("Collection name is undefined, using default icon");
      return null; // Or render a default icon
    }

    const typeConfig = COLLECTION_CONFIG[type.toLowerCase()] || COLLECTION_CONFIG.coffee;
    const { icon, displayName, iconLibrary } = typeConfig;

    const IconComponent = {
      'FontAwesome': Icon,
      'MaterialCommunityIcons': MaterialCommunityIcons,
      'FontAwesome5': (props) => <Icon name={icon} {...props} />,
    }[iconLibrary];

    return (
      <View style={styles.ProperFirst}>
        <IconComponent
          name={icon}
          size={type === 'Coffee' ? FONTSIZE.size_18 : FONTSIZE.size_24}
          color={COLORS.primaryOrangeHex}
        />
        <Text
          style={[
            styles.PropertyTextFirst,
            { marginTop: type === 'Coffee' ? SPACING.space_4 + SPACING.space_2 : 0 },
          ]}
        >
          {displayName}
        </Text>
      </View>
    );
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
            <TouchableOpacity onPress={() => {
              console.log('Back button pressed');
              BackHandler();
            }}>
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
                <Text style={styles.ItemSubtitleText}>{ingredients}</Text>
              </View>
              <View style={styles.ItemPropertiesContainer}>
                {renderTypeIcon()}
              </View>
            </View>
            <View style={styles.InfoContainerRow}>
              <View style={styles.RatingContainer}>
                <Icon name="star" color={COLORS.primaryOrangeHex} size={FONTSIZE.size_20} />
                <Text style={styles.RatingText}>{realTimeRating.average_rating}</Text>
                <Text style={styles.RatingCountText}>({realTimeRating.ratings_count})</Text>
              </View>
              <View style={styles.RoastedContainer}>
                <Text style={styles.RoastedText}>{special_ingredient}</Text>
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
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
});

export default ImageBackgroundInfo;
