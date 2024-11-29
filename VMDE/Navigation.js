import React from "react";

import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import SplashScreen from "./SplashScreen";
import tabNav from './Tabs/TabNav'
import VideoEditor from './Tabs/Metadata/VideoEditor'
import Metadata from './Tabs/Metadata/Metadata'
import ViewMetadata from "./Tabs/Metadata/ViewMetadata";
import EditMetadata from "./Tabs/Metadata/EditMetadata";
import ClipMetadata from "./Tabs/Metadata/ClipMetadata";
import EditFrameMetadata from "./Tabs/Metadata/EditFrameMetadata"
import ViewFramedata from "./Tabs/Metadata/ViewFramedata";
import JoinClip from "./Tabs/Metadata/JoinClip";
const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName='SplashScreen'
      >
        <Stack.Screen name="SplashScreen" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="tabNav" component={tabNav} options={{ headerShown: false }} />
        <Stack.Screen
          name="VideoEditor"
          component={VideoEditor}
          options={{
            headerShown: false,
           
          }}
        />
        <Stack.Screen
          name="Metadata"
          component={Metadata}
          options={{
            headerShown: true,
            headerTitle: "Metadata",
            headerStyle: { backgroundColor: '#3f51b5' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <Stack.Screen
          name="ViewMetadata"
          component={ViewMetadata}
          options={{
            headerShown: true,
            headerTitle: "View Metadata",
            headerStyle: { backgroundColor: '#3f51b5' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <Stack.Screen
          name="EditMetadata"
          component={EditMetadata}
          options={{
            headerShown: true,
            headerTitle: "Edit Metadata",
            headerStyle: { backgroundColor: '#3f51b5' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <Stack.Screen
          name="EditFrameMetadata"
          component={EditFrameMetadata}
          options={{
            headerShown: true,
            headerTitle: "Edit Frame Metadata",
            headerStyle: { backgroundColor: '#3f51b5' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
         <Stack.Screen
          name="ClipMetadata"
          component={ClipMetadata}
          options={{
            headerShown: true,
            headerTitle: "Clip Metadata",
            headerStyle: { backgroundColor: '#3f51b5' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <Stack.Screen
          name="ViewFramedata"
          component={ViewFramedata}
          options={{
            headerShown: true,
            headerTitle: "Clip Metadata",
            headerStyle: { backgroundColor: '#3f51b5' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
         <Stack.Screen
          name="JoinClip"
          component={JoinClip}
          options={{
            headerShown: true,
            headerTitle: "Table of Content",
            headerStyle: { backgroundColor: '#3f51b5' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
