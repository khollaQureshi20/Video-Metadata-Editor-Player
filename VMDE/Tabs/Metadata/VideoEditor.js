
import React, { useRef, useState, useEffect } from 'react';
import { Alert, View, Text, TouchableOpacity, Button, StyleSheet, Image, FlatList, Modal, Animated } from 'react-native';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import DBMetadata from '../DB/DBMetadata';
import { useIsFocused } from '@react-navigation/native';
import Share from 'react-native-share';
import FFmpegKit, { RNFFmpeg, execute } from 'react-native-ffmpeg';
import RNFetchBlob from 'react-native-fetch-blob';
const VideoEditor = ({ route, navigation }) => {
  const { item } = route.params;
  const [selection, setSelection] = useState('Clip');
  const handleSelectionChange = (value) => {
    setSelection(value);
  };
  const [uri, setUri] = useState('');
  const [clicked, setClicked] = useState(false);
  const [paused, setPaused] = useState(true);
  const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });
  const [metadata, setMetadata] = useState([]);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [modalVisible3, setModalVisible3] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const alertOpacity = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();
  const ref = useRef();
  const dbMetadata = new DBMetadata();
  const [modalCutterVisible, setModalCutterVisible] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [frameData, setFrameData] = useState([]);
  const [clipFrame, setClipFrame] = useState([]);
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);
  const [id, setId] = useState('')
  const [isheaderModalVisible, setHeaderModalVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  const handleDelete = (id) => {
    setDeleteItemId(id);
    setShowModal(true);
  };
  const confirmDelete = (id) => {
    dbMetadata.deleteMetadata(id, () => {
      console.log("Deleted successfully by id: " + deleteItemId);
    });
    getMetadata();
    setShowModal(false);

  };

  const closeModaldelete = () => {
    setShowModal(false);
    setDeleteItemId(null);
  };
  useEffect(() => {
    if (isFocused) {
      getMetadata();
      getFrameMetadata();

      setUri(item)
    }
  }, [isFocused]);

  useEffect(() => {
    const fetchClip = async () => {
      if (isMetadataLoaded) {
        if (isFocused) {
          const filename = getFileName(item);
          const [name, extension] = filename.split('.');
          await dbMetadata.getMetadataByClip(name, (metadata) => {
            setMetadata(prevMetadata => [...prevMetadata, ...metadata]);
            setIsMetadataLoaded(true);
          });
        }
      }
    }
    fetchClip();

  }, [isMetadataLoaded, isFocused])

  const checkfile = async () => {
    try {
      const downloadDir = RNFetchBlob.fs.dirs.DownloadDir;
      const name = getFileName(item);
      const fullname = name.replace(".mp4", ".txt");
      const filePath = `${downloadDir}/${fullname}`;

      const exists = await RNFetchBlob.fs.exists(filePath);
      return exists;
    } catch (error) {
      console.error("Error checking file existence:", error);
      return false;
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      if (isMetadataLoaded && (await checkfile()) && (metadata.length === 0 || hasOnlyNullObjects(metadata))) {
        setHeaderModalVisible(true);
      }
    };

    fetchData();
  }, [isMetadataLoaded, metadata]);

  const handleYes = () => {
    setHeaderModalVisible(false);
    readDataFromFile();
  };

  const handleNo = () => {
    setHeaderModalVisible(false);
  };
  const getMetadata = async () => {
    await dbMetadata.getMetadata(item, (metadata) => {
      setMetadata(metadata);
      setIsMetadataLoaded(true);
    });

  };

  const getFrameMetadata = () => {
    dbMetadata.getFrameMetadata(item, (fmetadata) => {
      setFrameData(fmetadata);
    });
    fetchFrame()
  };

  const fetchFrame = async () => {
    if (metadata) {
      if (frameData.length == 0) {
        const selectedMetadata = metadata[1] ?? metadata[0];

        if (selectedMetadata) {
          const { VideoPath, StartTime, EndTime } = selectedMetadata;

          await dbMetadata.getExactFrameMetadata(
            VideoPath,
            StartTime,
            EndTime,
            (fmetadata) => {
              setFrameData(fmetadata);
              setIsMetadataLoaded(true);
            }
          );
        }
      }
    }
  };
  const writeDataToFile = async (metadataArray, frameDataArray) => {
    try {

      const filteredMetadataArray = metadataArray.filter(data => data !== null && data !== undefined);
      const filteredFrameDataArray = frameDataArray.filter(data => data !== null && data !== undefined);

      const metadataString = JSON.stringify(filteredMetadataArray, null, 2);
      const frameDataString = JSON.stringify(filteredFrameDataArray, null, 2);

      const content = `Metadata:\n${metadataString}\n\nFrame Data:\n${frameDataString}`;

      const downloadDir = RNFetchBlob.fs.dirs.DownloadDir;
      const name = getFileName(item);
      const fullname = name.replace(".mp4", ".txt");
      const filePath = `${downloadDir}/${fullname}`;

      await RNFetchBlob.fs.writeFile(filePath, content, 'utf8');
      console.log(`File saved successfully at: ${filePath}`);
    } catch (error) {
      console.error('Error writing file:', error);
    }
  };
  function hasOnlyNullObjects(array) {
    return array.every(isAllNullValues);
  }
  function isAllNullValues(obj) {
    return Object.values(obj).every(value => value === null);
  }
  const readDataFromFile = async () => {
    try {
      const downloadDir = RNFetchBlob.fs.dirs.DownloadDir;
      const name = getFileName(item);
      const fullname = name.replace(".mp4", ".txt");
      const filePath = `${downloadDir}/${fullname}`;

      const exists = await RNFetchBlob.fs.exists(filePath);
      if (!exists) {
        // console.error('File does not exist:', filePath);
        return;
      }

      const fileContent = await RNFetchBlob.fs.readFile(filePath, 'utf8');
      console.log('Metadata of video:');
      console.log(fileContent);

      if (!fileContent) {
        //console.error('File content is empty or undefined.');
        return;
      }

      const metadataIndex = fileContent.indexOf('Metadata:\n');
      const frameDataIndex = fileContent.indexOf('\n\nFrame Data:\n');

      if (metadataIndex === -1 || frameDataIndex === -1) {
        console.error('File content is not in the expected format.');
        return;
      }


      const metadataString = fileContent.substring(metadataIndex + 'Metadata:\n'.length, frameDataIndex);
      const frameDataString = fileContent.substring(frameDataIndex + '\n\nFrame Data:\n'.length);

      const metadataArray = JSON.parse(metadataString);
      const frameDataArray = JSON.parse(frameDataString);

      if ((metadata == [] || hasOnlyNullObjects(metadata)) && !frameData == []) {
        dbMetadata.insertMetadatabyheader(metadataArray, () => {
          console.log("successfully insert");

        });
        dbMetadata.insertShareFrameMetadata(frameDataArray, () => {
          console.log("Frame metadata successfully inserted");
        });
      }

      else {
        console.log("already in database")
      }

      await getMetadata();
      await getFrameMetadata();
    } catch (error) {
      console.error('Error reading or parsing file:', error);
    }
  };

  const readCustomMetadata = async () => {
    Video.getMetadata(item)
      .then((output) => {
        console.log("output", output);
      })
      .catch((error) => {
        console.error(error);
      });
  };
  const parseMetadata = (output) => {
    const metadata = {};
    const lines = output.split('\n');

    lines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        metadata[key.trim()] = value.trim();
      }
    });

    return metadata;
  };
  const showHeaderMetadataAlert = () => {
    Alert.alert("Message", "already in database")
  };
  const getFileName = (filePath) => {
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  };


  const MAX_DESCRIPTION_LENGTH = 5000;

  const addMetadataToHeader = async () => {
    try {
      // Check if item is defined
      if (!item) {
        console.error("Error: item is undefined or null");
        return;
      }

      const videoFilePath = item.replace("file://", "");
      const videoFileExists = await RNFetchBlob.fs.exists(videoFilePath);

      // Check if video file exists
      if (videoFileExists) {
        const metadataArray = metadata.map(currentMetadata => ({
          Title: currentMetadata.Title,
          Startime: currentMetadata.StartTime,
          Endtime: currentMetadata.EndTime,
          DateModified: currentMetadata.DateModified,
          DateCreated: currentMetadata.DateCreated,
          People: currentMetadata.PersonName,
          Location: currentMetadata.LocationTitle,
          Event: currentMetadata.EventTitle,
          City: currentMetadata.CityName,
          Description: currentMetadata.Description,
          Type: currentMetadata.Type,
          VideoPath: currentMetadata.VideoPath,
        }));



        const frameDataArray = frameData.map(currentFrameData => ({
          Starttime: currentFrameData.StartTime,
          Endtime: currentFrameData.EndTime,
          Description: currentFrameData.Description,
          Type: currentFrameData.Type,
          VideoPath: currentFrameData.VideoPath,
        }));

        writeDataToFile(metadataArray, frameDataArray)

        const tempVideoFilePath = `${videoFilePath}_temp.mp4`;
        await writeMetadataToVideo(videoFilePath, tempVideoFilePath, metadataArray, frameDataArray);


        await RNFetchBlob.fs.mv(tempVideoFilePath, videoFilePath);
        showSuccessAlert("Successfully added metadata in header");
      } else {
        console.log("Video file does not exist:", videoFilePath);
      }
    } catch (error) {
      console.error("Error checking file existence or writing metadata:", error);
    }

    setModalVisible2(false);
  };

  const writeMetadataToVideo = async (inputFilePath, outputFilePath, metadataArray, frameDataArray) => {
    try {
      // Construct FFmpeg command to add metadata
      let ffmpegCommand = `-y -i "${inputFilePath}" -c copy`;

      // Prepare metadata string
      const metadataString = metadataArray.map(data => {
        return Object.entries(data).map(([key, value]) => `${key}=${value}`).join(':');
      }).join(';');

      const frameDataString = frameDataArray.map(data => {
        return Object.entries(data).map(([key, value]) => `${key}=${value}`).join(':');
      }).join(';');
      console.log(frameDataString, metadataString)
      // Add metadata to FFmpeg command
      ffmpegCommand += ` -metadata album="${metadataString}"`;


      // Add frame data to FFmpeg command
      ffmpegCommand += ` -metadata artist="${frameDataString}"`;


      // Specify output file path
      ffmpegCommand += ` -f mp4 "${outputFilePath}"`;

      // Execute FFmpeg command
      const session = await FFmpegKit.execute(ffmpegCommand);
      const returnCode = true; // Assuming FFmpeg execution was successful

      // Check FFmpeg execution status
      if (!returnCode) {
        console.error("FFmpeg execution failed for video file:", inputFilePath);
      }
    } catch (error) {
      console.error("Error writing metadata to video:", error);
    }
  };
  const addwithoutMetadataToHeader = async () => {
    try {
      // Check if item is defined
      if (!item) {
        console.error("Error: item is undefined or null");
        return;
      }

      const videoFilePath = item.replace("file://", "");
      const videoFileExists = await RNFetchBlob.fs.exists(videoFilePath);

      // Check if video file exists
      if (videoFileExists) {
        // Prepare metadata array

        const tempVideoFilePath = `${videoFilePath}_temp.mp4`;
        await writewithoutMetadataToVideo(videoFilePath, tempVideoFilePath);


        await RNFetchBlob.fs.mv(tempVideoFilePath, videoFilePath);
        showSuccessAlert("Successfully added metadata in header");
      } else {
        console.log("Video file does not exist:", videoFilePath);
      }
    } catch (error) {
      console.error("Error checking file existence or writing metadata:", error);
    }

    setModalVisible2(false);
  };

  const writewithoutMetadataToVideo = async (inputFilePath, outputFilePath) => {
    try {

      let ffmpegCommand = `-y -i "${inputFilePath}" -c copy`;

      // Prepare metadata string

      // Add metadata to FFmpeg command
      ffmpegCommand += ` -metadata album="null"`;


      // Add frame data to FFmpeg command
      ffmpegCommand += ` -metadata artist="null"`;

      // Specify output file path
      ffmpegCommand += ` -f mp4 "${outputFilePath}"`;

      // Execute FFmpeg command
      const session = await FFmpegKit.execute(ffmpegCommand);
      const returnCode = true; // Assuming FFmpeg execution was successful

      // Check FFmpeg execution status
      if (!returnCode) {
        console.error("FFmpeg execution failed for video file:", inputFilePath);
      }
    } catch (error) {
      console.error("Error writing metadata to video:", error);
    }
  };
  const getexactFrameMetadata = async () => {
    dbMetadata.getExactFrameMetadata(item, startTime, endTime, (fmetadata) => {
      setClipFrame(fmetadata);
    });
  };
  const handleFrameDelete = (id) => {
    dbMetadata.deleteFrameMetadata(id, () => {
      console.log("deleted succussfully by id:" + { $id })
    });
    getFrameMetadata();
  };
  const handleCut = async (start, end, id) => {
    setStartTime(start);
    setEndTime(end);
    setId(id)
    await getexactFrameMetadata(item, startTime, endTime)
    setModalCutterVisible(true);
  };
  const handleClipSave = async () => {
    try {
      if (!startTime && !endTime) {
        console.error("Error: start and end time empty");
        return;
      }
      const folderPath = RNFetchBlob.fs.dirs.DCIMDir + '/Camera';
      const videoFilePath = item.replace("file://", "");
      const fileName = `${id}.mp4`;
      const outputFilePath = `${folderPath}/${fileName}`;
      if (folderPath) {
        const filteredMetadata = metadata.map(currentMetadata => ({
          Title: currentMetadata.Title,
          StartTime: currentMetadata.StartTime,
          EndTime: currentMetadata.EndTime,
          DateCreated: currentMetadata.DateCreated,
          DateModified: currentMetadata.DateModified,
          Description: currentMetadata.Description,
          CityName: currentMetadata.CityName,
          PersonName: currentMetadata.PersonName,
          LocationTitle: currentMetadata.LocationTitle,
          EventTitle: currentMetadata.EventTitle,
          Type: currentMetadata.Type
        }));

        const frameDataArray = clipFrame.map(currentFrameData => ({
          Starttime: currentFrameData.StartTime,
          Endtime: currentFrameData.EndTime,
          Description: currentFrameData.Description,
          Type: currentFrameData.Type,
        }));
        let ffmpegCommand = `-y -i "${videoFilePath}" -ss ${startTime} -to ${endTime}`;
        const albumMetadataString = filteredMetadata.map(data => {
          return Object.entries(data).map(([key, value]) => `${key}=${value}`).join(':');
        }).join(';');

        
        const artistMetadataString = frameDataArray.map(data => {
          return Object.entries(data).map(([key, value]) => `${key}=${value}`).join(':');
        }).join(';');

        // Add album metadata to FFmpeg command
        ffmpegCommand += ` -metadata album="${albumMetadataString}"`;

        // Add artist metadata to FFmpeg command
        ffmpegCommand += ` -metadata artist="${artistMetadataString}"`;

        // Specify output file path
        ffmpegCommand += ` -codec copy "${outputFilePath}"`;

        console.log("FFmpeg command:", ffmpegCommand);

        const session = await FFmpegKit.execute(ffmpegCommand);
        console.log(`FFmpeg command executed with session: ${session}`);
        console.log("Output file path:", outputFilePath);
        console.log("Original file path:", videoFilePath);

        const returnCode = true;
        if (returnCode) {
          console.log("FFmpeg execution successful");
          showSuccessAlert("Successfully added metadata, cut the video, and saved to gallery");
          setModalCutterVisible(false);
          try {
            const options = {
              title: 'Share Video',
              message: 'Check out this video',
              url: `file://${outputFilePath}`,
              type: 'application/octet-stream',
            };
            await Share.open(options);
          } catch (error) {
            Alert.alert("Error", "User cannot hsare video")
          }
        } else {
          console.error("FFmpeg execution failed with return code:", returnCode);
        }
      }
      else {
        console.log("folder not find")
      }

    } catch (error) {
      console.error("Error checking file existence or writing metadata:", error);
    }

  };
  const renderItem = ({ item,index }) => {
    if (!item) {
      return null;
    }

    return (
      <View style={styles.item}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.navigate('ViewMetadata', { item, uri, onReturn: uri })}>
             <Text style={styles.title}>{`${index + 1}. ${item.Title}`}</Text> 
            {/*<Text style={styles.title}>{item.Title}</Text>*/}
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', marginTop: 5 }}>
            <TouchableOpacity onPress={() => handleCut(item.StartTime, item.EndTime, item.Id)}>
              <Image source={require('../../../Assests/Images/cutter.png')} style={{ resizeMode: 'contain', width: 25, height: 25, marginRight: 10 }} />
            </TouchableOpacity>

            <Modal
              animationType="fade"
              transparent={true}
              visible={modalCutterVisible}
              onRequestClose={() => {
                setModalCutterVisible(false);
              }}
            >
              <View style={styles.modalBackground}>
                <View style={styles.shareModalContainer}>
                  <Text style={styles.modalText}>Do you want to cut clip?</Text>
                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity style={styles.modalButton} onPress={async () => await handleClipSave(true)}>
                      <Text style={styles.modalButtonText}>Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalButton} onPress={() => setModalCutterVisible(false)}>
                      <Text style={styles.modalButtonText}>No </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            <TouchableOpacity onPress={() => navigation.navigate('EditMetadata', { item, uri })}>
              <Image source={require('../../../Assests/Images/edit.png')} style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDelete(item.Id)}>
              <Image source={require('../../../Assests/Images/delete.png')} style={[styles.icon, { marginLeft: 10 }]} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.time}>{item.StartTime} - {item.EndTime}</Text>
      </View>
    );
  };

  const renderFrameItem = ({ item, index }) => (
    <View style={[styles.item, { padding: 20 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation.navigate('ViewFramedata', { item })}>
          <Text style={styles.title}>{`${index + 1}. ${item.Description}`}</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', marginTop: 5 }}>

          <TouchableOpacity onPress={() => navigation.navigate('EditFrameMetadata', { item: item })}>
            <Image source={require('../../../Assests/Images/edit.png')} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleFrameDelete(item.Id)}>
            <Image source={require('../../../Assests/Images/delete.png')} style={[styles.icon, { marginLeft: 10 }]} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.starttime}>{item.StartTime}</Text>
    </View>
  );

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const handleThumbnailPress = () => {
    setClicked(true);
    setPaused(false);
  };

  const handleSave = () => {
    navigation.navigate('Metadata', { item: item });
  };

  const handleProgress = (data) => {

    setProgress({
      currentTime: data.currentTime,
      duration: data.seekableDuration
    });
  };

  const handleSliderChange = (value) => {
    ref.current.seek(value);
  };

  const handleShareWithoutMetadata = async () => {
    await addwithoutMetadataToHeader()
    setModalVisible3(false);
    setShareModalVisible(false)

    try {
      const res = await RNFetchBlob.fs.readFile(item, 'base64');
      const base64Data = `data:video/mp4;base64,${res}`;

      const options = {
        type: 'video/mp4',
        url: base64Data,
      };

      await Share.open(options);
    } catch (error) {
      console.error('Error sharing video:', error);
    }

  };

  const handleShareWithMetadata = async () => {
    await addMetadataToHeader()
    setModalVisible3(false);
    setShareModalVisible(false);

    try {
      const options = {
        title: 'Share Video',
        message: 'Check out this video',
        url: item,
        subject: 'Video Attachment',
        type: 'video/mp4',
      };
      await Share.open(options);
    } catch (error) {
      Alert.alert("Error", error)
    }

  };


  const closeModal = () => {
    setModalVisible3(false);
  };

  const handleSaveHeader = () => {
    setModalVisible2(true)
    setModalVisible3(false);
  };
  const handleShareHeader = () => {
    setModalVisible2(false)

    setShareModalVisible(true)
  }

  const handleConfirmSave = async () => {
    await addMetadataToHeader();
    setModalVisible2(false);
  };

  const handleCancelSave = () => {
    setModalVisible2(false);
  };

  const toggleModalVisibility = () => {
    setModalVisible3(!modalVisible3);
  };

  const showSuccessAlert = (message) => {
    setAlertMessage(message);
    setAlertVisible(true);
    Animated.timing(alertOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      hideSuccessAlert();
    }, 3000);
  };

  const hideSuccessAlert = () => {
    Animated.timing(alertOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setAlertVisible(false);
    });
  };


  const renderContent = () => {
    if (selection === 'Clip') {
      return (
        <FlatList
          data={metadata}
          renderItem={renderItem}
          keyExtractor={(item, index) => (item && item.Id ? item.Id.toString() : index.toString())}
        />
      );
    } else if (selection === 'Frame') {

      return (
        <FlatList
          data={frameData}
          renderItem={renderFrameItem}
          keyExtractor={(item, index) => (item && item.Id ? item.Id.toString() : index.toString())}
        />
      );
    }
  };


  return (
    <View style={{ flex: 1 }}>
      <View style={styles.rectangleBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={require('../../../Assests/Images/back.png')} style={styles.backArrow} />
          </TouchableOpacity>
          <Text style={styles.player}>Video Player</Text>
        </View>
        <TouchableOpacity onPress={toggleModalVisibility}>
          <Image source={require('../../../Assests/Images/dot.png')} style={styles.menuIcon} />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible3}
        onRequestClose={closeModal}
      >
        <TouchableOpacity style={styles.modalBackground} onPress={() => setModalVisible3(false)}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.modalOption} onPress={handleSaveHeader}>
              <Image source={require('../../../Assests/Images/save.png')} style={styles.saveIcon} />
              <Text style={styles.optionText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={handleShareHeader}>
              <Image source={require('../../../Assests/Images/share.png')} style={styles.saveIcon} />
              <Text style={styles.optionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={shareModalVisible}
      >
        <View style={styles.modalBackground}>
          <View style={styles.shareModalContainer}>
            <Text style={styles.modalText}>Do you want to share video</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={() => handleShareWithMetadata()}>
                <Text style={styles.modalButtonText}>With Metadata</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => handleShareWithoutMetadata()}>
                <Text style={styles.modalButtonText}>Without Metadata</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {alertVisible && (
        <Animated.View style={[styles.alertContainer, { opacity: alertOpacity }]}>
          <Text style={styles.alertText}>{alertMessage}</Text>
          <TouchableOpacity onPress={hideSuccessAlert}>
            <Image source={require('../../../Assests/Images/close.png')} style={styles.alertCloseIcon} />
          </TouchableOpacity>
        </Animated.View>
      )}

      <View>
        {paused && (
          <View style={styles.playButton}>
            <TouchableOpacity onPress={handleThumbnailPress}>
              <Image source={require('../../../Assests/Images/play.png')} style={styles.playIcon} />
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity onPress={handleThumbnailPress}>
          {clicked ? (
            <Video
              ref={ref}
              source={{ uri: item }}
              paused={paused}
              onProgress={handleProgress}
              style={{ width: '100%', height: 200 }}
              resizeMode="cover"
              muted={true}
            />
          ) : (
            <Image source={{ uri: item }} style={{ width: '100%', height: 200 }} />
          )}


          {clicked && (
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
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.viewMetadataButton} onPress={() => navigation.navigate('ClipMetadata', { item: item })}>
          <Text style={styles.buttonText}>View Metadata</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.plusButton} onPress={handleSave}>
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.selectionContainer}>
        <TouchableOpacity onPress={() => handleSelectionChange('Clip')} style={styles.radioButton}>
          <Text style={[styles.radioButtonText, selection === 'Clip' && styles.radioButtonSelected]}>Clip</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleSelectionChange('Frame')} style={styles.radioButton}>
          <Text style={[styles.radioButtonText, selection === 'Frame' && styles.radioButtonSelected]}>Frame</Text>
        </TouchableOpacity>
      </View>
      {renderContent()}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible2}
        onRequestClose={() => setModalVisible2(false)}
      >
        <View style={styles.modalContainer2}>
          <View style={styles.modalContent2}>
            <Text style={styles.modalText}>Do you want to save data in header?</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={handleConfirmSave}>
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleCancelSave}>
                <Text style={styles.modalButtonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={isheaderModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setHeaderModalVisible(false)}
      >
        <View style={styles.modalBackground1}>
          <View style={styles.modalContainer1}>
            <Text style={styles.modalTitle1}>Add metadata to the database?</Text>
            <View style={styles.buttonContainer1}>
              <Button title="Yes" onPress={handleYes} />
              <Button title="No" onPress={handleNo} />
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer3}>
          <View style={styles.modalContent3}>
            <View style={{ flexDirection: 'row' }}>
              <Image source={require('../../../Assests/Images/delete.png')} style={styles.deleteicon} />
              <Text style={styles.modalText3}>Are you sure you want to delete?</Text>
            </View>
            <View style={styles.buttonContainer3}>
              <TouchableOpacity style={styles.button3} onPress={confirmDelete}>
                <Text style={styles.buttonText3}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button3} onPress={closeModaldelete}>
                <Text style={styles.buttonText3}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default VideoEditor;

