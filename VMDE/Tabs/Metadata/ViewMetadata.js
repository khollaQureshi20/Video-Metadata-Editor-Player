import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import DBMetadata from '../DB/DBMetadata';
import { useFocusEffect } from '@react-navigation/native';

const ViewMetadata = ({ route, navigation }) => {
    const { item, uri, onReturn } = route.params;
    const uriRef = useRef(uri);
    const dbMetadata = new DBMetadata();
    const [framedesc, setFrameDesc] = useState('');
    const [peoplemetadata, setPeopleMetadata] = useState([]);
    const [locationmetadata, setLocationMetadata] = useState([]);
    const [eventmetadata, setEventMetadata] = useState([]);
    const [selectedPersons, setSelectedPersons] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState([]);
    const [selectedCity, setSelectedCity] = useState(item.CityName);
    const [description, setDescription] = useState(item.Description);
    const [datecreated, setDateCreated] = useState(item.DateCreated);
    const [datemodified, setDateModified] = useState(item.DateModified);
    const [metadata, setMetadata] = useState([]);
    const [type, setType] = useState(item.Type);
    const [paused, setPaused] = useState(true);
    const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });
    const ref = useRef();
    const [showMatchingDescription, setShowMatchingDescription] = useState(false);
    const timeoutRef = useRef(null);
    const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);

    useEffect(() => {
        console.log(item)
        getFrame();
        geteventmetadata();
        getlocationmetadata();
        getpeoplemetadata();
    }, [isMetadataLoaded]);

    const getFrame = async () => {
        await dbMetadata.getFrameMetadata(item.VideoPath, (fmetadata) => {
            setMetadata(fmetadata);
            setIsMetadataLoaded(true);
        });
    };

    const geteventmetadata = async () => {
        await dbMetadata.getEventMetadataByID(item.Id, (emetadata) => {
            setEventMetadata(emetadata);
            setSelectedEvent(emetadata.map(e => e.Title));
            setIsMetadataLoaded(true);
        });
    };

    const getlocationmetadata = async () => {
        await dbMetadata.getLocationMetadataByID(item.Id, (lmetadata) => {
            setLocationMetadata(lmetadata);
            setSelectedLocation(lmetadata.map(l => l.Title));
            setIsMetadataLoaded(true);
        });
    };

    const getpeoplemetadata = async () => {
        await dbMetadata.getPeopleMetadataByID(item.Id, (pmetadata) => {
            setPeopleMetadata(pmetadata);
            setSelectedPersons(pmetadata.map(p => p.Name));
            setIsMetadataLoaded(true);
        });
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    const handleProgress = (data) => {
        const currentTimeInSeconds = data.currentTime;
    
        setProgress({
            currentTime: currentTimeInSeconds,
            duration: data.seekableDuration,
        });
    
        const matchingMetadata = metadata.find(m => {
            const itemStartTimeInSeconds = convertTimeToSeconds(m.StartTime);
            return currentTimeInSeconds >= itemStartTimeInSeconds;
        });
    
        if (matchingMetadata) {
            if (matchingMetadata.Description !== framedesc) {
                setFrameDesc(matchingMetadata.Description);
                setShowMatchingDescription(true);
    
                // Clear any existing timeout
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
    
                timeoutRef.current = setTimeout(() => {
                    setFrameDesc('');
                    setShowMatchingDescription(false);
                }, 3000);
            }
    
            const endTimeInSeconds = convertTimeToSeconds(matchingMetadata.EndTime);
            if (currentTimeInSeconds >= endTimeInSeconds) {
                setPaused(true);
            } else {
                setPaused(false); 
            }
        }
    };
    

    const convertTimeToSeconds = (time) => {
        if (!time) return null;
        const [minutes, seconds] = time.split(':').map(Number);
        return minutes * 60 + seconds;
    };

    const handleSliderChange = (value) => {
        const formattedTime = formatTime(value);

        const endTimeInSeconds = convertTimeToSeconds(item.EndTime);
        if (endTimeInSeconds && value >= endTimeInSeconds) {
            ref.current.seek(endTimeInSeconds);
            setPaused(true);
        } else {
            setPaused(false);
            setProgress(prevState => ({
                ...prevState,
                currentTime: value
            }));
            ref.current.seek(value);
        }
    };

    const handlePlayPause = () => {
        setPaused(!paused);
    };

    const handleLoad = (data) => {
        const videoDuration = data.duration;
        if (videoDuration && !progress.duration) {
            setProgress(prevState => ({
                ...prevState,
                duration: videoDuration
            }));
        }
        const startTimeInSeconds = convertTimeToSeconds(item.StartTime);
        ref.current.seek(startTimeInSeconds);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <TouchableOpacity
                    style={styles.videoContainer}
                    onPress={handlePlayPause}
                >
                    <Video
                        source={{ uri: uri }}
                        ref={ref}
                        onProgress={handleProgress}
                        paused={paused}
                        style={styles.video}
                        resizeMode='cover'
                        onLoad={handleLoad}
                        muted={true}
                    />
                    {progress && (
                        <View style={styles.videoControls}>
                            <View style={styles.videoControlButtons}>
                                <TouchableOpacity onPress={() => { ref.current.seek(progress.currentTime - 10) }}>
                                    <Image style={styles.controlIcon} source={require('../../../Assests/Images/backward.png')} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handlePlayPause}>
                                    <Image style={[styles.controlIcon, styles.playPauseIcon]} source={paused ? require('../../../Assests/Images/play.png') : require('../../../Assests/Images/pause.png')} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { ref.current.seek(progress.currentTime + 10) }}>
                                    <Image style={[styles.controlIcon, styles.forwardIcon]} source={require('../../../Assests/Images/forward.png')} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontSize: 15, textAlign: 'center' }}>{framedesc}</Text>
                            </View>

                            <View style={styles.progressBarContainer}>
                                <Text style={styles.progressText}>{formatTime(progress.currentTime)}</Text>
                                <Slider
                                    style={styles.progressBar}
                                    minimumValue={0}
                                    maximumValue={progress.duration}
                                    minimumTrackTintColor='red'
                                    maximumTrackTintColor='white'
                                    value={progress.currentTime}
                                    onValueChange={handleSliderChange}
                                />
                                <Text style={styles.progressText}>{formatTime(progress.duration)}</Text>
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Title:</Text>
                    <View style={styles.textInputContainer}>
                        <Text style={styles.inputField}>{item.Title}</Text>
                    </View>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Description:</Text>
                    <View style={styles.textInputContainer}>
                        <Text multiline={true} style={[styles.inputField, styles.descriptionField]}>{description}</Text>
                    </View>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Start Time:</Text>
                    <View style={styles.textInputContainer}>
                        <Text style={styles.inputField}>{item.StartTime}</Text>
                    </View>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>End Time:</Text>
                    <View style={styles.textInputContainer}>
                        <Text style={styles.inputField}>{item.EndTime}</Text>
                    </View>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Date Created:</Text>
                    <View style={styles.textInputContainer}>
                        <Text style={styles.inputField}>{datecreated}</Text>
                    </View>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Date Modified:</Text>
                    <View style={styles.textInputContainer}>
                        <Text style={styles.inputField}>{datemodified}</Text>
                    </View>
                </View>
                
            </ScrollView>
        </View>
    );
};

export default ViewMetadata;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D3D3D3'
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingVertical: 20,
        paddingHorizontal: 15
    },
    videoContainer: {
        width: '100%',
        height: 200,
        marginBottom: 20
    },
    video: {
        width: '100%',
        height: '100%',
    },
    videoControls: {
        position: 'absolute',
        left: 0,
        right: 0,
        padding: 10,
    },
    videoControlButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 50
    },
    controlIcon: {
        width: 24,
        height: 24,
        tintColor: 'white'
    },
    playPauseIcon: {
        width: 32,
        height: 32,
    },
    forwardIcon: {
        transform: [{ rotate: '360deg' }],
    },
    progressBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBar: {
        flex: 1,
    },
    progressText: {
        color: 'white',
        marginHorizontal: 5,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 16,
        marginBottom: 8,
        color: 'black',
        fontWeight: 'bold'
    },
    textInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputField: {
        flex: 1,
        padding: 8,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 4,
        backgroundColor: 'lightgray',
        color: 'black',
        fontSize: 18
    },
    descriptionField: {
        textAlignVertical: 'top',
    },
});
