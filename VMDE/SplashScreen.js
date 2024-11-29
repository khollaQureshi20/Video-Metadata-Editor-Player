import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const SplashScreen = ({ navigation }) => {
  const fadeAnim = new Animated.Value(0);
  const textSizeAnim = new Animated.Value(1);
  const metadataOpacityAnim = new Animated.Value(0);

  const textTransformStyle = {
    transform: [{ scale: textSizeAnim }],
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500, 
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(textSizeAnim, {
        toValue: 0.8,
        duration: 1000, 
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();

      Animated.timing(metadataOpacityAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }, 3000);
  }, []);
  setTimeout(() => {
    navigation.navigate('tabNav'); 
  }, 6000);
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#220e65','#086dbf', '#086dbf']}
        style={styles.gradient}>
        <View style={styles.logoContainer}>
          <Animated.Image
            source={require('../Assests/Images/logo.png')}
            style={[styles.logo, { opacity: fadeAnim }]}
            resizeMode="contain"
          />
          <View style={styles.videoTextContainer}>
            <Animated.Text style={[styles.videoText, textTransformStyle]}>Video</Animated.Text>
            <Animated.Text style={[styles.metadataEditorText, { opacity: metadataOpacityAnim }]}>
              Metadata Editor
            </Animated.Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    tintColor: 'white',
  },
  videoTextContainer: {
    marginLeft: 20, 
    marginTop:20
  },
  videoText: {
    color: 'white',
    fontSize: 50,
    fontWeight: 'bold',
  },
  metadataEditorText: {
    color: 'white',
    fontSize: 24,
    
  },
});

export default SplashScreen;
