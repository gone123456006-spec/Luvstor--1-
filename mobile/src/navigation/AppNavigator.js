import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import GenderScreen from '../screens/GenderScreen';
import AuthScreen from '../screens/AuthScreen';
import MatchScreen from '../screens/MatchScreen';
import ChatScreen from '../screens/ChatScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: 'transparent' },
                    cardStyleInterpolator: ({ current: { progress } }) => ({
                        cardStyle: {
                            opacity: progress,
                        },
                    }),
                }}
            >
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Gender" component={GenderScreen} />
                <Stack.Screen name="Auth" component={AuthScreen} />
                <Stack.Screen name="Match" component={MatchScreen} />
                <Stack.Screen
                    name="Chat"
                    component={ChatScreen}
                    options={{
                        gestureEnabled: false, // Prevent swipe back during chat
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
