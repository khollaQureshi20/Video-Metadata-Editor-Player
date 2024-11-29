import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, View, Text, Alert, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import { useIsFocused } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DBLocation from '../DB/DBLocation';
import DBCity from '../DB/DBCity';

const LocationModal = ({ locationmodalVisible, setLocationModalVisible, onDone }) => {
    const [selectedLocation, setSelectedLocation] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);
    const [locationInput, setLocationInput] = useState('');
    const [cityInput, setCityInput] = useState('');
    const [locations, setLocations] = useState([]);
    const [cities, setCities] = useState([]);
    const [isOtherLocationSelected, setIsOtherLocationSelected] = useState(false);
    const [isOtherCitySelected, setIsOtherCitySelected] = useState(false);
    const isFocused = useIsFocused();
    const dbLocation = new DBLocation();
    const dbCity = new DBCity();

    useEffect(() => {
        if (isFocused) {
            fetchCities();
        }
    }, [isFocused]);

    useEffect(() => {
        if (selectedCity) {
            fetchLocations(selectedCity.Id);
        }
    }, [selectedCity]);

    const fetchCities = () => {
        dbCity.fetchCity(city => {
            setCities(city);
        });
    };

    const fetchLocations = (cityId) => {
        dbLocation.fetchLocationsByCity(cityId, locations => {
            setLocations(locations);
        });
    };

    const handleAddLocation = () => {
        if (locationInput) {
            dbLocation.insertLocation(locationInput, selectedCity.Id, () => {
                fetchLocations(selectedCity.Id);
                setIsOtherLocationSelected(false);
                setLocationInput('');
            });
        }
    };

    const handleAddCity = () => {
        if (cityInput) {
            dbCity.insertCity(cityInput, () => {
                fetchCities();
                setCityInput('');
                setIsOtherCitySelected(false);
            });
        }
        else {
            setIsOtherCitySelected(false);
        }
    };

    const handleDone = () => {
        onDone(selectedLocation);
        setSelectedLocation([]);
        setLocations([])
        setLocationModalVisible(false);
        setSelectedCity(null);
        setIsOtherLocationSelected(false);
        setIsOtherCitySelected(false);
    };
    

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={locationmodalVisible}
            onRequestClose={() => {
                Alert.alert('Modal has been closed.');
                setLocationModalVisible(!locationmodalVisible);
            }}
        >
            <View style={styles.container}>
                <View style={styles.modal}>
                    <Text style={styles.header}>Select City</Text>

                    <View style={styles.pickerContainer}>


                        <Picker
                            selectedValue={selectedCity}
                            style={styles.picker}
                            onValueChange={(itemValue, itemIndex) => {
                                if (itemValue === 'other') {
                                    setIsOtherCitySelected(true);
                                    setSelectedCity(null);

                                } else {
                                    setSelectedCity(itemValue);
                                    setIsOtherCitySelected(false);

                                }
                            }}
                        >
                            <Picker.Item label="Select City" value={null} />
                            {cities.map((city, index) => (
                                <Picker.Item key={index} label={city.Name} value={city} />
                            ))}
                            <Picker.Item label="Other" value="other" />
                        </Picker>

                    </View>


                    {isOtherCitySelected && (
                        <View style={styles.input}>
                            <Text style={styles.inputLabel}>Other:</Text>
                            <TextInput
                                onChangeText={(text) => setCityInput(text)}
                                style={styles.inputField}
                                placeholder='Enter City'
                                value={cityInput}
                            />
                            <TouchableOpacity onPress={handleAddCity} style={styles.addButton}>
                                <Text style={styles.buttonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <Text style={styles.header}>Select Location</Text>
                    <ScrollView style={styles.scroll}>
                        {Array.isArray(locations) && locations.map((location, index) => (
                            <View key={index} style={styles.option}>
                                <CheckBox
                                    value={selectedLocation.some(loc => loc.Id === location.Id)}
                                    onValueChange={() => setSelectedLocation(prevState => {
                                        if (prevState.some(loc => loc.Id === location.Id)) {
                                            return prevState.filter(loc => loc.Id !== location.Id);
                                        } else {
                                            return [...prevState, location];
                                        }
                                    })}
                                    tintColors={{ true: 'green', false: 'black' }}
                                />
                                <Text style={styles.optionText}>{location.Title}</Text>
                            </View>
                        ))}
                        <View style={styles.option}>
                            <CheckBox
                                value={isOtherLocationSelected}
                                onValueChange={() => setIsOtherLocationSelected(prevState => !prevState)}
                                tintColors={{ true: 'green', false: 'black' }}
                            />
                            <Text style={styles.optionText}>Other</Text>
                        </View>
                    </ScrollView>


                    {isOtherLocationSelected && (
                        <View style={styles.input}>
                            <Text style={styles.inputLabel}>Other:</Text>
                            <TextInput
                                onChangeText={(text) => setLocationInput(text)}
                                style={styles.inputField}
                                placeholder='Enter Location'
                                value={locationInput}
                            />
                            <TouchableOpacity onPress={handleAddLocation} style={styles.addButton}>
                                <Text style={styles.buttonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
                        <Text style={styles.buttonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default LocationModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
        width: '80%',
    },
    header: {
        color: 'blue',
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 10,
    },
    scroll: {
        maxHeight: 150,
        marginBottom: 10,
    },
    pickerContainer: {
        borderColor: 'black',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 10,
        width: 170
    },
    picker: {
        height: 50,
        width: '120%',
        color: 'black'
    },

    option: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,

    },
    optionText: {
        
        fontSize: 16,
        color: 'black',
    },
    input: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    selectedCityText: {
        fontSize: 16,
        color: 'black',
    },
    inputLabel: {
        fontSize: 16,
        marginRight: 10,
        color: 'black',
    },
    inputField: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingVertical: 5,
        paddingHorizontal: 10,
        fontSize: 16,
        color: 'black'
    },
    addButton: {
        backgroundColor: 'blue',
        paddingVertical: 8,
        paddingHorizontal: 20
        ,
        borderRadius: 5,
        marginLeft: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    doneButton: {
        backgroundColor: 'blue',
        paddingVertical: 12,
        paddingHorizontal: 50,
        borderRadius: 20,
        marginTop: 10,
    },
});