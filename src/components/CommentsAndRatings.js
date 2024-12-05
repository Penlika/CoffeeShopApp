import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../theme/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Menu, MenuItem, MenuDivider } from 'react-native-material-menu';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const CommentsAndRatings = ({ 
  comments, 
  setComments, 
  id, 
  targetCollection, 
  beverage,
  onUserCommentDeleted 
}) => {
  const [editMode, setEditMode] = useState(null);
  const [editedComment, setEditedComment] = useState('');
  const [editedRating, setEditedRating] = useState(null);
  const [menuVisible, setMenuVisible] = useState(null);

  const currentUser = auth().currentUser;

  const handleEdit = (comment, rating, index) => {
    setEditMode(index);
    setEditedComment(comment || '');
    setEditedRating(rating);
    setMenuVisible(null);
  };

  const saveEdit = async (commentId, originalRating) => {
    try {
      // Fetch all comments for this item
      const commentsSnapshot = await firestore()
        .collection(targetCollection)
        .doc(id)
        .collection('CommentsAndRatings')
        .get();

      const allComments = commentsSnapshot.docs.map(doc => doc.data());
      
      // Remove the original rating and filter other ratings
      const otherRatings = allComments.filter(comment => 
        comment.userId !== currentUser.uid && comment.rating > 0
      );

      // Add the new rating
      const newRatings = [...otherRatings, { rating: editedRating }];
      
      // Recalculate average rating
      const updatedAverageRating = newRatings.length > 0 
        ? newRatings.reduce((sum, comment) => sum + comment.rating, 0) / newRatings.length
        : 0;

      // Update main document with new average rating
      await firestore()
        .collection(targetCollection)
        .doc(id)
        .update({
          average_rating: updatedAverageRating,
          ratings_count: newRatings.length
        });

      // Update the specific comment
      await firestore()
        .collection(targetCollection)
        .doc(id)
        .collection('CommentsAndRatings')
        .doc(commentId)
        .update({
          comment: editedComment,
          rating: editedRating,
        });

      // Update local state
      const updatedComments = comments.map((item) => {
        if (item.commentId === commentId) {
          return { 
            ...item, 
            comment: editedComment, 
            rating: editedRating 
          };
        }
        return item;
      });

      setComments(updatedComments);
      setEditMode(null);
    } catch (error) {
      console.error('Error saving edited comment:', error);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      // Delete the comment from Firestore
      await firestore()
        .collection(targetCollection)
        .doc(id)
        .collection('CommentsAndRatings')
        .doc(commentId)
        .delete();

      // Remove the comment from the local state
      const updatedComments = comments.filter((item) => item.commentId !== commentId);
      setComments(updatedComments);
      setMenuVisible(null);

      // Notify parent component that user has deleted their comment
      onUserCommentDeleted && onUserCommentDeleted();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const renderComment = ({ item, index }) => {
    const isCurrentUser = item.userId === currentUser?.uid;

    return (
      <View
        style={[
          styles.CommentBox,
          { backgroundColor: isCurrentUser ? COLORS.primaryWhiteHex : COLORS.primaryGreyHex },
        ]}
      >
        <View style={styles.CommentHeader}>
          <Text style={styles.UserEmail}>{item.email || 'Unknown User'}</Text>
          <View style={styles.RatingStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              editMode === index ? (
                <TouchableOpacity key={star} onPress={() => setEditedRating(star)}>
                  <Ionicons
                    name={star <= (editedRating || item.rating) ? 'star' : 'star-outline'}
                    size={18}
                    color={COLORS.primaryOrangeHex}
                  />
                </TouchableOpacity>
              ) : (
                <Ionicons
                  key={star}
                  name={star <= item.rating ? 'star' : 'star-outline'}
                  size={18}
                  color={COLORS.primaryOrangeHex}
                />
              )
            ))}
          </View>
          {isCurrentUser && (
            <Menu
              visible={menuVisible === index}
              onRequestClose={() => setMenuVisible(null)}
              anchor={
                <TouchableOpacity onPress={() => setMenuVisible(index)}>
                  <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.primaryDarkHex} />
                </TouchableOpacity>
              }
            >
              <MenuItem onPress={() => handleEdit(item.comment, item.rating, index)}>Edit</MenuItem>
              <MenuDivider />
              <MenuItem onPress={() => deleteComment(item.commentId)}>Delete</MenuItem>
            </Menu>
          )}
        </View>
        {editMode === index ? (
          <View style={styles.EditContainer}>
            <TextInput
              style={styles.EditInput}
              value={editedComment}
              onChangeText={setEditedComment}
              placeholder="Edit your comment"
            />
            <TouchableOpacity 
              onPress={() => saveEdit(item.commentId, item.rating)} 
              style={styles.SaveButton}
            >
              <Text style={styles.SaveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.CommentText}>{item.comment}</Text>
        )}
      </View>
    );
  };

  return (
    <View>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.commentId}
        renderItem={renderComment}
        contentContainerStyle={styles.CommentsList}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  CommentBox: {
    padding: SPACING.space_15,
    borderRadius: BORDERRADIUS.radius_10,
    marginVertical: SPACING.space_10,
  },
  CommentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_10,
  },
  UserEmail: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
  },
  RatingStars: {
    flexDirection: 'row',
  },
  CommentText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryDarkGreyHex,
  },
  EditContainer: {
    marginTop: SPACING.space_10,
  },
  EditInput: {
    borderWidth: 1,
    borderColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_10,
    color: COLORS.primaryLightGreyHex,
  },
  SaveButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_10,
    marginTop: SPACING.space_10,
  },
  SaveButtonText: {
    color: COLORS.primaryBlackHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    textAlign: 'center',
  },
  CommentsList: {
    marginTop: SPACING.space_10,
  },
});

export default CommentsAndRatings;