const styles = StyleSheet.create({
  rectangleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#24035a',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backArrow: {
    width: 16,
    height: 19,
    tintColor: 'white',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  playIcon: {
    width: 50,
    height: 50,
    tintColor: 'black',
  },
  menuDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 17,
  },
  menuIcon: {
    width: 25,
    height: 20,
    tintColor: 'white',
  },
  player: {
    color: 'white',
    fontSize: 20,
    marginLeft: 30,
    fontWeight: 'bold'
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 50,
    marginRight: 10
  },
  viewMetadataButton: {
    backgroundColor: 'blue',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  plusButton: {
    backgroundColor: 'blue',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15
  },
  item: {
    padding: 10,
    backgroundColor: 'lightgrey',
    borderRadius: 30,
    margin: 10
  },
  title: {
    fontSize: 20,
    color: 'black',
    fontWeight: 'bold',
  },
  time: {
    fontSize: 16,
    color: 'black',
  },
  starttime: {
    fontSize: 16,
    color: 'black',
    marginLeft: 25
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  deleteicon: {
    width: 20,
    height: 20,
    marginTop: 5,
    padding: 10,
    tintColor: 'grey'
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 150,
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  optionText: {
    fontSize: 17,
    color: 'black',
  },
  saveIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  modalContainer2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent2: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  modalText: {
    fontSize: 15,
    color: 'black',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  modalButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#007bff',
    borderWidth: 2,
    borderColor: '#007bff',
    margin: 10,
    width: 70,
    height: 50,
  },
  modalButtonText: {
    color: 'white',
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
    fontSize: 15,
    marginHorizontal: 5,
  },
  timeText: {
    color: 'white',
  },
  shareModalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    position: 'absolute',
    bottom: 50,
    left: 30,
    right: 50,
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%'
  },
  alertText: {

    color: 'white',
    fontWeight: 'bold',
  },
  alertCloseIcon: {
    width: 10,
    height: 10,
    tintColor: 'white',
  },
  selectionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  radioButton: {
    paddingHorizontal: 20,
  },
  radioButtonText: {
    fontSize: 18,
    color: 'black',
  },
  radioButtonSelected: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    color: 'blue'
  },
  modalBackground1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer1: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle1: {
    fontSize: 18,
    marginBottom: 20,
    color: 'black'
  },
  buttonContainer1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
  },
  modalContainer3: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent3: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    minWidth: 300,
  },
  modalText3: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: 'black'
  },
  buttonContainer3: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button3: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText3: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});