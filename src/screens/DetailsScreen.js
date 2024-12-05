import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../theme/theme';
import ImageBackgroundInfo from '../components/ImageBackgroundInfo';
import PaymentFooter from '../components/PaymentFooter';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import CommentsAndRatings from '../components/CommentsAndRatings';

const DetailScreen = ({ navigation }) => {
  const route = useRoute();
  const { id } = route.params;
  const [beverage, setBeverage] = useState(null);
  const [price, setPrice] = useState(null);
  const [fullDesc, setFullDesc] = useState(false);
  const [comments, setComments] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [cartPrice, setCartPrice] = useState(0);
  const [pendingRating, setPendingRating] = useState(0);
  const [userHasCommented, setUserHasCommented] = useState(false);
  const [userComment, setUserComment] = useState(null);
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
  // Fetch beverage and comments data
  useEffect(() => {
    const collections = ['coffee', 'tea', 'blended_beverages', 'milk_juice_more'];
    const fetchData = async () => {
      try {
        let beverageData = null;
        let beveragePrice = null;

        for (let collection of collections) {
          const docSnapshot = await firestore()
            .collection(collection)
            .doc(id)
            .get();

          if (docSnapshot.exists) {
            beverageData = docSnapshot.data();
            beveragePrice = beverageData?.prices?.[0];
            setBeverage({ ...beverageData, id: docSnapshot.id, type: collection });
            setPrice(beveragePrice);
            setUserRating(beverageData?.average_rating || 0);
            break;
          }
        }

        const fetchCommentsAndRatings = async () => {
          let allCommentsAndRatings = [];
          const currentUser = auth().currentUser;
          
          for (let collection of collections) {
            const commentsSnapshot = await firestore()
              .collection(collection)
              .doc(id)
              .collection('CommentsAndRatings')
              .get();
  
            const comments = commentsSnapshot.docs.map(doc => ({
              ...doc.data(), 
              commentId: doc.id
            }));

            allCommentsAndRatings.push(...comments);

            // Check if current user has already commented
            if (currentUser) {
              const userCommentData = comments.find(comment => comment.userId === currentUser.uid);
              if (userCommentData) {
                setUserHasCommented(true);
                setUserComment(userCommentData);
                setPendingRating(userCommentData.rating || 0);
                setCommentText(userCommentData.comment || '');
              }
            }
          }
  
          // Sort comments to put user's comment first if exists
          const sortedComments = allCommentsAndRatings.sort((a, b) => {
            const currentUserId = auth().currentUser?.uid;
            if (a.userId === currentUserId) return -1;
            if (b.userId === currentUserId) return 1;
            return 0;
          });

          setComments(sortedComments);
        };
  
        fetchCommentsAndRatings();
  
      } catch (error) {
        console.error('Error fetching data from collections:', error);
      }
    };

    fetchData();
  }, [id]);

  // Function to add item to the cart
  const addToCartHandler = async () => {
    if (beverage && price) {
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
          name: beverage.name,
          roasted: beverage.roasted || "Unknown",
          imagelink_square: beverage.imagelink_square,
          special_ingredient: beverage.special_ingredient || "None",
          type: beverage.type,
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
  
        // Navigate to cart screen
        navigation.navigate('Cart');
  
      } catch (error) {
        console.error('Error adding item to cart:', error);
      }
    } else {
      console.error("Beverage or price data is missing.");
    }
  };

  const toggleDescription = () => setFullDesc(prev => !prev);

  const renderSizeOptions = () => {
    return beverage?.prices.map((sizeOption, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => setPrice(sizeOption)}
        style={[
          styles.SizeBox,
          {
            borderColor:
              sizeOption.size === price?.size ? COLORS.primaryOrangeHex : COLORS.primaryDarkGreyHex,
          },
        ]}>
        <Text
          style={[
            styles.SizeText,
            {
              color:
                sizeOption.size === price?.size
                  ? COLORS.primaryOrangeHex
                  : COLORS.secondaryLightGreyHex,
            },
          ]}>
          {sizeOption.size}
        </Text>
      </TouchableOpacity>
    ));
  };


  const handleAddCommentAndRating = async () => {
    if ((commentText.trim() || pendingRating > 0)) {
      try {
        const userId = auth().currentUser?.uid;
        const userEmail = auth().currentUser?.email;
  
        if (!userId) {
          console.error("User is not logged in");
          return;
        }
  
        const targetCollection = beverage.type;
  
        if (!targetCollection) {
          console.error("Item not found in any collection.");
          return;
        }
  
        const docRef = firestore().collection(targetCollection).doc(id);
        const docSnapshot = await docRef.get();
  
        if (docSnapshot.exists) {
          // Fetch all comments and ratings for this item
          const commentsSnapshot = await firestore()
            .collection(targetCollection)
            .doc(id)
            .collection('CommentsAndRatings')
            .get();
  
          const allComments = commentsSnapshot.docs.map(doc => doc.data());
          
          // Find the user's existing comment/rating
          const userExistingComment = allComments.find(comment => comment.userId === userId);
  
          // Prepare the list of ratings, excluding the current user's previous rating
          const otherRatings = allComments.filter(comment => 
            comment.userId !== userId && comment.rating > 0
          );
  
          // Calculate new average rating
          const newRatings = [...otherRatings, { rating: pendingRating }];
          const updatedAverageRating = newRatings.length > 0 
            ? newRatings.reduce((sum, comment) => sum + comment.rating, 0) / newRatings.length
            : 0;
  
          // Prepare update object
          const updateData = {
            average_rating: updatedAverageRating,
            ratings_count: newRatings.length
          };
  
          // Update the document
          await docRef.update(updateData);
  
          // Handle comment in CommentsAndRatings sub-collection
          const commentQuery = await firestore()
            .collection(targetCollection)
            .doc(id)
            .collection('CommentsAndRatings')
            .where('userId', '==', userId)
            .get();
  
          if (!commentQuery.empty) {
            // Update existing comment
            const commentDoc = commentQuery.docs[0];
            await commentDoc.ref.update({
              comment: commentText,
              rating: pendingRating,
              timestamp: firestore.FieldValue.serverTimestamp()
            });
          } else {
            // Add new comment
            await firestore()
              .collection(targetCollection)
              .doc(id)
              .collection('CommentsAndRatings')
              .add({
                comment: commentText,
                rating: pendingRating,
                timestamp: firestore.FieldValue.serverTimestamp(),
                userId: userId,
                email: userEmail
              });
          }
  
          // Fetch and sort updated comments
          const updatedCommentsSnapshot = await firestore()
            .collection(targetCollection)
            .doc(id)
            .collection('CommentsAndRatings')
            .get();
  
          const allCommentsAndRatings = updatedCommentsSnapshot.docs.map(doc => ({
            ...doc.data(),
            commentId: doc.id
          }));
  
          const sortedComments = allCommentsAndRatings.sort((a, b) => {
            const currentUserId = auth().currentUser?.uid;
            if (a.userId === currentUserId) return -1;
            if (b.userId === currentUserId) return 1;
            return 0;
          });
  
          // Update local state
          setComments(sortedComments);
          setUserRating(updatedAverageRating);
          setUserHasCommented(true);
          setUserComment({
            comment: commentText,
            rating: pendingRating,
            userId: userId,
            email: userEmail
          });
  
          // Clear input fields
          setCommentText('');
          setPendingRating(0);
        }
      } catch (error) {
        console.error('Error adding/editing comment and rating:', error);
      }
    }
  };

  const renderRatingStars = () => {
    const stars = [1, 2, 3, 4, 5];
    return stars.map(star => (
      <TouchableOpacity key={star} onPress={() => setPendingRating(star)}>
        <Ionicons
          name={star <= pendingRating ? 'star' : 'star-outline'}
          size={24}
          color={COLORS.primaryOrangeHex}
        />
      </TouchableOpacity>
    ));
  };

  // Callback to handle when user deletes their comment
  const handleUserCommentDeleted = async () => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        console.error("User is not logged in");
        return;
      }
  
      const targetCollection = beverage.type;
      const docRef = firestore().collection(targetCollection).doc(id);
  
      // Fetch all comments
      const commentsSnapshot = await firestore()
        .collection(targetCollection)
        .doc(id)
        .collection('CommentsAndRatings')
        .get();
  
      const allComments = commentsSnapshot.docs.map(doc => ({
        ...doc.data(),
        commentId: doc.id
      }));
  
      // Remove the user's comment
      const updatedComments = allComments.filter(comment => comment.userId !== userId);
  
      // Recalculate ratings
      const validRatings = updatedComments.filter(comment => comment.rating > 0);
      const updatedAverageRating = validRatings.length > 0 
        ? validRatings.reduce((sum, comment) => sum + comment.rating, 0) / validRatings.length
        : 0;
  
      // Update the main document
      await docRef.update({
        average_rating: updatedAverageRating,
        ratings_count: validRatings.length
      });
  
      // Delete the user's comment document
      const userCommentQuery = await firestore()
        .collection(targetCollection)
        .doc(id)
        .collection('CommentsAndRatings')
        .where('userId', '==', userId)
        .get();
  
      if (!userCommentQuery.empty) {
        await userCommentQuery.docs[0].ref.delete();
      }
  
      // Sort comments
      const sortedComments = updatedComments.sort((a, b) => {
        const currentUserId = auth().currentUser?.uid;
        if (a.userId === currentUserId) return -1;
        if (b.userId === currentUserId) return 1;
        return 0;
      });
  
      // Update local state
      setComments(sortedComments);
      setUserRating(updatedAverageRating);
      setUserHasCommented(false);
      setUserComment(null);
      setPendingRating(0);
  
    } catch (error) {
      console.error('Error deleting comment and rating:', error);
    }
  };

  if (!beverage) {
    return (
      <View style={styles.LoadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
      </View>
    );
  };

  return (
    <View style={[styles.ScreenContainer, { backgroundColor: isDarkMode ? COLORS.primaryBlackHex : COLORS.white }]}>
      <StatusBar backgroundColor={isDarkMode ? COLORS.primaryBlackHex : COLORS.primaryWhiteHex} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ScrollViewFlex}>
      <ImageBackgroundInfo
          EnableBackHandler={true}
          imagelink_portrait={beverage.imagelink_square}
          type="Coffee"
          id={beverage.id}
          favourite={beverage.favourite}
          name={beverage.name}
          special_ingredient={beverage.special_ingredient}
          average_rating={userRating}
          ratings_count={beverage.ratings_count}
          roasted={beverage.roasted}
          BackHandler={() => navigation.goBack()}
          ToggleFavourite={() => {}}
        />

        <View style={styles.FooterInfoArea}>
          <Text style={styles.InfoTitle}>Description</Text>
          <TouchableWithoutFeedback onPress={toggleDescription}>
            <Text numberOfLines={fullDesc ? undefined : 3} style={styles.DescriptionText}>
              {beverage.description}
            </Text>
          </TouchableWithoutFeedback>

          <Text style={styles.InfoTitle}>Size</Text>
          <View style={styles.SizeOuterContainer}>
            {renderSizeOptions()}
          </View>

          {!userHasCommented && (
          <>
            <Text style={styles.InfoTitle}>Rate this Beverage</Text>
            <View style={styles.RatingContainer}>
              {renderRatingStars()}
            </View>

            <Text style={styles.InfoTitle}>Comments</Text>
            <View style={styles.CommentContainer}>
              <TextInput
                style={styles.CommentInput}
                placeholder="Add a comment..."
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity 
                onPress={handleAddCommentAndRating} 
                style={styles.CommentButton}
                disabled={!commentText.trim() && pendingRating === 0}
              >
                <Text style={styles.CommentButtonText}>Submit Comment & Rating</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        <CommentsAndRatings
          comments={comments}
          setComments={setComments}
          id={beverage.id}
          targetCollection={beverage.type}
          onUserCommentDeleted={handleUserCommentDeleted}
        />
        </View>

        <PaymentFooter
          price={price}
          buttonTitle="Add to Cart"
          buttonPressHandler={addToCartHandler}
        />
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  LoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBlackHex,
  },
  ScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  ScrollViewFlex: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  FooterInfoArea: {
    padding: SPACING.space_20,
  },
  InfoTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryLightGreyHex,
    marginVertical: SPACING.space_10,
  },
  SizeOuterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.space_10,
  },
  SizeBox: {
    borderWidth: 1,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_10,
    marginRight: SPACING.space_10,
    marginBottom: SPACING.space_10,
  },
  SizeText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
  },
  DescriptionText: {
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
  },
  RatingContainer: {
    flexDirection: 'row',
    marginVertical: SPACING.space_10,
  },
  CommentContainer: {
    marginVertical: SPACING.space_20,
  },
  CommentInput: {
    borderWidth: 1,
    borderColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_10,
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
  },
  CommentButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_10,
    marginTop: SPACING.space_10,
  },
  CommentButtonText: {
    color: COLORS.primaryBlackHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    textAlign: 'center',
  },
  CommentsList: {
    marginTop: SPACING.space_20,
  },
  CommentItem: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_10,
    marginVertical: SPACING.space_5,
  },
  CommentText: {
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
  },
});

export default DetailScreen;
