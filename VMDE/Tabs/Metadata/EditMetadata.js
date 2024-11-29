import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import EditLocationModal from './EditLocationModal';
import EditPersonModal from './EditPersonModal';
import EditEventModal from './EditEventModal';
import DBMetadata from '../DB/DBMetadata';
import LinearGradient from 'react-native-linear-gradient';
const parseDate = (dateString) => {
    if (dateString instanceof Date) {
        return dateString.toLocaleDateString();
    } else if (typeof dateString === 'string') {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
                return date;

            } else {
                return new Date();
            }
        };
    }
}


const EditMetadata = ({ route, navigation }) => {
    const { item,uri } = route.params;
    const [starttime, setstarttime] = useState(item.StartTime);
    const inputRefModified = useRef(null);

    const [endtime, setendtime] = useState(item.EndTime);
    const [title, setTitle] = useState(item.Title);
    const [person, setperson] = useState();
    const [selectedPersons, setSelectedPersons] = useState(() => {
        const PersonName = item.PersonName ?? '';
        const PersonIds = item.PersonId ?? '';
        return PersonName.split(', ').map((title, index) => ({
            Name: title,
            Id: PersonIds.split(', ')[index]

        }));
    });

    const [location, setlocation] = useState('');
    const [selectedLocation, setSelectedLocation] = useState(() => {
        const locationTitles = item.LocationTitle ?? '';
        const locationIds = item.LocationId ?? '';
        return locationTitles.split(', ').map((title, index) => ({
            Title: title,
            Id: locationIds.split(', ')[index]

        }));
    });

    const [event, setEvent] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(() => {
        const eventTitles = item.EventTitle ?? '';
        const eventIds = item.EventId ?? '';
        return eventTitles.split(', ').map((title, index) => ({
            Title: title,
            Id: eventIds.split(', ')[index]

        }));
    });
    const [selectedCity, setSelectedCity] = useState([]);

    const [description, setdescription] = useState(item.Description);
    const [locationmodalVisible, setlocationModalVisible] = useState(false);
    const [personmodalVisible, setPersonModalVisible] = useState(false);

    const [eventmodalVisible, setEventModalVisible] = useState(false);

    const [dateModified, setDateModified] = useState(parseDate(item.DateModified));
    const [dateCreated, setDateCreated] = useState(parseDate(item.DateCreated));




    const inputRef = useRef(null);
    const ref = useRef(null);
    const dbMetadata = new DBMetadata();
    const colors = ['#4c669f', '#3b5998', '#192f6a'];
    const [paused, setPaused] = useState(true);
    const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });
    const [titleError, setTitleError] = useState('');
    const [starttimeError, setStarttimeError] = useState('');
    const [endtimeError, setEndtimeError] = useState('');
    const [locationError, setLocationError] = useState('');
    const [eventError, setEventError] = useState('');
    const [dateCreatedError, setDateCreatedError] = useState('');
    const [dateModifiedError, setDateModifiedError] = useState('');
    const [personError, setPersonError] = useState('');
    const [descError, setDescError] = useState('');
    const [metadata, setMetadata] = useState([]);
    const [peoplemetadata, setPeopleMetadata] = useState([]);
    const [locationmetadata, setLocationMetadata] = useState([]);
    const [eventmetadata, setEventMetadata] = useState([]);
    const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);
    const [showCreatedModel, setShowCreatedModel] = useState(false);
    const [showModifiedModel, setShowModifiedModel] = useState(false);
    useEffect(() => {

        setPaused(true);

    }, []);
    useEffect(() => {

        getmetadata()
        geteventmetadata()
        getlocationmetadata()
        getpeoplemetadata()
    }, [])

    const getmetadata = async () => {
        await dbMetadata.getMetadataByID(item.Id, (metadata) => {
            setMetadata(metadata);
            setIsMetadataLoaded(true);
        });
    };
    const geteventmetadata = async () => {
        await dbMetadata.getEventMetadataByID(item.Id, (emetadata) => {
            setEventMetadata(emetadata);
            setIsMetadataLoaded(true);
        });
    };
    const getlocationmetadata = async () => {
        await dbMetadata.getLocationMetadataByID(item.Id, (lmetadata) => {
            setLocationMetadata(lmetadata);
            setIsMetadataLoaded(true);
        });
    };
    const getpeoplemetadata = async () => {
        await dbMetadata.getPeopleMetadataByID(item.Id, (pmetadata) => {
            setPeopleMetadata(pmetadata);
            setIsMetadataLoaded(true);
        });
    };

    useEffect(() => {
        if (isMetadataLoaded) {
            if (metadata.length > 0) {
                const { StartTime, EndTime, Title, Description, DateCreated, DateModified } = metadata[0];
                setstarttime(StartTime);
                setendtime(EndTime);
                setTitle(Title);
                setdescription(Description);
            }
            if (peoplemetadata.length > 0) {
                const selectedPersons = peoplemetadata.map(person => ({ Id: person.Id, Name: person.Name }));
                setSelectedPersons(selectedPersons);
            }
            if (locationmetadata.length > 0) {
                const selectedLocations = locationmetadata.map(location => ({ Id: location.Id, Title: location.Title }));
                setSelectedLocation(selectedLocations);
            }
            if (eventmetadata.length > 0) {
                const selectedEvents = eventmetadata.map(event => ({ Id: event.Id, Title: event.Title }));
                setSelectedEvent(selectedEvents);
            }
            if (locationmetadata.length > 0) {
                const selectedCities = locationmetadata.map(city => ({ Id: city.CityId }));
                setSelectedCity(selectedCities);
            }
        }
    }, [isMetadataLoaded, metadata, peoplemetadata, locationmetadata, eventmetadata]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };
    const handleDateCreated = (event, selectedDate) => {
        if (event.type === 'set') {
            const currentDate = new Date(event.nativeEvent.timestamp);
            setDateCreated(currentDate);
        }
        setShowCreatedModel(false);
    };

    const handleDateModified = (event, selectedDate) => {
        if (event.type === 'set') {
            const currentDate = new Date(event.nativeEvent.timestamp);
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


        return isValid;
    };

    const handleUpdate = () => {
        if (!validateFields()) {
            return;
        }
        const parsedModifiedDate = new Date(dateModified);
        const formattedModifiedDate = `${parsedModifiedDate.getDate()}/${parsedModifiedDate.getMonth() + 1}/${parsedModifiedDate.getFullYear()}`;

        const parsedCreatedDate = new Date(dateCreated);
        const formattedCreatedDate = `${parsedCreatedDate.getDate()}/${parsedCreatedDate.getMonth() + 1}/${parsedCreatedDate.getFullYear()}`;


        const selectedPersonIds = selectedPersons.map(person => person.Id);
        const selectedLocationIds = selectedLocation.map(location => location.Id);
        const selectedEventIds = selectedEvent.map(event => event.Id);

        const metadata = {
            Id: item.Id,
            title: title,
            starttime: starttime,
            endtime: endtime,
            datecreated: formattedCreatedDate,
            datemodified: formattedModifiedDate,
            description: description,
            type: 'c',
        };
        
        dbMetadata.updateMetadata(metadata, selectedPersonIds, selectedLocationIds, selectedEventIds, () => {
            console.log("Successfully updated");

        });
        navigation.navigate('VideoEditor', { item: item.VideoPath });
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

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                <TouchableOpacity
                    style={styles.videoContainer}
                    onPress={() => setPaused(!paused)}
                >
                    <Video
                        source={{ uri: uri }}
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
                        <TextInput style={styles.inputField} placeholder='Enter title' placeholderTextColor={'black'} value={title} onChangeText={value => setTitle(value)} />
                    </View>
                    <Text style={styles.errorMessage}>{titleError}</Text>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Start Time:</Text>
                    <View style={styles.textInputContainer}>
                        <TextInput style={styles.inputField} placeholder='00:00' placeholderTextColor={'black'} value={starttime} onChangeText={value => setstarttime(value)} />
                    </View>
                    <Text style={styles.errorMessage}>{starttimeError}</Text>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>End Time:</Text>
                    <View style={styles.textInputContainer}>
                        <TextInput style={styles.inputField} placeholder='00:00' placeholderTextColor={'black'} value={endtime} onChangeText={value => setendtime(value)} />
                    </View>
                    <Text style={styles.errorMessage}>{endtimeError}</Text>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Date Created:</Text>
                    <View style={styles.textInputContainer}>

                        <TextInput
                            ref={inputRef}
                            style={styles.inputField}
                            placeholder='dd/MM/YYYY'
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
                        <TextInput
                            value={selectedLocation.map(location => location.Title).join(', ')}
                            style={styles.inputField}
                            onChangeText={value => setlocation(value)}
                            editable={false}
                            multiline={true}
                            placeholder='Enter Location'
                            placeholderTextColor={'black'}
                        />
                        <TouchableOpacity onPress={() => setlocationModalVisible(true)}>
                            <Image source={require('../../../Assests/Images/dot.png')} style={styles.dotIcon} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.errorMessage}>{locationError}</Text>
                    <EditLocationModal
                        locationmodalVisible={locationmodalVisible}
                        setLocationModalVisible={setlocationModalVisible}
                        onDone={handleLocationModalDone}
                        selectedLocations={selectedLocation}
                        selectedCities={selectedCity}
                    />
                </View>


                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Person:</Text>
                    <View style={styles.textInputContainer}>
                        <TextInput
                            placeholder='Enter Person' placeholderTextColor={'black'}
                            style={styles.inputField}
                            value={selectedPersons.map(Person => Person.Name).join(', ')}
                            onChangeText={value => setperson(value)}
                            editable={false}
                            multiline={true}

                        />
                        <TouchableOpacity onPress={() => setPersonModalVisible(true)}>
                            <Image source={require('../../../Assests/Images/dot.png')} style={styles.dotIcon} />
                        </TouchableOpacity>
                    </View>
                    <EditPersonModal personmodalVisible={personmodalVisible} setPersonModalVisible={setPersonModalVisible} onDone={handlePersonModalDone} selectedPerson={selectedPersons} />
                    <Text style={styles.errorMessage}>{personError}</Text>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Event:</Text>
                    <View style={styles.textInputContainer}>
                        <TextInput
                            placeholder='Enter Event' placeholderTextColor={'black'}
                            style={styles.inputField}
                            value={selectedEvent.map(event => event.Title).join(', ')}
                            onChangeText={value => setEvent(value)}
                            editable={false}
                            multiline={true}
                        />
                        <TouchableOpacity onPress={() => setEventModalVisible(true)}>
                            <Image source={require('../../../Assests/Images/dot.png')} style={styles.dotIcon} />
                        </TouchableOpacity>
                    </View>
                    <EditEventModal eventmodalVisible={eventmodalVisible} setEventModalVisible={setEventModalVisible} onDone={handleEventModalDone} selectedEvents={selectedEvent} />
                    <Text style={styles.errorMessage}>{eventError}</Text>
                </View>


                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Description:</Text>
                    <View style={styles.textInputContainer}>
                        <TextInput
                            placeholder='Enter Description' placeholderTextColor={'black'} multiline={true}
                            value={description} style={[styles.inputField, styles.descriptionField]} 
                            onChangeText={value => setdescription(value)}
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

export default EditMetadata;