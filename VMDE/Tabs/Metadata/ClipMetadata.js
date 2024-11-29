import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import DBMetadata from '../DB/DBMetadata';

const ClipMetadata = ({ route, navigation }) => {
    const { item } = route.params;
    const inputRef = useRef(null);
    const [starttime, setstarttime] = useState();
    const [endtime, setendtime] = useState();
    const [title, setTitle] = useState();
    const [selectedPersons, setSelectedPersons] = useState();
    const [selectedLocation, setSelectedLocation] = useState();
    const [selectedCity, setSelectedCity] = useState();
    const [selectedEvent, setSelectedEvent] = useState();
    const [description, setdescription] = useState();
    const [datecreated, setDateCreated] = useState();
    const [dateModified, setDateModified] = useState();
    const [type, setType] = useState()
    const [paused, setPaused] = useState(false);
    const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });
    const ref = useRef();
    const [highlightPositions, setHighlightPositions] = useState([]);
    const [clips, setClips] = useState([]);
    const dbMetadata = new DBMetadata();
    const [showVideo, setShowVideo] = useState(false);
    const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);
    useEffect(() => {
        getMetadata();
        setPaused(true);
        setShowVideo(true);
        
    }, []);
    useEffect(() => {
        const fetchClip = async () => {
            if (isMetadataLoaded) {
                if (clips.length === 0) {
                    const filename = getFileName(item);
                    const [name, extension] = filename.split('.');
                    await dbMetadata.getMetadataByClip(name, (metadata) => {
                        setClips(metadata);
                        setIsMetadataLoaded(true);
                    });
                    /*if (clips.length > 0) {
                      await dbMetadata.getExactFrameMetadata(metadata.VideoPath, metadata.StartTime, metadata.EndTime, (fmetadata) => {
                        setFrameData(fmetadata);
                        setIsMetadataLoaded(true);
                      });
                    }*/
                }


            }
        }
        /*const fetchFrame = async () => {
          if (isMetadataLoaded) {
            if (isFocused) {
              if (metadata.length> 0) {
                await dbMetadata.getExactFrameMetadata(metadata.VideoPath,metadata.StartTime,metadata.EndTime, (fmetadata) => {
                  setFrameData(fmetadata);
                  setIsMetadataLoaded(true);
                });
              }
            }
          }
        }*/
        fetchClip();
        //fetchFrame();
    }, [isMetadataLoaded])

    const getFileName = (filePath) => {
        const parts = filePath.split('/');
        return parts[parts.length - 1];
    };
    useEffect(() => {
        if (progress.duration > 0) {
            setHighlightPositions(calculateHighlightPositions(clips, progress.duration));
        }
    }, [clips, progress.duration]);

    const getMetadata = () => {
        dbMetadata.getMetadata(item, (metadata) => {
            setClips(metadata);
            setIsMetadataLoaded(true);
        });
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    const convertTimeToSeconds = (time) => {
        if (!time) return null;
        const [minutes, seconds] = time.split(':').map(Number);
        return minutes * 60 + seconds;
    };

    const handleProgress = (data) => {
        const currentTimeInSeconds = data.currentTime;
        const startTimeInSeconds = convertTimeToSeconds(starttime);
        const endTimeInSeconds = convertTimeToSeconds(endtime);

        setProgress({
            currentTime: currentTimeInSeconds,
            duration: data.seekableDuration
        });

        if (!paused && currentTimeInSeconds < startTimeInSeconds) {
            setstarttime(formatTime(currentTimeInSeconds));
        }

        if (paused && currentTimeInSeconds === startTimeInSeconds) {
            setPaused(false);
        }

        if (startTimeInSeconds && currentTimeInSeconds < startTimeInSeconds) {
            ref.current.seek(startTimeInSeconds);
        }

        if (startTimeInSeconds && endTimeInSeconds && currentTimeInSeconds >= endTimeInSeconds) {
            setPaused(true);
        }
    };

    const handleSliderChange = (value) => {

        const clipAtCurrentTime = clips.find(clip => {
            const startTimeInSeconds = convertTimeToSeconds(clip.StartTime);
            const endTimeInSeconds = convertTimeToSeconds(clip.EndTime);
            return value >= startTimeInSeconds && value <= endTimeInSeconds;
        });

        if (!clipAtCurrentTime) {
            setstarttime('');
            setendtime('');
            setSelectedPersons('');
            setSelectedLocation('');
            setSelectedCity('');
            setSelectedEvent('');
            setdescription('');
            setDateCreated('');
            setDateModified('');
            setTitle('')
            setType('')
        }

        const formattedTime = formatTime(value);

        if (starttime === '' || endtime !== '') {
            setstarttime('');
        } else {
            setendtime('');
        }

        const endTimeInSeconds = convertTimeToSeconds(endtime);

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


    const handleClipPress = (clip) => {

        const currentTimeInSeconds = progress.currentTime;
        const startTimeInSeconds = convertTimeToSeconds(clip.StartTime);
        const endTimeInSeconds = convertTimeToSeconds(clip.EndTime);

        if (currentTimeInSeconds >= startTimeInSeconds && currentTimeInSeconds <= endTimeInSeconds) {

            return;
        }


        setTitle(clip.Title);
        setstarttime(clip.StartTime);
        setendtime(clip.EndTime);
        setSelectedPersons(clip.PersonName);
        setSelectedLocation(clip.LocationTitle);
        setSelectedCity(clip.CityName);
        setSelectedEvent(clip.EventTitle);
        setdescription(clip.Description);
        setDateCreated(clip.DateCreated);
        setDateModified(clip.DateModified);
        setType(clip.Type)


        ref.current.seek(startTimeInSeconds);
        setPaused(false);
    };



    const calculateHighlightPositions = (clips, duration) => {
        return clips.map(clip => ({
            start: (convertTimeToSeconds(clip.StartTime) / duration) * 100,
            end: (convertTimeToSeconds(clip.EndTime) / duration) * 100,
        }));
    };

    const ClipHighlight = ({ start, end, clip }) => {
        const highlightStyle = {
            position: 'absolute',
            left: `${start}%`,
            width: `${end - start}%`,
            height: '30%',
            backgroundColor: 'green',
            borderColor: 'black',
            borderWidth: 1
        };
        return <TouchableOpacity style={highlightStyle} onPress={() => handleClipPress(clip)} />;
    };


    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.videoContainer}>
                    <Video
                        source={{ uri: item }}
                        ref={ref}
                        onProgress={handleProgress}
                        muted
                        paused={paused}
                        style={styles.video}
                        resizeMode='cover'
                    />
                    {progress && (
                        <View style={styles.videoControls}>
                            <View style={styles.videoControlButtons}>
                                <TouchableOpacity onPress={() => { ref.current.seek(progress.currentTime - 10) }}>
                                    <Image style={styles.controlIcon} source={require('../../../Assests/Images/backward.png')} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setPaused(!paused)}>
                                    <Image style={[styles.controlIcon, styles.playPauseIcon]} source={paused ? require('../../../Assests/Images/play.png') : require('../../../Assests/Images/pause.png')} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { ref.current.seek(progress.currentTime + 10) }}>
                                    <Image style={[styles.controlIcon, styles.forwardIcon]} source={require('../../../Assests/Images/forward.png')} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.progressBarContainer}>
                                <Slider
                                    style={styles.progressBar}
                                    minimumValue={0}
                                    maximumValue={progress.duration}
                                    minimumTrackTintColor='red'
                                    maximumTrackTintColor='white'
                                    value={progress.currentTime}
                                    onValueChange={handleSliderChange}
                                />
                                {highlightPositions.map((highlight, index) => (

                                    index < clips.length ? (
                                        <ClipHighlight
                                            key={index}
                                            start={highlight.start}
                                            end={highlight.end}
                                            clip={clips[index]}
                                        />
                                    ) : null
                                ))}
                            </View>
                        </View>
                    )}
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Title:</Text>
                    <View style={styles.textInputContainer}>
                        <Text style={styles.inputField}>{title}</Text>
                    </View>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Description:</Text>
                    <View style={styles.textInputContainer}>
                        <Text multiline={true} style={[styles.inputField]} >{description}</Text>
                    </View>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Start Time:</Text>
                    <View style={styles.textInputContainer}>
                        <Text style={styles.inputField}>{starttime}</Text>
                    </View>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>End Time:</Text>
                    <View style={styles.textInputContainer}>
                        <Text style={styles.inputField}>{endtime}</Text>
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
                        <Text style={styles.inputField}>{dateModified}</Text>
                    </View>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Location:</Text>
                    <View style={styles.textInputContainer}>
                        <Text style={styles.inputField}>{selectedLocation}</Text>
                    </View>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>City:</Text>
                    <View style={styles.textInputContainer}>
                        <Text style={styles.inputField}>{selectedCity}</Text>
                    </View>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Person:</Text>
                    <View style={styles.textInputContainer}>
                        <Text style={styles.inputField}>{selectedPersons}</Text>
                    </View>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Event:</Text>
                    <View style={styles.textInputContainer}>
                        <Text style={styles.inputField}>{selectedEvent}</Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

export default ClipMetadata;

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
        backgroundColor:'black'
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
        marginTop: 70,
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
        position: 'relative',
    },
    progressBar: {
        flex: 1,
        height: 40,
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
        height: 100
    },
    errorMessage: {
        color: 'red',
    },
    dotIcon: {
        width: 24,
        height: 24,
        tintColor: 'black',
        marginLeft: 8,
    },
    button: {
        borderRadius: 25,
        width: '100%',
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: 16,
    },
});
