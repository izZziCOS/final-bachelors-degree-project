import React, {useEffect, useState} from 'react'
import {
  StyleSheet,
  View,
  Text,
  Picker,
  ScrollView,
} from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import {useDataApi} from '../utils/Hooks'
import backend from '../apis/index'
import DateTimePicker from '@react-native-community/datetimepicker'
import {
  Paragraph,
  Switch,
  Colors,
  TouchableRipple,
  Button,
  useTheme,
  Divider,
  TextInput,
} from 'react-native-paper'
import { Formik } from 'formik'
import * as yup from 'yup'

const validationSchema = yup.object().shape({
  reminderHumidityFrom: yup
    .number().typeError("Privalo būti skaičius")
    .integer("Turi būti natūralusis skaičius")
    .min(0, "Negali būti mažiau nei 0")
    .max(100, "Negali būti daugiau nei 100")
    .positive("Turi būti teigiamas skaičius")
    .min(0, ({ min }) => `Turi būti bent ${min} simbolio ilgio`)
    .required('Privalomas laukas'),
  reminderHumidityTo: yup
    .number().typeError("Privalo būti skaičius")
    .integer("Turi būti natūralusis skaičius")
    .min(0, "Negali būti mažiau nei 0")
    .max(100, "Negali būti daugiau nei 100")
    .positive("Turi būti teigiamas skaičius")
    .min(0, ({ min }) => `Turi būti bent ${min} simbolio ilgio`)
    .required('Privalomas laukas'),
  reminderTemperatureFrom: yup
    .number().typeError("Privalo būti skaičius")
    .integer("Turi būti natūralusis skaičius")
    .min(0, "Negali būti mažiau nei 0")
    .max(100, "Negali būti daugiau nei 100")
    .positive("Turi būti teigiamas skaičius")
    .min(0, ({ min }) => `Turi būti bent ${min} simbolio ilgio`)
    .required('Privalomas laukas'),
  reminderTemperatureTo: yup
    .number().typeError("Privalo būti skaičius")
    .integer("Turi būti natūralusis skaičius")
    .min(0, "Negali būti mažiau nei 0")
    .max(100, "Negali būti daugiau nei 100")
    .positive("Turi būti teigiamas skaičius")
    .min(0, ({ min }) => `Turi būti bent ${min} simbolio ilgio`)
    .required('Privalomas laukas'),
  soilHumidity1From: yup
    .number().typeError("Privalo būti skaičius")
    .integer("Turi būti natūralusis skaičius")
    .min(0, "Negali būti mažiau nei 0")
    .max(100, "Negali būti daugiau nei 100")
    .positive("Turi būti teigiamas skaičius")
    .min(0, ({ min }) => `Turi būti bent ${min} simbolio ilgio`)
    .required('Privalomas laukas'),
  soilHumidity2From: yup
    .number().typeError("Privalo būti skaičius")
    .integer("Turi būti natūralusis skaičius")
    .min(0, "Negali būti mažiau nei 0")
    .max(100, "Negali būti daugiau nei 100")
    .positive("Turi būti teigiamas skaičius")
    .min(0, ({ min }) => `Turi būti bent ${min} simbolio ilgio`)
    .required('Privalomas laukas'),
})

