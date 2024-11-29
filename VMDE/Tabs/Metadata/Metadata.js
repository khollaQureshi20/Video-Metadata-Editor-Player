import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import LocationModal from './LocationModal';
import PersonModal from './PersonModal';
import EventModal from './EventModal';
import DBMetadata from '../DB/DBMetadata';
import LinearGradient from 'react-native-linear-gradient';
const Metadata = ({ route, navigation }) => {
    const { item } = route.params;

    const [starttime, setstarttime] = useState('');
    const [endtime, setendtime] = useState('');
    const [title, setTitle] = useState('');
    const [person, setperson] = useState('');
    const [selectedPersons, setSelectedPersons] = useState([]);
    const [location, setlocation] = useState('');
    const [selectedLocation, setSelectedLocation] = useState([]);


    const [event, setEvent] = useState('');
    const [selectedEvent, setSelectedEvent] = useState([]);
    const [description, setdescription] = useState('');
    const [locationmodalVisible, setlocationModalVisible] = useState(false);
    const [personmodalVisible, setPersonModalVisible] = useState(false);

    const [eventmodalVisible, setEventModalVisible] = useState(false);
    const [paused, setPaused] = useState(true);
    const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });

    const [showCreatedModel, setShowCreatedModel] = useState(false);
    const [showModifiedModel, setShowModifiedModel] = useState(false);
    const inputRef = useRef(null);
    const ref = useRef(null);
    const dbMetadata = new DBMetadata();
    const colors = ['#4c669f', '#3b5998', '#192f6a'];
    const [type, setType] = useState('c')
    const [dateCreated, setDateCreated] = useState(null);
    const [dateModified, setDateModified] = useState(null);
    const [dateCreatedError, setDateCreatedError] = useState('');
    const [dateModifiedError, setDateModifiedError] = useState('');
    const [titleError, setTitleError] = useState('');
    const [starttimeError, setStarttimeError] = useState('');
    const [endtimeError, setEndtimeError] = useState('');
    const [locationError, setLocationError] = useState('');
    const [eventError, setEventError] = useState('');
    const [personError, setPersonError] = useState('');
    const [descError, setDescError] = useState('');

    const handlePaused = (paused) => {
        if (type === 'f') {
            if (paused == false) {
                setstarttime(formatTime(progress.currentTime));
                setendtime(formatTime(progress.currentTime));
            }
        }
        setPaused(!paused);
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    const handleDateCreated = (event, selectedDate) => {
        if (event.type === 'set') {
            const currentDate = selectedDate || dateCreated;
            setDateCreated(currentDate);
        }
        setShowCreatedModel(false);
    };
    const handleDateModified = (event, selectedDate) => {
        if (event.type === 'set') {
            const currentDate = selectedDate || dateModified;
            setDateModified(currentDate);
        }
        setShowModifiedModel(false);
    };

    const handleProgress = (data) => {
        setProgress({
            currentTime: data.currentTime,
            duration: data.seekableDuration
        });
    };

    const handleSliderChange = (value) => {
        const formattedTime = formatTime(value);
        if (starttime === '') {
            setstarttime(formattedTime);
        } else if (endtime === '') {
            setendtime(formattedTime);
        } else {
            setstarttime(formattedTime);
            setendtime('');
        }
        setProgress(prevState => ({
            ...prevState,
            currentTime: value
        }));
        ref.current.seek(value);
    };

    const validateTime = (time) => {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    };

    const validateFields = () => {
        let isValid = true;


        if (type === 'c') {

            if (!title) {
                setTitleError('Title is required');
                isValid = false;
            } else {
                setTitleError('');
            }

            if (!starttime) {
                setStarttimeError('Start time is required');
                isValid = false;
            } else {
                if (!validateTime(starttime)) {
                    setStarttimeError('Start time is in an invalid format');
                    isValid = false;
                } else {
                    setStarttimeError('');
                }
            }

            if (!endtime) {
                setEndtimeError('End time is required');
                isValid = false;
            } else {
                if (!validateTime(endtime)) {
                    setEndtimeError('End time is in an invalid format');
                    isValid = false;
                } else {
                    setEndtimeError('');
                }
            }

            if (!dateCreated) {
                setDateCreatedError('Date is required');
                isValid = false;
            } else {
                setDateCreatedError('');
            }

            if (!dateModified) {
                setDateModifiedError('Date is required');
                isValid = false;
            } else if (dateModified < dateCreated) {
                setDateModifiedError('Date modified must be greater than date created');
                isValid = false;
            } else {
                setDateModifiedError('');
            }

            if (!description) {
                setDescError('Description is required');
                isValid = false;
            } else {
                setDescError('');
            }

            if (selectedPersons.length === 0) {
                setPersonError('Person is required');
                isValid = false;
            } else {
                setPersonError('');
            }

            if (!selectedLocation.length) {
                setLocationError('Location is required');
                isValid = false;
            } else {
                setLocationError('');
            }

            if (!selectedEvent.length) {
                setEventError('Event is required');
                isValid = false;
            } else {
                setEventError('');
            }

        } else {
            console.error('Invalid content type:', type);
        }

        return isValid;
    };

    const handleClipSave = () => {
        if (!validateFields()) {
            return;
        }
        const parsedModifiedDate = new Date(dateModified);
        const formattedModifiedDate = `${parsedModifiedDate.getDate()}/${parsedModifiedDate.getMonth() + 1}/${parsedModifiedDate.getFullYear()}`;

        const parsedCreatedDate = new Date(dateCreated);
        const formattedCreatedDate = `${parsedCreatedDate.getDate()}/${parsedCreatedDate.getMonth() + 1}/${parsedCreatedDate.getFullYear()}`;

        const metadata = {
            starttime,
            endtime,
            dateCreated: formattedCreatedDate,
            dateModified: formattedModifiedDate,
            title,
            description,
            uri: item,
            type,
        };

        dbMetadata.insertMetadata(metadata, selectedPersons, selectedLocation, selectedEvent, () => {
            console.log("successfully insert");
            setstarttime('');
            setendtime('');
            setdescription('')
        });
        navigation.navigate('VideoEditor', { item: item });
    };
    const handleFrameSave = () => {

        if (description) {
            setDescError('')
            const metadata = {
                starttime,
                endtime,
                description,
                uri: item,
                type,

            };
            dbMetadata.insertFrameMetadata(metadata, () => {
                console.log("Frame metadata successfully inserted");
                setstarttime('');
                setendtime('');
                setdescription('')
            });
            navigation.navigate('VideoEditor', { item: item });
        }
        else {

            setDescError('Fill description field');
            return;
        }
    };

    const handleLocationModalDone = (locations) => {
        const formattedLocations = locations.map(location => ({
            Title: location.Title,
            Id: location.Id
        }));
        setSelectedLocation(formattedLocations);


    };



    const handlePersonModalDone = (persons) => {
        const formattedPersons = persons.map(person => ({
            Name: person.Name,
            Id: person.Id
        }));
        setSelectedPersons(formattedPersons);
    };


    const handleEventModalDone = (events) => {
        const formattedEvent = events.map(event => ({
            Title: event.Title,
            Id: event.Id
        }));
        setSelectedEvent(formattedEvent);
    };
    const handleRadioChange = (selectedType) => {
        setType(selectedType);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <View style={styles.radioContainer}>
                    <TouchableOpacity onPress={() => handleRadioChange('c')} style={styles.radioButton}>
                        <Text style={type === 'c' ? styles.selectedRadioText : styles.radioText}>Clip</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRadioChange('f')} style={styles.radioButton}>
                        <Text style={type === 'f' ? styles.selectedRadioText : styles.radioText}>Frames</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={styles.videoContainer}
                    onPress={() => handlePaused(paused)}
                >
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
                                <TouchableOpacity onPress={() => { (ref.current.seek(progress.currentTime - 10)) }}>
                                    <Image style={styles.controlIcon} source={require('../../../Assests/Images/backward.png')} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handlePaused(paused)}>
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
                {type === 'c' && (
                    <>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Title:</Text>
                            <View style={styles.textInputContainer}>
                                <Image
                                    source={require('../../../Assests/Images/title.png')}
                                    style={styles.titleImage}
                                />
                                <TextInput style={styles.inputField} placeholder='Enter title' placeholderTextColor={'black'} value={title} onChangeText={value => setTitle(value)} />
                            </View>
                            <Text style={styles.errorMessage}>{titleError}</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Start Time:</Text>
                            <View style={styles.textInputContainer}>
                            <Image
                                    source={require('../../../Assests/Images/clock.png')}
                                    style={styles.titleImage}
                                />
                                <TextInput style={styles.inputField} placeholder='00:00' placeholderTextColor={'black'} value={starttime} onChangeText={value => setstarttime(value)} />
                            </View>
                            <Text style={styles.errorMessage}>{starttimeError}</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>End Time:</Text>
                            <View style={styles.textInputContainer}>
                            <Image
                                    source={require('../../../Assests/Images/clock.png')}
                                    style={styles.titleImage}
                                />
                                <TextInput style={styles.inputField} placeholder='00:00' placeholderTextColor={'black'} value={endtime} onChangeText={value => setendtime(value)} />
                            </View>
                            <Text style={styles.errorMessage}>{endtimeError}</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Date Created:</Text>
                            <View style={styles.textInputContainer}>
                            <Image source={require('../../../Assests/Images/date.png')} style={styles.titleImage} />
                                <TextInput
                                    ref={inputRef}
                                    style={styles.inputField}
                                    placeholder='DD/MM/YYYY'
                                    placeholderTextColor={'black'}
                                    value={dateCreated ? dateCreated.toLocaleDateString() : ''}
                                    onFocus={() => setShowCreatedModel(true)}
                                />
                                <TouchableOpacity onPress={() => setShowCreatedModel(!showCreatedModel)}>
                                    <Image source={require('../../../Assests/Images/calendar.png')} style={styles.dotIcon} />
                                </TouchableOpacity>
                            </View>
                            {showCreatedModel && (
                                <DateTimePicker
                                    mode='date'
                                    value={dateCreated || new Date()}
                                    onChange={handleDateCreated}
                                    display='spinner'
                                    style={{ backgroundColor: "white" }}
                                />
                            )}
                            <Text style={styles.errorMessage}>{dateCreatedError}</Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Date Modified:</Text>
                            <View style={styles.textInputContainer}>
                            <Image source={require('../../../Assests/Images/date.png')} style={styles.titleImage} />
                                <TextInput
                                    ref={inputRef}
                                    style={styles.inputField}
                                    placeholder='DD/MM/YYYY'
                                    placeholderTextColor={'black'}
                                    value={dateModified ? dateModified.toLocaleDateString() : ''}
                                    onFocus={() => setShowModifiedModel(true)}
                                />
                                <TouchableOpacity onPress={() => setShowModifiedModel(!showModifiedModel)}>
                                    <Image source={require('../../../Assests/Images/calendar.png')} style={styles.dotIcon} />
                                </TouchableOpacity>
                            </View>
                            {showModifiedModel && (
                                <DateTimePicker
                                    mode='date'
                                    value={dateModified || new Date()}
                                    onChange={handleDateModified}
                                    display='spinner'
                                    style={{ backgroundColor: "white" }}
                                />
                            )}
                            <Text style={styles.errorMessage}>{dateModifiedError}</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Location:</Text>
                            <View style={styles.textInputContainer}>
                            <Image source={require('../../../Assests/Images/location.png')} style={styles.titleImage} />
                                <TextInput
                                    placeholder='Enter Location' placeholderTextColor={'black'} value={selectedLocation.length > 0 ? selectedLocation.map(location => location.Title).join(', ') : ''}
                                    style={styles.inputField}
                                    onChangeText={value => setlocation(value)}
                                    editable={false}
                                    multiline={true}
                                />
                                <TouchableOpacity onPress={() => setlocationModalVisible(true)}>
                                    <Image source={require('../../../Assests/Images/dot.png')} style={styles.dotIcon} />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.errorMessage}>{locationError}</Text>
                            <LocationModal locationmodalVisible={locationmodalVisible} setLocationModalVisible={setlocationModalVisible} onDone={handleLocationModalDone} />
                        </View>


                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Person:</Text>
                            <View style={styles.textInputContainer}>
                            <Image source={require('../../../Assests/Images/people.png')} style={styles.titleImage} />
                                <TextInput
                                    placeholder='Enter Person' placeholderTextColor={'black'}
                                    style={styles.inputField}
                                    value={selectedPersons.length > 0 ? selectedPersons.map(person => person.Name).join(', ') : ''}
                                    onChangeText={value => setperson(value)}
                                    editable={false}
                                    multiline={true}
                                />
                                <TouchableOpacity onPress={() => setPersonModalVisible(true)}>
                                    <Image source={require('../../../Assests/Images/dot.png')} style={styles.dotIcon} />
                                </TouchableOpacity>
                            </View>
                            <PersonModal personmodalVisible={personmodalVisible} setPersonModalVisible={setPersonModalVisible} onDone={handlePersonModalDone} />
                            <Text style={styles.errorMessage}>{personError}</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Event:</Text>
                            <View style={styles.textInputContainer}>
                            <Image source={require('../../../Assests/Images/event.png')} style={styles.titleImage} />
                                <TextInput
                                    placeholder='Enter Event' placeholderTextColor={'black'}
                                    style={styles.inputField}
                                    value={selectedEvent.length > 0 ? selectedEvent.map(event => event.Title).join(', ') : ''}
                                    onChangeText={value => setEvent(value)}
                                    editable={false}
                                    multiline={true}
                                />
                                <TouchableOpacity onPress={() => setEventModalVisible(true)}>
                                    <Image source={require('../../../Assests/Images/dot.png')} style={styles.dotIcon} />
                                </TouchableOpacity>
                            </View>
                            <EventModal eventmodalVisible={eventmodalVisible} setEventModalVisible={setEventModalVisible} onDone={handleEventModalDone} />
                            <Text style={styles.errorMessage}>{eventError}</Text>
                        </View>
                    </>
                )}
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Description:</Text>
                    <View style={styles.textInputContainer}>
                    <Image source={require('../../../Assests/Images/info.png')} style={styles.titleImage} />
                        <TextInput
                            placeholder='Enter Description' placeholderTextColor={'black'} multiline={true}
                            value={description} style={[styles.inputField, styles.descriptionField]} onChangeText={value => setdescription(value)}
                        />
                    </View>
                    <Text style={styles.errorMessage}>{descError}</Text>
                </View>
                <TouchableOpacity onPress={type === 'c' ? handleClipSave : handleFrameSave} style={styles.button}>
                    <LinearGradient
                        colors={colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.button}
                    >
                        <Text style={styles.buttonText}>SAVE</Text>
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
        position: 'relative',
        borderWidth: 1,
        borderRadius: 4,
        backgroundColor: 'lightgray',
        borderColor: 'gray',
        paddingLeft: 40,
        width:'100%'
    },
    titleImage: {
        position: 'absolute',
        left: 10,
        top: '45%',
        transform: [{ translateY: -10 }],
        width: 25,
        height: 25,
        tintColor: 'grey',
    },
    inputField: {
        flex: 1,
        padding: 8,
        color: 'black'
    },
    errorMessage: {
        color: 'red',

    },
    dotIcon: {
        width: 24,
        height: 24,
        tintColor: 'black',
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
    radioContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 16,
    },
    radioButton: {
        marginHorizontal: 16,
    },
    radioText: {
        color: '#000',
    },
    selectedRadioText: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
});

export default Metadata;
