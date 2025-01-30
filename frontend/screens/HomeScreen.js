import React, {useEffect, useState} from 'react'
import {
  StyleSheet,
  View,
} from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import {baseURL} from './../apis/index'
import { Text, Divider, useTheme } from '@rneui/themed'
import {
  Colors,
  Button,
} from 'react-native-paper'

const HomeScreen = props => {
  var ws = React.useRef(new WebSocket(`${baseURL}/ws`)).current
  const [temperature, setTemperature] = useState(0)
  const [humidity, setHumidity] = useState(0)
  const [soilMoisture1, setSoilMoisture1] = useState(0)
  const [soilMoisture2, setSoilMoisture2] = useState(0)
  const [email, setEmail] = useState('loading')
  const Boiler = async () => {
    const userEmail = await AsyncStorage.getItem('email')
    setEmail(userEmail)
  }
  const { theme } = useTheme();

  useEffect(() => {
    ws.onmessage = e => {
      console.log(e)
      var sensorData = e.data.split(" ")
      setTemperature(sensorData[1].toString())
      setHumidity(sensorData[0].toString())
      setSoilMoisture1(sensorData[2].toString())
      setSoilMoisture2(sensorData[3].toString())
    };
  }, []);

  useEffect(() => {
    Boiler()
  }, [])

  return (
    <>
      <View style={styles.body}>
      <Text
        style={styles.text}
        h2
        h2Style={{ color: theme?.colors?.primary }}
      >
        Šiltnamio informacija
      </Text>
      <Divider width={5} color={theme?.colors?.primary} />
          <Text h4 style={styles.sectionTitle}>Temperatūra {temperature}°C</Text>
          <Text h4 style={styles.sectionTitle}>Oro drėgmė {humidity}%</Text>
          <Text h4 style={styles.sectionTitle}>1 augalo dirvožemio drėgmė {soilMoisture1}%</Text>
          <Text h4 style={styles.sectionTitle}>2 augalo dirvožemio drėgmė {soilMoisture2}%</Text>
          <Divider width={5} color={theme?.colors?.primary} />
          <View style={styles.footer}>
        <Button style={{margin: 10}} color={Colors.blue500} mode="contained" onPress={() => props.navigation.push('history')}> Istorija </Button>
        <Button style={{margin: 10}} color={Colors.blue500} mode="contained" onPress={() => props.navigation.push('settings')}> Nustatymai </Button>
          </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  body: {
    backgroundColor: Colors.white,
    flex: 1
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'center',
    margin: 10,
  },
  footer: {
    position: 'absolute', 
    left: 0, 
    right: 0,
    bottom: 0
  },
  text: {
    textAlign: 'center',
    padding: 5,
  },
})

export default HomeScreen
