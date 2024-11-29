import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, View, Text, Alert, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import DBCity from '../DB/DBCity';

const CityModal = ({ citymodalVisible, setCityModalVisible, onDone }) => {
    const [selectedCity, setSelectedCity] = useState([]);
    const [cityInput, setCityInput] = useState('');
    const [city, setCity] = useState([]);
    const [isOtherSelected, setIsOtherSelected] = useState(false);
    const dbCity = new DBCity();

    useEffect(() => {
        fetchCity();
    }, []);

    const toggleCity = (city) => {
        if (city.Name === 'Other') {
            setIsOtherSelected(!isOtherSelected);
        } else {
            const isSelected = selectedCity.find(c => c.Id === city.Id);
            if (isSelected) {
                setSelectedCity(selectedCity.filter((c) => c.Id !== city.Id));
            } else {
                setSelectedCity([...selectedCity, city]);
            }
        }
    };

    const handleDone = () => {
       
        onDone(selectedCity);
        setCityModalVisible(!citymodalVisible);
    };
    const handleAdd = () => {
        if (cityInput) {
            dbCity.insertCity(cityInput, () => {
                fetchCity();
                setCityInput('');
            });
        }
    }

    const fetchCity = () => {
        dbCity.fetchCity(city => {
            const updatedCity = city.map(c => ({
                Id: c.Id,
                Name: c.Name
            }));
            updatedCity.push({ Id: 'other_id', Name: 'Other' });
            setCity(updatedCity);
        });
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={citymodalVisible}
            onRequestClose={() => {
                Alert.alert('Modal has been closed.');
                setCityModalVisible(!citymodalVisible);
            }}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <ScrollView style={{ maxHeight: 300 }}>
                        {city.map((city, index) => (
                            <View key={index} style={styles.checkboxContainer}>
                                <CheckBox
                                    value={selectedCity.some(c => c.Id === city.Id) || (city.Name === 'Other' && isOtherSelected)}
                                    onValueChange={() => toggleCity(city)}
                                    tintColors={{ true: 'black', false: 'black' }}
                                />
                                <Text style={styles.textStyle}>{city.Name}</Text>

                            </View>
                        ))}
                    </ScrollView>

                    {isOtherSelected && (
                        <View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.otherstyle}>Other:</Text>
                            <TextInput
                                onChangeText={(text) => setCityInput(text)}
                                style={styles.othertxt}
                                placeholder='Enter City'
                                value={cityInput}
                                tintColors='black'
                            />
                            
                                <TouchableOpacity onPress={handleAdd} style={styles.addbuttonContainer}>
                                    <Text style={styles.buttonText}>Add</Text>
                                </TouchableOpacity>
                            
                        </View>
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

export default CityModal;

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
    addbuttonContainer: {
        marginTop: 20,
        marginLeft:50,
        width:100,
        alignItems: 'center',
        justifyContent:'center',
        backgroundColor: '#2196F3',
        padding: 10,
        borderRadius: 20,
        
    },
    textStyle: {
        color: 'black',
        fontWeight: 'bold',
        textAlign: 'center',
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
