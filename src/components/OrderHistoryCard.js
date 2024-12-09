import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import OrderItemCard from './OrderItemCard';

const OrderHistoryCard = ({
  navigationHandler,
  CartList = [],
  CartListPrice = 0,
  OrderDate = 'N/A',
  paymentMethod = '',
  paymentStatus = '',
}) => {

  return (
    <View style={styles.CardContainer}>
      <View style={styles.CardHeader}>
        <View>
          <Text style={styles.HeaderTitle}>Order Time</Text>
          <Text style={styles.HeaderSubtitle}>{OrderDate.toLocaleString() }</Text>
        </View>
        <View style={styles.PriceContainer}>
          <Text style={styles.HeaderTitle}>Total Amount</Text>
          <Text style={styles.HeaderPrice}>${CartListPrice.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.PaymentInfo}>
        <Text style={styles.PaymentText}>Payment: {paymentMethod}</Text>
        <Text style={[styles.PaymentStatus, {
          color: paymentStatus === 'completed' ? COLORS.primaryOrangeHex : COLORS.secondaryRedHex
        }]}>
          {paymentStatus || 'N/A'}
        </Text>
      </View>

      <View style={styles.ListContainer}>
        {CartList.length > 0 ? (
          CartList.map((item, index) => (
            <TouchableOpacity
              key={index.toString() + item.id}
              onPress={() =>
                navigationHandler({
                  index,
                  id: item.itemId,
                  type: item.type,
                })
              }>
              <OrderItemCard
                type={item.type}
                name={item.name}
                imagelink_square={item.imagelink_square}
                special_ingredient={item.special_ingredient}
                prices={[{
                  size: item.size,
                  price: item.price,
                  quantity: item.quantity,
                  currency: '$'
                }]}
                ItemPrice={item.price}
              />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.EmptyCartText}>No items in this order</Text>
        )}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  PaymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.space_10,
  },
  PaymentText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
  },
  PaymentStatus: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
  },
  CardContainer: {
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: SPACING.space_10,
    padding: SPACING.space_20,
    gap: SPACING.space_10,
    elevation: 3,
    shadowColor: COLORS.shadowBlack,
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  CardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  HeaderTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  HeaderSubtitle: {
    fontFamily: FONTFAMILY.poppins_light,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  PriceContainer: {
    alignItems: 'flex-end',
  },
  HeaderPrice: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryOrangeHex,
  },
  ListContainer: {
    marginTop: SPACING.space_10,
    gap: SPACING.space_20,
  },
  EmptyCartText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryGrayHex,
    textAlign: 'center',
  },
});

export default OrderHistoryCard;