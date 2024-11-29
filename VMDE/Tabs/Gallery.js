import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, Image, ScrollView, PermissionsAndroid, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import RNFetchBlob from 'react-native-fetch-blob';
import { useNavigation } from '@react-navigation/native';
import CheckBox from '@react-native-community/checkbox';
import DBMetadata from './DB/DBMetadata';
import { launchImageLibrary } from 'react-native-image-picker';
import { useIsFocused } from '@react-navigation/native';

const Gallery = () => {
  const [videos, setVideos] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [search, setSearch] = useState('');
  const [isSearchResult, setIsSearchResult] = useState(false);
  const [searchedMetadata, setSearchedMetadata] = useState([]);
  const [isUniqueOnly, setIsUniqueOnly] = useState(false);
  const navigation = useNavigation();
  const dbMetadata = new DBMetadata();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      requestPermissions();
    }
  }, [isFocused]);

  const requestPermissions = async () => {
    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions, {
        title: 'Permission Required',
        message: 'This app needs access to your storage to load and save videos.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      });

      if (
        granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
      ) {
        if (isFocused) {
          fetchVideos();
        }
      } else {
        console.log('Permission denied');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const videosDirs = [
        RNFetchBlob.fs.dirs.DCIMDir + '/Camera',
        RNFetchBlob.fs.dirs.DownloadDir,
      ];

      let allVideos = [];

      for (const dir of videosDirs) {
        const isDirExists = await RNFetchBlob.fs.isDir(dir);
        if (!isDirExists) {
          console.log(`Directory '${dir}' does not exist or is not a folder`);
          continue;
        }
        const files = await RNFetchBlob.fs.ls(dir);
        const videoFiles = files.filter((file) => file.endsWith('.mp4'));
        const videoURIs = videoFiles.map((file) => 'file://' + dir + '/' + file);
        allVideos.push(...videoURIs);
      }

      setVideos(allVideos);
      setIsSearchResult(false);
      setSearchedMetadata([]);

    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };


  const handleSearch = async () => {
    try {
      if (search === '') {
        fetchVideos();
      } else {
        await dbMetadata.searchMetadata(search, (metadata) => {
          let filteredMetadata = metadata;
          if (isUniqueOnly) {
            const seenPaths = new Set();
            filteredMetadata = filteredMetadata.filter(item => {
              if (!seenPaths.has(item.VideoPath)) {
                seenPaths.add(item.VideoPath);
                return true;
              }
              return false;
            });
          }

          setSearchedMetadata(filteredMetadata);
          setVideos(filteredMetadata.map((item) => item.VideoPath));
          setIsSearchResult(true);
          setSearch('');

          if (filteredMetadata.length === 0) {
            setVideos([]);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handleVideo = (video) => {
    if (isSearchResult && !isUniqueOnly) {
      const matchedItem = searchedMetadata.find(item => item.VideoPath === video);
      if (matchedItem) {
        navigation.navigate('ViewMetadata', { item: matchedItem, uri: video, onReturn: video });
      }
    } else {
      navigation.navigate('VideoEditor', { item: video });
    }
  };


  const renderVideosItem = ({ item }) => {
    
    const metadataItem = searchedMetadata.find(meta => meta.VideoPath === item);
  
    return (
      <ScrollView>
        <TouchableOpacity onPress={() => handleVideo(item)}>
          <Image source={{ uri: item }} style={styles.videoThumbnail} />
          {metadataItem && isSearchResult && isUniqueOnly===false && (
            <View style={styles.metadataContainer}>
              <Text style={styles.metadataText}>Title: {metadataItem.Title}</Text>
              <Text style={styles.metadataText}>Start: {metadataItem.StartTime}</Text>
              <Text style={styles.metadataText}>End: {metadataItem.EndTime}</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  };
  
  
  
  
  
  const importVideo = () => {
    let options = {
      mediaType: 'video',
      maxWidth: 300,
      maxHeight: 550,
      quality: 1,
    };
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        alert('User cancelled video picker');
        return;
      } else if (response.errorCode) {
        alert(response.errorMessage);
        return;
      }
      if (response.assets && response.assets.length > 0) {
        const uri = response.assets[0].uri;
        navigation.navigate('VideoEditor', { item: uri });
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        {isSearchActive ? (
          <>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.inputField}
                placeholder="Search"
                placeholderTextColor="black"
                value={search}
                onChangeText={(text) => setSearch(text)}
              />
              <TouchableOpacity onPress={handleSearch} style={styles.searchButtonActive}>
                <Image source={require('../../Assests/Images/search.png')} style={styles.searchIconActive} />
              </TouchableOpacity>

            </View>
            <CheckBox
              value={isUniqueOnly}
              onValueChange={setIsUniqueOnly}
              style={styles.checkbox}
              tintColors={{ true: 'black', false: 'black' }}
            />
            <Text style={styles.checkboxLabel}>Video</Text>
            <TouchableOpacity onPress={() => setIsSearchActive(false)} style={styles.cancelButtonContainer}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Metadata Editor</Text>
            <TouchableOpacity onPress={() => setIsSearchActive(true)} style={styles.searchButton}>
              <Image source={require('../../Assests/Images/search.png')} style={styles.searchIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.importButtonContainer} onPress={importVideo}>
              <Text style={styles.importButtonText}>Import</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <TouchableOpacity onPress={() =>{navigation.navigate('JoinClip')}} style={styles.tocbtn}>
              <Text style={styles.importButtonText}>Table of Content</Text>
            </TouchableOpacity>
      {videos.length > 0 ? (
        <FlatList
          data={videos}
          renderItem={renderVideosItem}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          contentContainerStyle={styles.flatListContent}
        />
      ) : (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No Videos</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 10,
    marginBottom: 10,
    marginTop: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'black',
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#2b8fcb',
    borderRadius: 30,
    padding: 5,
    marginLeft: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: 'white',
  },
  searchButtonActive: {
    backgroundColor: '#2b8fcb',
    borderRadius: 30,
    padding: 5,
    marginLeft: 10,
  },
  searchIconActive: {
    width: 20,
    height: 20,
    tintColor: 'white',
  },
  importButtonContainer: {
    backgroundColor: '#2b8fcb',
    borderRadius: 5,
    padding: 5,
    marginLeft: 10,
  },
  tocbtn:{
    backgroundColor: '#2b8fcb',
    borderRadius: 5,
    padding: 5,
    marginLeft: 10,
    width:'50%',
    alignItems:'center',
    marginBottom:10
  },
  importButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 30,
    paddingHorizontal: 10,
    flex: 1,
  },
  inputField: {
    flex: 1,
    color: 'black',
  },
  cancelButtonContainer: {
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#2b8fcb',
    fontSize: 16,
    fontWeight: 'bold',
  },
  flatListContent: {
    paddingBottom: 20,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 18,
    color: 'black',
  },
  videoThumbnail: {
    width: '98%',
    height: 200,
    marginBottom: 10,
    borderRadius: 10,
  },
  metadataContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 5,
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 5,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,

  },
  metadataText: {
    color: 'white',
    fontSize: 12,
  },
  checkbox: {
    marginLeft: 'auto',
  },
  checkboxLabel: {
    marginLeft: 5,
    color: 'black',
    fontSize: 16,
  },

});

export default Gallery;
