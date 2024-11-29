import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList } from 'react-native';
import RNFetchBlob from 'react-native-fetch-blob';
import DBMetadata from './DB/DBMetadata';
import { useNavigation } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';

export default function NonTagged() {
    const dbMetadata = new DBMetadata();
    const [metadata, setMetadata] = useState([]);
    const [videos, setVideos] = useState([]);
    const isFocused = useIsFocused();
    const navigation = useNavigation();

    useEffect(() => {
        if (isFocused) {
            fetchVideos();
        }
    }, [isFocused]);

    const getMetadata = (item) => {
        return new Promise((resolve, reject) => {
            dbMetadata.getMetadata(item, (metadata) => {
                resolve(metadata);
            });
        });
    };
    
    const fetchVideos = async () => {
        try {
            const videosDirs = [
                
                RNFetchBlob.fs.dirs.DownloadDir,
            ];
    
            let allVideos = [];
            for (const dir of videosDirs) {
                const isDirExists = await RNFetchBlob.fs.isDir(dir);
                if (!isDirExists) {
                    console.log(`Directory ${dir} does not exist or is not a folder`);
                    continue;
                }
                const files = await RNFetchBlob.fs.ls(dir);
                const videoFiles = files.filter(file => file.endsWith('.mp4'));
                const videoURIs = videoFiles.map(file => 'file://' + dir + '/' + file);
                allVideos = allVideos.concat(videoURIs);
            }
    
            const metadataPromises = allVideos.map(video => getMetadata(video));
            const metadataList = await Promise.all(metadataPromises);
    
            const videosNotInMetadata = allVideos.filter((video, index) => {
                const metadata = metadataList[index];
                return metadata && !metadata.some(item => item.VideoPath === video);
            });
    
            
            
    
            setVideos(videosNotInMetadata);
    
        } catch (error) {
            console.error('Error fetching videos:', error);
        }
    };

    const handleVideo = (video) => {
        navigation.navigate('VideoEditor', { item: video });
    };

    const renderVideosItem = ({ item }) => (
        <TouchableOpacity onPress={() => handleVideo(item)}>
            <Image source={{ uri: item }} style={styles.videoThumbnail} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {videos.length > 0 ? (
                <FlatList
                    data={videos}
                    renderItem={renderVideosItem}
                    keyExtractor={(item, index) => index.toString()}
                    numColumns={3}
                    contentContainerStyle={styles.flatListContent}
                />
            ) : (
                <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>No Videos</Text>
                </View>
            )}
        </View>
    );
}

const getFileName = (filePath) => {
    const parts = filePath.split('/');
    return parts[parts.length - 1];
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    flatListContent: {
        padding: 5,
    },
    videoThumbnail: {
        width: 130,
        height: 150,
        margin: 2,
    },
    noResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noResultsText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black',
    },
});
