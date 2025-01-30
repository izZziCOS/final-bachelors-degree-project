
import React, {useEffect,useState} from 'react'
import {
   SafeAreaView,
   StyleSheet,
   ScrollView,
   View,
   Text,
   StatusBar,
   NativeModules,
   NativeEventEmitter,
   Button,
   Platform,
   PermissionsAndroid,
   FlatList,
   TouchableHighlight,
   TextInput,
 } from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import { stringToBytes } from "convert-string"
import WifiManager from "react-native-wifi-reborn"
import { Colors } from 'react-native/Libraries/NewAppScreen'
import BleManager from '../BleManager'

 const BleManagerModule = NativeModules.BleManager
 const bleManagerEmitter = new NativeEventEmitter(BleManagerModule)

const ConnectionScreen = (props) => {
   const [isScanning, setIsScanning] = useState(false)
   const peripherals = new Map()
   const [list, setList] = useState([])
   const [email,setEmail] = useState("loading")
   const [SSID, setSSID] = useState('')
   const [wifiPassword, setWifiPassword] = useState('')
   const [isConnected, setIsConnected] = useState(false)
   const [scanDisabled, setScanDisabled] = useState(true)
   const [error, setError] = useState('')
   const [connectionStatus, setConnectionStatus] = useState("")
   const Boiler = async ()=>{
      const userEmail = await AsyncStorage.getItem("email")
      setEmail(userEmail)
   }

useEffect(()=>{
   Boiler()
   console.log("user email",email)
},[])

useEffect(()=>{
  WifiManager.getCurrentWifiSSID().then(
    ssid => {
      setSSID(ssid)
    },
    () => {
      console.log("Cannot get current SSID!");
    }
  );
},[])

   const startScan = () => {
      if (!isScanning) {
        BleManager.scan([], 3, true).then((results) => {
          console.log('Scanning...')
          setIsScanning(true)
        }).catch(err => {
          console.error(err)
        });
      }    
    }

    const handleDisconnectedPeripheral = (data) => {
      let peripheral = peripherals.get(data.peripheral)
      if (peripheral) {
        peripheral.connected = false
        peripherals.set(peripheral.id, peripheral)
        setList(Array.from(peripherals.values()))
      }
      console.log('Disconnected from ' + data.peripheral);
    }
  
    const handleUpdateValueForCharacteristic = (data) => {
      console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
    }

    const handleDiscoverPeripheral = (peripheral) => {
      if (!peripheral.name) {
        peripheral.name = 'Be pavadinimo'
      }
      peripherals.set(peripheral.id, peripheral)
      setList(Array.from(peripherals.values()))
    }

    const testPeripheral = (peripheral) => {
      if (peripheral){
        if (peripheral.connected){
          BleManager.disconnect(peripheral.id)
        }else{
          BleManager.connect(peripheral.id).then(() => {
            let p = peripherals.get(peripheral.id)
            if (p) {
              p.connected = true
              peripherals.set(peripheral.id, p)
              setList(Array.from(peripherals.values()))
            }
            console.log('Connected to ' + peripheral.id)
            setIsConnected(true)
            setConnectionStatus("Prisijungta")
            setTimeout(() => {
  
              /* Test read current RSSI value */
              BleManager.retrieveServices(peripheral.id).then((peripheralData) => {
                console.log('Retrieved peripheral services', peripheralData)
  
                BleManager.readRSSI(peripheral.id).then((rssi) => {
                  console.log('Retrieved actual RSSI value', rssi)
                  let p = peripherals.get(peripheral.id)
                  if (p) {
                    p.rssi = rssi
                    peripherals.set(peripheral.id, p)
                    setList(Array.from(peripherals.values()))
                  }                
                });                                          
              });
              BleManager.retrieveServices(peripheral.id).then((peripheralInfo) => {
                console.log(peripheralInfo)
                var service_uuid = '4fafc201-1fb5-459e-8fcc-c5c9c331914b'
                var characteristic_uuid = 'beb5483e-36e1-4688-b7f5-ea07361b26a8'
               
                const wifi = stringToBytes(SSID+";"+wifiPassword+";c5c9c331914b;c5c9c331914b;c5c9c331914b;c5c9c331914b")
                  setTimeout(() => {
                    BleManager.write(peripheral.id, service_uuid, characteristic_uuid, wifi).then(() => {
                    })}, 500)
                  })}, 900)
                }).catch((error) => {
                  console.log('Write error', error)
                })
        }
      }
    }

    useEffect(() => {
      BleManager.start({showAlert: false});
      bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral)
      bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral )
      bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic )
  
      if (Platform.OS === 'android' && Platform.Version >= 23) {
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
            if (result) {
              console.log("Permission is OK")
            } else {
              PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
                if (result) {
                  console.log("User accept")
                } else {
                  console.log("User refuse")
                }
              });
            }
        });
      }  

      return (() => {
         console.log('unmount')
         bleManagerEmitter.removeListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral)
         bleManagerEmitter.removeListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral )
         bleManagerEmitter.removeListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic )
       })
     }, []);

     const renderItem = (item) => {
      const color = item.connected ? 'green' : '#fff';
      return (
        <TouchableHighlight onPress={() => testPeripheral(item) }>
          <View style={[styles.row, {backgroundColor: color}]}>
            <Text style={{fontSize: 12, textAlign: 'center', color: '#333333', padding: 10}}>{item.name}</Text>
          </View>
        </TouchableHighlight>
      );
    }

