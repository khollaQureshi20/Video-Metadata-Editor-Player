import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Welcome = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color="#fdf0e0" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.topContainer}>
        <Text style={styles.greetingText}>Oh No! I Forget</Text>
        <Text style={styles.greetingBack}>My Password</Text>
        <Image
          source={require('./Assests/kids/mashroom5.png')}
          style={styles.image}
        />
      </View>

      {/* Wrapping allText in a View for centering */}
      <View style={styles.textContainer}>
        <Text style={styles.allText}>Don't worry. It happens to the best of us!</Text>
        <Text style={styles.allText}>Enter your email to reset your password!</Text>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.buttonSecondary}>
          <Text style={styles.buttonTextSecondary}>Email Address</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonPrimary}>
          <Text style={styles.buttonTextPrimary}>SEND</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cloud}>
        <Image
          source={require('./Assests/kids/cloud.png')}
          style={styles.cloudImage}
        />
      </View>

      <View style={styles.cloud2}>
        <Image
          source={require('./Assests/kids/cloud.png')}
          style={styles.cloudImage2}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf0e0',
  },
  backButton: {
    flexDirection: 'row',
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  backText: {
    fontSize: 16,
    color: '#fdf0e0',
    textDecorationLine: 'underline',
  },
  // New style for text container
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20, // Add some vertical margin for spacing
  },
  allText: {
    fontSize: 16,
    color: '#8f2c2d',
    textAlign: 'center', 
    
  },
  topContainer: {
    backgroundColor: '#8f2c2d',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    padding: 10,
  },
  greetingText: {
    marginTop:40,
    fontSize: 30,
    color: '#FFFFFF',
  },
  greetingBack: {
    fontSize: 30,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  image: {
    width: 250,
    height: 250,
  },
  bottomContainer: {
    marginTop: 40,
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  buttonPrimary: {
    backgroundColor: '#b3422f',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonTextPrimary: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#D9613C',
    fontSize: 18,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  buttonSecondary: {
    borderColor: '#b3422f',
    borderWidth: 2,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cloudImage: {
    width: 150,
    height: 150,
    position: 'absolute',
    resizeMode: 'contain',
  },
  cloud: {
    marginTop: 90,
    transform: [{ rotate: '20deg' }],
  },
  cloud2: {
    
    transform: [{ rotate: '-20deg' }, { scaleX: -1 }],
  },
  cloudImage2: {
    width: 150,
    height: 150,
    position: 'absolute',
    resizeMode: 'contain',
  },
});

export default Welcome;
