
import React, {useEffect,useState} from 'react'
import {NavigationNativeContainer } from '@react-navigation/native'
import {createStackNavigator } from '@react-navigation/stack'
import SignupScreen from './screens/SignupScreen'
import LoginScreen from './screens/LoginScreen'
import LoadingScreen from './screens/LoadingScreen'
import HomeSceen from './screens/HomeScreen'
import ConnectionScreen from './screens/ConnectionScreen'
import SettingsScreen from './screens/SettingsScreen'
import HistoryScreen from './screens/HistoryScreen'
import AsyncStorage from '@react-native-community/async-storage'
import messaging from "@react-native-firebase/messaging"
const Stack = createStackNavigator()

const App= ({ navigation }) => {
   const [isloggedin,setLogged] = useState(null)

   const detectLogin= async ()=>{
      const token = await AsyncStorage.getItem('token')
      if(token){
          setLogged(true)
      }else{
          setLogged(false)
      }
   }
  useEffect(()=>{
     detectLogin()
  },[])

  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
  });

  useEffect(() => {
    requestUserPermission();
    const unsubscribe = messaging().onMessage(async remoteMessage => {
    });
    return unsubscribe;
   }, []);

   requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      getFcmToken()
      console.log('Authorization status:', authStatus);
    }
  }

  getFcmToken = async () => {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
     console.log(fcmToken);
     console.log("Your Firebase Token is:", fcmToken);
    } else {
     console.log("Failed", "No token received");
    }
  }

  return (
    <NavigationNativeContainer>
      <Stack.Navigator headerMode="none">
            <Stack.Screen name="loading" component={LoadingScreen} />
            <Stack.Screen name="home" component={HomeSceen} />
            <Stack.Screen name="login" component={LoginScreen} />
            <Stack.Screen name="signup" component={SignupScreen} />
            <Stack.Screen name="connection" component={ConnectionScreen} />
            <Stack.Screen name="settings" component={SettingsScreen} />
            <Stack.Screen name="history" component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationNativeContainer>
  )
}


export default App