const SettingsScreen = props => {
  const [email, setEmail] = useState('loading')
  const [light, setLight] = useState(true)
  const [fan, setFan] = useState(true)
  const [reminderHumidityFrom, setReminderHumidityFrom] = useState()
  const [reminderHumidityTo, setReminderHumidityTo] = useState()
  const [reminderTemperatureFrom, setReminderTemperatureFrom] = useState()
  const [reminderTemperatureTo, setReminderTemperatureTo] = useState()
  const [soilHumidity1From, setSoilHumidity1From] = useState()
  const [soilHumidity2From, setSoilHumidity2From] = useState()
  const [houseplant1, setHouseplant1] = useState()
  const [houseplant2, setHouseplant2] = useState()
  const [firstPlantSelected, setFirstPlantSelected] = useState()
  const [ownSettings, setOwnSettings] = useState()
  const [first, setFirst] = useState(true)
  const [first1, setFirst1] = useState(true)
  const [settings] = useDataApi(`/settings`,[])
  const [houseplants] = useDataApi(`/houseplants`,[])
  const [houseplantsFiltered, setHouseplantsFiltered] = useState([])
  // time
  const [showTo, setShowTo] = useState(false)
  const [showFrom, setShowFrom] = useState(false)
  const [lightsFrom, setLightsFrom] = useState()
  const [lightsTo, setLightsTo] = useState()

  const {
    colors: { background },
  } = useTheme()

  const onChangeFrom = (event, selectedDate) => {
    const currentDate = selectedDate || convertStringToDate(lightsFrom);
    setShowFrom(Platform.OS === 'ios');
    setLightsFrom(currentDate.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'}).substring(0,5).toString())
  };

  const onChangeTo = (event, selectedDate) => {
    const currentDate = selectedDate || convertStringToDate(lightsTo);
    setShowTo(Platform.OS === 'ios');
    setLightsTo(currentDate.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'}).substring(0,5).toString());
  };

  const showModeFrom = () => {
    setShowFrom(true);
  };

  const showModeTo = () => {
    setShowTo(true);
  };

  const convertStringToDate = (time) =>{
    let d = new Date(); // Creates a Date Object using the clients current time
    let [hours, minutes] = time.split(':');
    d.setHours(+hours); // Set the hours, using implicit type coercion
    d.setMinutes(minutes); // can pass Number or String - doesn't really matter
    return d
  }

  const Boiler = async () => {
    const userEmail = await AsyncStorage.getItem('email')
    setEmail(userEmail)
  };

  const logout = props => {
    AsyncStorage.removeItem('token').then(() => {
      props.navigation.replace('login')
    })
  }

  //test
  if (settings.isLoading || houseplants.isLoading) {
    
  }

  useEffect(() => {
     if(settings.data.length === undefined && first === true)
    {
      setLightsFrom(settings.data.settings[0].lightFrom.slice(11, 16))
      setLightsTo(settings.data.settings[0].lightTo.slice(11, 16))
      setLight(settings.data.settings[0].light)
      setFan(settings.data.settings[0].fan)
      setReminderHumidityFrom(String(settings.data.settings[0].humidityFrom))
      setReminderHumidityTo(String(settings.data.settings[0].humidityTo))
      setReminderTemperatureFrom(String(settings.data.settings[0].temperatureFrom))
      setReminderTemperatureTo(String(settings.data.settings[0].temperatureTo))
      setSoilHumidity1From(String(settings.data.settings[0].soilHumidity1From))
      setSoilHumidity2From(String(settings.data.settings[0].soilHumidity2From))
      setOwnSettings(settings.data.settings[0].ownSettings)
      setHouseplant1(settings.data.settings[0].houseplant1)
      setHouseplant2(settings.data.settings[0].houseplant2)
      setFirst(false)
    }
    Boiler()
  }, [settings])

const submitSettings = (values) =>{
      backend
        .put(`/settings`, {
          fan: fan,
          light: light,
          lightFrom: lightsFrom,
          lightTo: lightsTo,
          humidityFrom: parseFloat(values.reminderHumidityFrom),
          humidityTo: parseFloat(values.reminderHumidityTo),
          temperatureFrom: parseFloat(values.reminderTemperatureFrom),
          temperatureTo: parseFloat(values.reminderTemperatureTo),
          soilHumidity1From: parseFloat(values.soilHumidity1From),
          soilHumidity2From: parseFloat(values.soilHumidity2From),
          ownSettings: ownSettings,
          houseplant1: houseplant1,
          houseplant2: houseplant2
        })
        .then((response) => {
          if (!response.data) {
            console.log('No response')
          }
          console.log(response.data)
        })
        .catch(() => {})
        props.navigation.goBack();
}

const filterAndSet = (value) =>{
  setFirstPlantSelected(true)
  setHouseplant1(value)
  
  var selectedPlant = houseplants.data.data.filter(houseplant => houseplant.name == value)
  var filteredHouseplants = houseplants.data.data.filter(houseplant => 
    houseplant.humidityFrom >= selectedPlant[0].humidityFrom &&
    houseplant.humidityTo <= selectedPlant[0].humidityTo &&
    houseplant.temperatureFrom >= selectedPlant[0].temperatureFrom &&
    houseplant.temperatureTo <= selectedPlant[0].temperatureTo
  )
  setHouseplantsFiltered(filteredHouseplants)
  setSoilHumidity1From(String(selectedPlant[0].soilHumidityFrom))
}

useEffect(() => {
  if(houseplants.data.length === undefined && first1 === true && houseplant1 !== undefined)
    {
  var selectedPlant = houseplants.data.data.filter(houseplant => houseplant.name == houseplant1)
  var filteredHouseplants = houseplants.data.data.filter(houseplant => 
    houseplant.humidityFrom >= selectedPlant[0].humidityFrom &&
    houseplant.humidityTo <= selectedPlant[0].humidityTo &&
    houseplant.temperatureFrom >= selectedPlant[0].temperatureFrom &&
    houseplant.temperatureTo <= selectedPlant[0].temperatureTo
  )
  setHouseplantsFiltered(filteredHouseplants)
  setFirst1(false)
  }
}, [houseplants])

const secondPlantSelection = (value) =>{
  setHouseplant2(value)
  var selectedPlant = houseplants.data.data.filter(houseplant => houseplant.name == value)

  setReminderHumidityFrom(String(selectedPlant[0].humidityFrom))
  setReminderHumidityTo(String(selectedPlant[0].humidityTo))
  setReminderTemperatureFrom(String(selectedPlant[0].temperatureFrom))
  setReminderTemperatureTo(String(selectedPlant[0].temperatureTo))
  setSoilHumidity2From(String(selectedPlant[0].soilHumidityFrom))
}

  return (
    <>
     <View style={styles.body}>
      <ScrollView>
        <Button style={{margin: 10}} color={Colors.blue500} mode="contained" onPress={() => props.navigation.push('connection')}> Prijungti šiltnamį </Button>
        <Text style={styles.sectionTitle}>Šiltnamio nustatymai</Text>
        <TouchableRipple onPress={() => setFan(!fan)}>
        <View style={styles.row}>
          <Paragraph>Ventiliacija</Paragraph>
          <View pointerEvents="none">
            <Switch value={fan} color={Colors.blue500}/>
          </View>
        </View>
      </TouchableRipple>
      <Divider/>
      <TouchableRipple onPress={() => setLight(!light)}>
        <View style={styles.row}>
          <Paragraph>Apšvietimas</Paragraph>
          <View pointerEvents="none">
            <Switch value={light} color={Colors.blue500}/>
          </View>
        </View>
      </TouchableRipple>
      <Divider/>
      <View style={styles.row}>
        <Paragraph>Apšvietimas įsijungia {lightsFrom}</Paragraph>
        <Button mode="outlined" onPress={() => showModeFrom()} style={styles.button} color={Colors.blue500}> Keisti </Button>
      </View>
      <Divider/>
          {showFrom && (
        <DateTimePicker
          testID="dateTimePicker"
          value={convertStringToDate(lightsFrom)}
          mode="time"
          is24Hour={true}
          display="clock"
          onChange={onChangeFrom}
        />
      )}
      <View style={styles.row}>
        <Paragraph>Apšvietimas išsijungia {lightsTo}</Paragraph>
        <Button mode="outlined" onPress={() => showModeTo()} style={styles.button} color={Colors.blue500}> Keisti </Button>
      </View>
      <Divider/>
          {showTo && (
        <DateTimePicker
          testID="dateTimePicker"
          value={convertStringToDate(lightsTo)}
          mode="time"
          is24Hour={true}
          display="clock"
          onChange={onChangeTo}
        />
      )}
      <TouchableRipple onPress={() => setOwnSettings(!ownSettings)}>
        <View style={styles.row}>
          <Paragraph>Naudoti savo augalų nustatymus?</Paragraph>
          <View pointerEvents="none">
            <Switch value={ownSettings} color={Colors.blue500}/>
          </View>
        </View>
      </TouchableRipple>
      <Divider/>
        {ownSettings &&
        <Formik
        validateOnMount={true}
        validationSchema={validationSchema}
        initialValues={{ reminderHumidityFrom: reminderHumidityFrom, 
                         reminderHumidityTo: reminderHumidityTo,
                         reminderTemperatureFrom: reminderTemperatureFrom, 
                         reminderTemperatureTo: reminderTemperatureTo,
                         soilHumidity1From: soilHumidity1From, 
                         soilHumidity2From: soilHumidity2From,
                         }}
        onSubmit={values => submitSettings(values)}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          isValid,
        }) => (
        <View>
          <View style={styles.row}>
            <Paragraph>Oro dregmė (%) nuo</Paragraph>
              <TextInput
                name="reminderHumidityFrom"
                color={Colors.blue500}
                style={{ backgroundColor: 'transparent' }}
                dense
                value={values.reminderHumidityFrom}
                onChangeText={handleChange('reminderHumidityFrom')}
                onBlur={handleBlur('reminderHumidityFrom')}
              />
          </View>
          {(errors.reminderHumidityFrom && touched.reminderHumidityFrom) &&
                  <Text style={{fontSize:14,marginLeft:18,color:"red"}}>{errors.reminderHumidityFrom}</Text>}
          <Divider/>
          <View style={styles.row}>
            <Paragraph>Oro dregmė (%) iki</Paragraph>
              <TextInput
                name="reminderHumidityTo"
                color={Colors.blue500}
                style={{ backgroundColor: 'transparent' }}
                dense
                value={values.reminderHumidityTo}
                onChangeText={handleChange('reminderHumidityTo')}
                onBlur={handleBlur('reminderHumidityTo')}
              />
          </View>
          {(errors.reminderHumidityTo && touched.reminderHumidityTo) &&
                  <Text style={{fontSize:14,marginLeft:18,color:"red"}}>{errors.reminderHumidityTo}</Text>}
          <Divider/>
          <View style={styles.row}>
            <Paragraph>Temperatūra (°C) nuo</Paragraph>
              <TextInput
                name="reminderTemperatureFrom"
                color={Colors.blue500}
                style={{ backgroundColor: 'transparent' }}
                dense
                value={values.reminderTemperatureFrom}
                onChangeText={handleChange('reminderTemperatureFrom')}
                onBlur={handleBlur('reminderTemperatureFrom')}
                color={Colors.blue500}
                style={{ backgroundColor: 'transparent' }}
              />
          </View>
          {(errors.reminderTemperatureFrom && touched.reminderTemperatureFrom) &&
                  <Text style={{fontSize:14,marginLeft:18,color:"red"}}>{errors.reminderTemperatureFrom}</Text>}
          <Divider/>
          <View style={styles.row}>
            <Paragraph>Temperatūra (°C) iki</Paragraph>
              <TextInput
                  name="reminderTemperatureTo"
                  color={Colors.blue500}
                  style={{ backgroundColor: 'transparent' }}
                  dense
                  value={values.reminderTemperatureTo}
                  onChangeText={handleChange('reminderTemperatureTo')}
                  onBlur={handleBlur('reminderTemperatureTo')}
                  color={Colors.blue500}
                  style={{ backgroundColor: 'transparent' }}
                />
          </View>
          {(errors.reminderTemperatureTo && touched.reminderTemperatureTo) &&
                  <Text style={{fontSize:14,marginLeft:18,color:"red"}}>{errors.reminderTemperatureTo}</Text>}
          <Divider/>
          <View style={styles.row}>
            <Paragraph>Laistymas (1 augalas) 0-100%</Paragraph>
              <TextInput
                  name="soilHumidity1From"
                  color={Colors.blue500}
                  style={{ backgroundColor: 'transparent' }}
                  dense
                  value={values.soilHumidity1From}
                  onChangeText={handleChange('soilHumidity1From')}
                  onBlur={handleBlur('soilHumidity1From')}
                  color={Colors.blue500}
                  style={{ backgroundColor: 'transparent' }}
                />
          </View>
          {(errors.soilHumidity1From && touched.soilHumidity1From) &&
                  <Text style={{fontSize:14,marginLeft:18,color:"red"}}>{errors.soilHumidity1From}</Text>}
          <Divider/>
          <View style={styles.row}>
            <Paragraph>Laistymas (2 augalas) 0-100%</Paragraph>
              <TextInput
                    name="soilHumidity2From"
                    color={Colors.blue500}
                    style={{ backgroundColor: 'transparent' }}
                    dense
                    value={values.soilHumidity2From}
                    onChangeText={handleChange('soilHumidity2From')}
                    onBlur={handleBlur('soilHumidity2From')}
                    color={Colors.blue500}
                    style={{ backgroundColor: 'transparent' }}
                  />
          </View>
          {(errors.soilHumidity2From && touched.soilHumidity2From) &&
                  <Text style={{fontSize:14,marginLeft:18,color:"red"}}>{errors.soilHumidity2From}</Text>}
          <Divider/>
          <View style={styles.footer}>
            <Button style={{margin: 10}} 
                    color={Colors.green500} mode="contained" 
                    onPress={() => handleSubmit()} 
                    disabled={!isValid}> Išsaugoti 
            </Button>
            <Button style={{margin: 10}} color={Colors.blue500} mode="contained" onPress={() => logout(props)}> Atsijungti </Button>
        </View>
        </View>
        
        )}
        </Formik>
      }{ownSettings === false &&
        <View>
        <View style={styles.twoLinesView}>
        <Paragraph style={styles.inputText}>1 augalas</Paragraph>
          <Picker
            selectedValue={houseplant1}
            style={{flex: 2, padding: 15}}
            onValueChange={(itemValue, itemIndex) => filterAndSet(itemValue)}
          >
            {houseplants.data.length === undefined && houseplants.data.data.map((houseplant) => <Picker.Item label={houseplant.name} value={houseplant.name} />)}
          </Picker>
        </View>
        <Divider/>
        <View style={styles.twoLinesView}>
          <Text style={styles.inputText}>{'2 augalas:'}</Text>
          <Picker
            selectedValue={houseplant2}
            style={{flex: 2, padding: 15}}
            onValueChange={(itemValue, itemIndex) => secondPlantSelection(itemValue)}
            enabled={firstPlantSelected}
          >
            {houseplantsFiltered.length !== undefined && houseplantsFiltered.map((houseplant) => <Picker.Item label={houseplant.name} value={houseplant.name} />)}
          </Picker>
        </View>
        <Divider/>
        <View style={styles.footer}>
          <Button style={{margin: 10}} color={Colors.green500} mode="contained" onPress={() => submitSettings()}> Išsaugoti </Button>
          <Button style={{margin: 10}} color={Colors.blue500} mode="contained" onPress={() => logout(props)}> Atsijungti </Button>
        </View>
        </View>
        
        }
      </ScrollView>
        {/* <View style={styles.footer}>
          <Button style={{margin: 10}} color={Colors.green500} mode="contained" onPress={() => submitSettings()}> Išsaugoti </Button>
          <Button style={{margin: 10}} color={Colors.blue500} mode="contained" onPress={() => logout(props)}> Atsijungti </Button>
        </View> */}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  body: {
    backgroundColor: Colors.white,
    flex: 1
  },
  twoLinesView:{
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    alignContent: 'center',
    flexDirection: 'row',
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 5,
  },
  inputText:{
    textAlign: 'left', 
    paddingLeft: 15,
    flex: 1,
  },
  footer: {
    position: 'relative', 
    left: 0, 
    right: 0, 
    bottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
})

export default SettingsScreen
