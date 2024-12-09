import React from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';

const CARD_HEIGHT = Dimensions.get('window').width * 0.25; // Height of the card

const GenericCard = ({
  id,
  name = 'Unknown',
  subtitle = 'N/A',
  image = null,
  rating = 0,
  price = '0.00',
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.CardContainer} onPress={onPress} activeOpacity={0.85}>
      {/* Image Section */}
      <Image
        source={image ? { uri: image } : null}
        style={styles.ImageContainer}
        resizeMode="cover"
      />

      {/* Information Section */}
      <View style={styles.InfoContainer}>
        <View style={styles.TextWrapper}>
          <Text style={styles.TitleText} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.SubtitleText} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        {/* Rating and Price */}
        <View style={styles.FooterContainer}>
          <View style={styles.RatingContainer}>
            <Icon name="star" color={COLORS.primaryOrangeHex} size={FONTSIZE.size_16} />
            <Text style={styles.RatingText}>{rating}</Text>
          </View>
          <Text style={styles.PriceText}>${price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  CardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_10,
    marginBottom: SPACING.space_15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  ImageContainer: {
    width: CARD_HEIGHT,
    height: CARD_HEIGHT,
    borderRadius: BORDERRADIUS.radius_10,
    marginRight: SPACING.space_10,
    backgroundColor: COLORS.primaryBlackHex, // Placeholder color
  },
  InfoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  TextWrapper: {
    marginBottom: SPACING.space_10,
  },
  TitleText: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  SubtitleText: {
    fontFamily: FONTFAMILY.poppins_light,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
  FooterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  RatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  RatingText: {
    marginLeft: SPACING.space_5,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  PriceText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryOrangeHex,
  },
});

export default GenericCard;
