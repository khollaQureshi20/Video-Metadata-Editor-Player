import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, Image, ScrollView, PermissionsAndroid, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import RNFetchBlob from 'react-native-fetch-blob';
import { useNavigation } from '@react-navigation/native';
import CheckBox from '@react-native-community/checkbox';
import DBMetadata from '../DB/DBMetadata';
import { launchImageLibrary } from 'react-native-image-picker';
import { useIsFocused } from '@react-navigation/native';

const JoinClip = () => {
    const [videos, setVideos] = useState([]);

    const [searchedMetadata, setSearchedMetadata] = useState([]);
    const navigation = useNavigation();
    const dbMetadata = new DBMetadata();
    const isFocused = useIsFocused();
    const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);
    const [isMetadataLoaded2, setIsMetadataLoaded2] = useState(false);
    const [isclicked, setISClicked] = useState(false)
    const [checked, setChecked] = useState(false)
    const [metadata, setMetadata] = useState([]);
    
    useEffect(() => {
        if (isFocused) {
            getdata();
        }
    }, [isFocused]);

    const getdata = async () => {
        try {
            await dbMetadata.getAllvideoMetadata((metadata) => {
                setVideos(metadata);
                setIsMetadataLoaded(true)
            });

        } catch (error) {
            console.error('Error fetching videos:', error);
        }
    }
    const getRecord = async () => {

        try {
            await dbMetadata.getAllMetadata((metadata) => {
                setMetadata(metadata);
                setIsMetadataLoaded2(true)
            });

        } catch (error) {
            console.error('Error fetching videos:', error);
        }

    }
    if (isMetadataLoaded) {
        getRecord()
    }

    const handleVideo = (video) => {
        navigation.navigate('ViewMetadata', { item: video, uri: video.VideoPath, onReturn: video });

    };

    const renderVideosItem = ({ item, index }) => {
        if (item.VideoPath == null) { return null; }

        const metadataItems = metadata.filter(meta => meta.VideoPath === item.VideoPath);

        return (
            <ScrollView vertical>
                <View>
                    <Text style={{ color: 'black', fontWeight: 'bold' }}>{`${index}. ${item.VideoPath}`}</Text>
                    {metadataItems.map((metadataItem, metaIndex) => (
                        <TouchableOpacity key={metaIndex} onPress={() => handleVideo(metadataItem)}>
                            <View style={{ flexDirection: 'row', marginTop: 10 }}>
                            {isclicked && (
                                    <CheckBox
                                    value={checked}
                                    onValueChange={() => setChecked(true)}
                                    tintColors={{ true: 'green', false: 'black' }}
                                        style={styles.checkboxLabel}
                                    />
                                )}
                                <Text style={{ color: 'black' }}>{metadataItem.Title}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        );
    };


    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => { setISClicked(true) }} style={styles.tocbtn}>
                <Text style={styles.importButtonText}>JoinClip</Text>
            </TouchableOpacity>
            {videos.length > 0 ? (
                <FlatList
                    data={videos}
                    renderItem={renderVideosItem}
                    keyExtractor={(item, index) => index.toString()}

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
    
    plusButton: {
        backgroundColor: 'blue',
        borderRadius: 5,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15
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
   
    checkboxLabel: {
        marginLeft: 5,
        color: 'black',
        fontSize: 16,
    },
    tocbtn:{
        backgroundColor: '#2b8fcb',
        borderRadius: 5,
        padding: 10,
        marginLeft: 10,
        width:'50%',
        alignItems:'center',
        margin:10
      },
      importButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        
      },

});

export default JoinClip;
