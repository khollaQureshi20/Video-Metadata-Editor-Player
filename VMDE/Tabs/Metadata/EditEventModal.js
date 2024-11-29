import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, View, Text, Alert, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import DBEvent from '../DB/DBEvent';

const EditEventModal = ({ eventmodalVisible, setEventModalVisible, onDone, selectedEvents }) => {
    const [selectedEvent, setSelectedEvent] = useState([]);
    const [eventInput, setEventInput] = useState('');
    const [event, setEvent] = useState([]);
    const [isOtherSelected, setIsOtherSelected] = useState(false);
    const dbEvent = new DBEvent();

    useEffect(() => {
        fetchEvent();
    }, []);

    useEffect(() => {
        // Initialize selectedEvent with selectedEvents prop
        setSelectedEvent(selectedEvents.map(event => ({
            Id: event.Id.toString(),
            Title: event.Title
        })));
    }, [selectedEvents]);

    const toggleEvent = (event) => {
        if (event.Title === 'Other') {
            setIsOtherSelected(!isOtherSelected);
        } else {
            const isSelected = selectedEvent.find(eve => eve.Id === event.Id);
            if (isSelected) {
                setSelectedEvent(selectedEvent.filter((eve) => eve.Id !== event.Id));
            } else {
                setSelectedEvent([...selectedEvent, event]);
            }
        }
    };

    const handleDone = () => {
        onDone(selectedEvent);
        setEventModalVisible(!eventmodalVisible);
    };

    const handleAdd = () => {
        if (eventInput) {
            dbEvent.insertEvent(eventInput, () => {
                fetchEvent();
                setEventInput('');
            });
        }
        else{
            isOtherSelected(false);
        }
    };

    const fetchEvent = () => {
        dbEvent.fetchEvent(events => {
            const updatedEvent = events.map(event => ({
                Id: event.Id.toString(),
                Title: event.Title
            }));
            updatedEvent.push({ Id: 'other_id', Title: 'Other' });
            setEvent(updatedEvent);
        });
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={eventmodalVisible}
            onRequestClose={() => {
                Alert.alert('Modal has been closed.');
                setEventModalVisible(!eventmodalVisible);
            }}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <ScrollView style={{ maxHeight: 300 }}>
                        {event.map((event, index) => (
                            <View key={index} style={styles.checkboxContainer}>
                                <CheckBox
                                    value={selectedEvent.some(eve => eve.Id === event.Id) || (event.Title === 'Other' && isOtherSelected)}
                                    onValueChange={() => toggleEvent(event)}
                                    tintColors={{ true: 'green', false: 'black' }}
                                />
                                <Text style={styles.textStyle}>{event.Title}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    {isOtherSelected && (
                        <View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.otherstyle}>Other:</Text>
                                <TextInput
                                    onChangeText={(text) => setEventInput(text)}
                                    style={styles.othertxt}
                                    placeholder='Enter Event'
                                    value={eventInput}
                                    tintColors='black'
                                />
                            </View>
                            <TouchableOpacity onPress={handleAdd} style={styles.addbuttonContainer}>
                                <Text style={styles.buttonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity onPress={handleDone} style={styles.buttonContainer}>
                        <Text style={styles.buttonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default EditEventModal;

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22,
    },
    modalView: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: 300,
    },
    textStyle: {
        color: 'black',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    addbuttonContainer: {
        marginTop: 20,
        marginLeft: 50,
        width: 100,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2196F3',
        padding: 10,
        borderRadius: 20,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonContainer: {
        marginTop: 20,
        width: 150,
        alignItems: 'center',
        backgroundColor: '#2196F3',
        padding: 10,
        borderRadius: 20,
        justifyContent: 'center'
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    otherstyle: {
        fontSize: 15,
        fontWeight: 'bold',
        fontFamily: 'Inter',
        color: 'black',
        marginRight: 10,
    },
    othertxt: {
        borderWidth: 2,
        flex: 1,
        height: 40,
        borderRadius: 30,
        color: 'black',
        fontSize: 10,
    },
});
