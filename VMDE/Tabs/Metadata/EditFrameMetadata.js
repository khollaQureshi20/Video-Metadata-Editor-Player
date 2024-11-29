import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';

import Video from 'react-native-video';
import Slider from '@react-native-community/slider';

import DBMetadata from '../DB/DBMetadata';
import LinearGradient from 'react-native-linear-gradient';


const EditFrameMetadata = ({ route, navigation }) => {
    const { item } = route.params;
    const [starttime, setstarttime] = useState(item.StartTime);
    const [endtime, setendtime] = useState(item.EndTime);
    const [starttimeError, setStarttimeError] = useState('');
    const [endtimeError, setEndtimeError] = useState('');
    const [description, setdescription] = useState(item.Description);
    const [descError, setDescError] = useState('');
    const [paused, setPaused] = useState(true);
    const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });
   
    const inputRef = useRef(null);
    const ref = useRef(null);
    const dbMetadata = new DBMetadata();
    const colors = ['#4c669f', '#3b5998', '#192f6a'];

    useEffect(() => {
        setPaused(true);
    }, []);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    const handleProgress = (data) => {
        setProgress({
            currentTime: data.currentTime,
            duration: data.seekableDuration
        });
    };

    const handleSliderChange = (value) => {
        
        setProgress(prevState => ({
            ...prevState,
            currentTime: value
        }));
        if (!paused) {
            ref.current.seek(value);
        }
    };
    
    const handlePause = (data) => {
        setPaused(!paused);
        const formattedTime = formatTime(data.currentTime);
        setstarttime(formattedTime); 
        setendtime(formattedTime); 
    };
    

    const validateFields = () => {
        let isValid = true;

        if (!description) {
            setDescError('Description is required');
            isValid = false;
        } else {
            setDescError('');
        }
        
        return isValid;
    };

    const handleUpdate = () => {
        if (!validateFields()) {
            return;
        }
    
        const metadata = {
            Id: item.Id,
            starttime: starttime,
            endtime: endtime,
            description: description,
        };
    
         dbMetadata.updateFrameMetadata(metadata, () => {
            console.log("Successfully updated");
         });
        navigation.navigate('VideoEditor', { item: item.VideoPath });
    };
 
    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <TouchableOpacity
    style={styles.videoContainer}
    onPress={() => handlePause({ currentTime: progress.currentTime })}
>

                    <Video
                        source={{ uri: item.VideoPath }}
                        ref={ref}
                        onProgress={handleProgress}
                        onPaused={handlePause}
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
                    <Text style={styles.inputLabel}>Description:</Text>
                    <View style={styles.textInputContainer}>
                        <TextInput
                            placeholder='Enter Description' placeholderTextColor={'black'} multiline={true}
                            value={description} style={[styles.inputField, styles.descriptionField]} onChangeText={value => setdescription(value)}
                        />
                    </View>
                    <Text style={styles.errorMessage}>{descError}</Text>
                </View>
                <TouchableOpacity style={styles.button} onPress={handleUpdate}>
                    <LinearGradient
                        colors={colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.button}
                    >
                        <Text style={styles.buttonText}>Update</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: 'white'
    },
    scrollViewContent: {
        flexGrow: 1
    },
    videoContainer: {
        height: 200,
        marginBottom: 16,
        backgroundColor: 'black',
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
        color: 'black'
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
        color: 'black'
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

export default EditFrameMetadata;