const testWifiConnection = (ssid, password, isWep) => {
  WifiManager.connectToProtectedSSID(ssid, password, isWep).then(
    () => {
      setScanDisabled(false)
      setError("")
    },
    () => {
      setError("Nepavyko prisijungti.")
    }
  );
}

return (
   <>
     <StatusBar barStyle="dark-content" />
     <SafeAreaView>
       <ScrollView
         contentInsetAdjustmentBehavior="automatic"
         style={styles.scrollView}>
         <View style={styles.body}>
           <View style={{margin: 10}}>
           <Text style={{textAlign: 'left'}}>Wi-Fi SSID</Text>
              <TextInput 
                placeholder={'Wi-Fi SSID'} 
                onChangeText={text => {
                  setSSID(text)
                }}
                value={SSID}
              />
              <Text style={{textAlign: 'left'}}>Wi-Fi slaptažodis</Text>
              <TextInput 
                placeholder={'Wi-Fi slaptažodis'} 
                onChangeText={text => {
                  setWifiPassword(text)
                }}
                value={wifiPassword}
                secureTextEntry={true}
              />
              <Button 
               title={'Patikrinti Wi-Fi ryšį'}
               onPress={() => testWifiConnection(SSID, wifiPassword, false)} 
              />
              <Text style={{textAlign: 'center', color: 'red'}}>{error}</Text>
              <Button 
               title={'Skenuoti Bluetooth įrenginius'}
               onPress={() => startScan()}
               disabled={scanDisabled}
              />
           </View>
           {(list.length == 0) &&
             <View style={{flex:1, margin: 20}}>
               <Text style={{textAlign: 'center'}}>Nėra įrenginių</Text>
             </View>
           }
           
          {(isConnected == true) &&
          <Text style={{textAlign: 'center'}}>Prisijungta</Text>
          }
         </View>   
         {(isConnected == false) &&
       <FlatList
           data={list}
           renderItem={({ item }) => renderItem(item) }
           keyExtractor={item => item.id}
         />
      }
      </ScrollView>
     </SafeAreaView>
   </>
 );
};

const styles = StyleSheet.create({
   scrollView: {
     backgroundColor: Colors.lighter,
   },
   engine: {
     position: 'absolute',
     right: 0,
   },
   body: {
     backgroundColor: Colors.white,
   },
   sectionContainer: {
     marginTop: 32,
     paddingHorizontal: 24,
   },
   sectionTitle: {
     fontSize: 24,
     fontWeight: '600',
     color: Colors.black,
   },
   sectionDescription: {
     marginTop: 8,
     fontSize: 18,
     fontWeight: '400',
     color: Colors.dark,
   },
   highlight: {
     fontWeight: '700',
   },
   footer: {
     color: Colors.dark,
     fontSize: 12,
     fontWeight: '600',
     padding: 4,
     paddingRight: 12,
     textAlign: 'right',
   },
 });

export default ConnectionScreen
