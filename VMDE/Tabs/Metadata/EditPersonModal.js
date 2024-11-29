import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, View, Text, Alert, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import DBPerson from '../DB/DBPerson';

const EditPersonModal = ({ personmodalVisible, setPersonModalVisible, onDone, selectedPerson }) => {
    const [selectedPersons, setSelectedPersons] = useState([]);
    const [personInput, setPersonInput] = useState('');
    const [persons, setPersons] = useState([]);
    const [isOtherSelected, setIsOtherSelected] = useState(false);
    const dbPerson = new DBPerson();

    useEffect(() => {
        fetchPersons();
    }, []);

    useEffect(() => {
        setSelectedPersons(selectedPerson.map(person => ({
            Id: person.Id.toString(),
            Name: person.Name
        })));
    }, [selectedPerson]);

    const togglePerson = (person, newValue) => {
        const personId = person.Id.toString();
        const isSelected = selectedPersons.some(per => per.Id === personId);
        let updatedPersons;

        if (newValue && !isSelected) {
            updatedPersons = [...selectedPersons, { Id: personId, Name: person.Name }];
        } else if (!newValue && isSelected) {
            updatedPersons = selectedPersons.filter(per => per.Id !== personId);
        } else {
            updatedPersons = selectedPersons;
        }

        setSelectedPersons(updatedPersons);
    };

    const handleDone = () => {
        onDone(selectedPersons);
        setPersonModalVisible(!personmodalVisible);
    };

    const handleAdd = () => {
        if (personInput) {
            dbPerson.insertPerson(personInput, () => {
                fetchPersons();
                setPersonInput('');
            });
        }
        else{
            isOtherSelected(false);
        }
    };

    const fetchPersons = () => {
        dbPerson.fetchPersons(persons => {
            const updatedPerson = persons.map(person => ({
                Id: person.Id.toString(),
                Name: person.Name
            }));
            updatedPerson.push({ Id: 'other_id', Name: 'Other' });
            setPersons(updatedPerson);
        });
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={personmodalVisible}
            onRequestClose={() => {
                Alert.alert('Modal has been closed.');
                setPersonModalVisible(!personmodalVisible);
            }}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <ScrollView style={{ maxHeight: 300 }}>
                        {Array.isArray(persons) && persons.map((person, index) => (
                            <View key={index} style={styles.checkboxContainer}>
                                <CheckBox
                                    value={selectedPersons.some(per => per.Id === person.Id)}
                                    onValueChange={(newValue) => {
                                        togglePerson(person, newValue);
                                        if (person.Name === 'Other') setIsOtherSelected(newValue);
                                    }}
                                    tintColors={{ true: 'green', false: 'black' }}
                                />
                                <Text style={styles.textStyle}>{person.Name}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    {isOtherSelected && (
                        <View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.otherstyle}>Other:</Text>
                                <TextInput
                                    onChangeText={(text) => setPersonInput(text)}
                                    style={styles.othertxt}
                                    placeholder='Enter People'
                                    value={personInput}
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

export default EditPersonModal;

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
        justifyContent: 'center',
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
