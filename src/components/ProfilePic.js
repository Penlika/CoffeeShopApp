import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Text, View } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { COLORS, SPACING } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';

const ProfilePic = () => {
  const [profilePicture, setProfilePicture] = useState(null);
  const [username, setUsername] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const user = auth().currentUser;

    if (user) {
      // Set up real-time listener to watch for changes in the user's profile
      const userRef = firestore().collection('users').doc(user.uid);
      
      const unsubscribe = userRef.onSnapshot((docSnapshot) => {
        if (docSnapshot.exists) {
          const { profilePic, username } = docSnapshot.data();
          setProfilePicture(profilePic || 'https://via.placeholder.com/150');
          setUsername(username || 'Unknown User');
        } else {
          setProfilePicture('https://via.placeholder.com/150');
          setUsername('Unknown User');
        }
      });

      // Clean up the listener on unmount
      return () => unsubscribe();
    }
  }, []);

  // Function to truncate the username if it exceeds 7 words
  const truncateUsername = (name) => {
    const words = name.split(' ');
    if (words.length > 7) {
      return words.slice(0, 7).join(' ') + '...';
    }
    return name;
  };

  const truncatedUsername = truncateUsername(username);

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('ProfileScreen')}
      style={styles.container}
    >
      <Image
        source={{ uri: profilePicture }}
        style={styles.image}
      />
      <Text style={styles.username}>{truncatedUsername}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    height: SPACING.space_36,
    width: SPACING.space_36,
    borderRadius: SPACING.space_12,
    marginRight: SPACING.space_12,  // Space between the image and username
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primaryWhiteHex,  // You can change this color to fit your design
  },
});

export default ProfilePic;
