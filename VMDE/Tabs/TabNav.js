import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Gallery from './Gallery';
import NonTagged from './NonTagged';
import Tagged from './Tagged';

import TagIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import ImageIcon from 'react-native-vector-icons/Entypo';

const Tab = createBottomTabNavigator();

function TabNav() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: 'blue',
        tabBarInactiveTintColor: 'black',
        tabBarStyle: {
          height: 60,
          position: 'absolute',
          bottom: 10,
          right: 16,
          left: 16,
          borderRadius: 10,
          backgroundColor: 'white',
        },
        tabBarLabelStyle: { fontSize: 12 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let iconSize = focused ? 45 : 26;

          if (route.name === 'Gallery') {
            iconName = 'folder-video';
            return <ImageIcon name={iconName} size={iconSize} color={color} />;
          } else if (route.name === 'NonTagged') {
            iconName = 'tag-off';
            return <TagIcon name={iconName} size={iconSize} color={color} />;
          } else if (route.name === 'Tagged') {
            iconName = 'tag';
            return <TagIcon name={iconName} size={iconSize} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen
        name="Gallery"
        component={Gallery}
      />
      <Tab.Screen
        name="NonTagged"
        component={NonTagged}
      />
      <Tab.Screen
        name="Tagged"
        component={Tagged}
      />
    </Tab.Navigator>
  );
}

export default TabNav;
