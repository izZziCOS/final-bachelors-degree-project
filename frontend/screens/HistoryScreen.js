import React, {useEffect, useState} from 'react'
import { View, Dimensions, Text, ScrollView} from 'react-native'
import AsyncStorage from '@react-native-community/async-storage'
import {useDataApi} from '../utils/Hooks'
import { ButtonGroup } from 'react-native-elements'
import moment from 'moment'
import { LineChart } from 'react-native-chart-kit'
import { Rect, Text as TextSVG, Svg } from "react-native-svg"

const HistoryScreen = props => {
  var _ = require('lodash')
  var lastDay =  moment().subtract(1,'day')
  var last7Day = moment().subtract(1,'week')
  var lastMonth = moment().subtract(1,'month')
  let [tooltipPos1, setTooltipPos1] = useState({ x: 0, y: 0, visible: false, value: 0 })
  let [tooltipPos2, setTooltipPos2] = useState({ x: 0, y: 0, visible: false, value: 0 })
  const [email, setEmail] = useState('loading')
  const [first, setFirst] = useState(true)
  const [history] = useDataApi(`/history`,[])
  const [timestamps, setTimestamps] = useState([])
  const [humidity, setHumidity] = useState([])
  const [temperature, setTemperature] = useState([])
  const [selectedIndexes, setSelectedIndexes] = useState()
  const Boiler = async () => {
    const userEmail = await AsyncStorage.getItem('email')
    setEmail(userEmail)
  }
 if (history.isLoading) {
}

// TODO: kad iskarto rodyti pirmos dienos grafika, jei nera data tai zinute kad nera duomenu

  useEffect(() => {
    if(history.data.length === undefined && first === true)
  {
    setSelectedIndexes(0)
    setFirst(false)
  }
  Boiler()
  }, [history])

  useEffect(() =>{
  if(history.data.length !== 0){
      if(selectedIndexes == 0)
      {
        var filteredObjects = _.filter(history.data.settings,     
          function(each){ 
            return moment(each.timestamp)
              .isBetween(lastDay, moment().add(3, 'hours'))
          })
          var temp = calculateAverageHour(filteredObjects)

         var sortedTemp = _.orderBy(temp, [field => field.date.toLowerCase()], ['asc']);
         setTimestamps(sortedTemp.map(({date}) => date))
         setHumidity(sortedTemp.map(({humidity}) => humidity))
         setTemperature(sortedTemp.map(({temperature}) => temperature))
      }
      if(selectedIndexes == 1)
      {
        const precision = 8 * 60 * 60 * 1000
        var filteredObjects = _.filter(history.data.settings,     
          function(each){ 
            return moment(each.timestamp)
              .isBetween(last7Day, moment().add(3, 'hours'))
          })

        var groupBy8Hours = _.groupBy(filteredObjects, item => {
          const floor = Math.floor(moment(item.timestamp).valueOf() / precision) * precision
          return moment(floor).format("YYYY-MM-DDTHH:mm:ss")
        })
          
        var temp = calculateAverageWeek(groupBy8Hours)
        var sortedTemp = _.orderBy(temp, [field => field.date.toLowerCase()], ['asc']);
         setTimestamps(sortedTemp.map(({date}) => date))
         setHumidity(sortedTemp.map(({humidity}) => humidity))
         setTemperature(sortedTemp.map(({temperature}) => temperature))
      }
      if(selectedIndexes == 2)
      {
        var filteredObjects = _.filter(history.data.settings,     
          function(each){ 
            return moment(each.timestamp)
              .isBetween(lastMonth, moment().add(3, 'hours'))
          })
          var temp = calculateAverageDay(filteredObjects)
          var sortedTemp = _.orderBy(temp, [field => field.date.toLowerCase()], ['asc']);
         setTimestamps(sortedTemp.map(({date}) => date))
         setHumidity(sortedTemp.map(({humidity}) => humidity))
         setTemperature(sortedTemp.map(({temperature}) => temperature))
      }
    }
  },[selectedIndexes])

  const calculateAverageHour = (data) => {
    var tmp ={}
    data.forEach(function(item){
      var obj =  tmp[item.timestamp.substring(11,13)] = tmp[item.timestamp.substring(11,13)] || {count:0, humidity: 0, temperature:0}
      obj.count ++
      obj.humidity += item.humidity
      obj.temperature += item.temperature
      })
      var res = Object.entries(tmp).map(function(entry){
          return { date: entry[0], humidity: entry[1].humidity/entry[1].count, temperature: entry[1].temperature/entry[1].count }
      })
      return res
  }

  const calculateAverageDay = (data) => {
    var tmp ={}
    data.forEach(function(item){
      var obj =  tmp[item.timestamp.substring(5,10)] = tmp[item.timestamp.substring(5,10)] || {count:0, humidity: 0, temperature:0}
      obj.count ++
      obj.humidity += item.humidity
      obj.temperature += item.temperature
      })
      var res = Object.entries(tmp).map(function(entry){
          return { date: entry[0], humidity: entry[1].humidity/entry[1].count, temperature: entry[1].temperature/entry[1].count }
      })
      return res
}

const calculateAverageWeek = (arr) => {
  var sumsH = 0, counts = 0, sumsT = 0, results = [], name
  for (var key in arr) {
    for(var i  in arr[key]){
      name = key;
      sumsH += arr[key][i].humidity
      sumsT += arr[key][i].temperature
      counts++
    }

    results.push({ date: name, humidity: sumsH / counts, temperature: sumsT / counts})
    sumsH = 0
    sumsT = 0
    counts = 0
  }
  return results
}
  
return (
  <View>
    <ScrollView>
    <ButtonGroup
      buttons={['1 diena', '1 savaitė', '1 mėnesis']}
      selectedIndex={selectedIndexes}
      onPress={(value) => {
        setSelectedIndexes(value)
      }}
      containerStyle={{ marginBottom: 20 }}
    />
    {timestamps.length > 0 && humidity.length > 0 && temperature.length > 0 &&
    <View>
    <Text style={{textAlign:'center'}}>Temperatūros istorija</Text>
      <LineChart
          data={{
              labels: timestamps,
              datasets: [
                  {
                      data: temperature
                  }
              ]
          }}
          width={Dimensions.get("window").width}
          height={470}
          yAxisSuffix="°C"
          yAxisInterval={1}
          chartConfig={{
              backgroundColor: "white",
              backgroundGradientFrom: "#fbfbfb",
              backgroundGradientTo: "#fbfbfb",
              decimalPlaces: 2, // optional, defaults to 2dp
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                  borderRadius: 0
              },
              propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#fbfbfb"
              }
          }}
          bezier
          style={{
              marginVertical: 8,
              borderRadius: 6
          }}
          verticalLabelRotation = {75}
          decorator={() => {
            return tooltipPos1.visible ? <View>
                <Svg>
                    <Rect x={tooltipPos1.x - 15} 
                        y={tooltipPos1.y + 10} 
                        width="60" 
                        height="30"
                        fill="black" />
                        <TextSVG
                            x={tooltipPos1.x + 15}
                            y={tooltipPos1.y + 30}
                            fill="white"
                            fontSize="16"
                            fontWeight="bold"
                            textAnchor="middle">
                            {tooltipPos1.value.toFixed(2)+"°C"}
                        </TextSVG>
                </Svg>
            </View> : null
        }}
        onDataPointClick={(data) => {

          let isSamePoint = (tooltipPos1.x === data.x 
                              && tooltipPos1.y === data.y)

          isSamePoint ? setTooltipPos1((previousState) => {
              return { 
                        ...previousState,
                        value: data.value,
                        visible: !previousState.visible
                     }
          })
              : 
          setTooltipPos1({ x: data.x, value: data.value, y: data.y, visible: true })

      }}
            />
    <Text style={{textAlign:'center'}}>Drėgmės istorija</Text>
      <LineChart
        data={{
            labels: timestamps,
            datasets: [
                {
                    data: humidity
                }
            ]
        }}
        width={Dimensions.get("window").width}
        height={470}
        yAxisSuffix="%"
        yAxisInterval={1}
        chartConfig={{
            backgroundColor: "white",
            backgroundGradientFrom: "#fbfbfb",
            backgroundGradientTo: "#fbfbfb",
            decimalPlaces: 2, // optional, defaults to 2dp
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
                borderRadius: 0
            },
            propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#fbfbfb"
            }
        }}
        bezier
        style={{
            marginVertical: 8,
            borderRadius: 6
        }}
        verticalLabelRotation = {75}
        decorator={() => {
          return tooltipPos2.visible ? <View>
              <Svg>
                  <Rect x={tooltipPos2.x - 15} 
                      y={tooltipPos2.y + 10} 
                      width="55" 
                      height="30"
                      fill="black" />
                      <TextSVG
                          x={tooltipPos2.x + 13}
                          y={tooltipPos2.y + 30}
                          fill="white"
                          fontSize="16"
                          fontWeight="bold"
                          textAnchor="middle">
                          {tooltipPos2.value.toFixed(2)+"%"}
                      </TextSVG>
              </Svg>
          </View> : null
      }}
      onDataPointClick={(data) => {

        let isSamePoint = (tooltipPos2.x === data.x 
                            && tooltipPos2.y === data.y)

        isSamePoint ? setTooltipPos2((previousState) => {
            return { 
                      ...previousState,
                      value: data.value,
                      visible: !previousState.visible
                   }
        })
            : 
        setTooltipPos2({ x: data.x, value: data.value, y: data.y, visible: true })

    }}
      />
    </View>
    }
    </ScrollView>
  </View>
  )
}

export default HistoryScreen
