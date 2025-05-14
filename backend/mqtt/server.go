package mqttServer

import (
	"database/sql"
	"encoding/json"
	"fmt"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

var Message []byte
var MqttClient mqtt.Client
var CurrentValue SensorValues
var Settings UserData

var Broadcast = make(chan *SensorValues)

const (
	host     = "localhost"
	port     = 5432
	user     = "postgres"
	password = "password"
	dbname   = "siltnamis"
)

func WsWriter(value *SensorValues) {
	Broadcast <- value
}

// SensorValues struct - stores all sensor values
type SensorValues struct {
	Humidity      float64 `json:"humidity"`
	Temperature   float64 `json:"temperature"`
	SoilHumidity1 float64 `json:"soilHumidity1"`
	SoilHumidity2 float64 `json:"soilHumidity2"`
}

// UserData struct - stores all data about greenhouse
type UserData struct {
	ID                int     `json:"id"`
	Device            string  `json:"device"`
	Fan               bool    `json:"fan"`
	Light             bool    `json:"light"`
	LightFrom         string  `json:"lightFrom"`
	LightTo           string  `json:"lightTo"`
	TemperatureFrom   float64 `json:"temperatureFrom"`
	TemperatureTo     float64 `json:"temperatureTo"`
	HumidityTo        float64 `json:"humidityTo"`
	HumidityFrom      float64 `json:"humidityFrom"`
	SoilHumidity1From float64 `json:"soilHumidity1From"`
	SoilHumidity2From float64 `json:"soilHumidity2From"`
	OwnSettings       bool    `json:"ownSettings"`
	Houseplant1       string  `json:"houseplant1"`
	Houseplant2       string  `json:"houseplant2"`
}

// MqttServer initializes connection and subscribes to mqtt broker
func MqttServer() {
	var broker = "192.168.1.81"
	var port = 1883
	opts := mqtt.NewClientOptions()
	opts.AddBroker(fmt.Sprintf("tcp://%s:%d", broker, port))
	opts.SetClientID("go_mqtt_client")

	opts.SetDefaultPublishHandler(messagePubHandler)
	opts.OnConnect = connectHandler
	opts.OnConnectionLost = connectLostHandler
	MqttClient = mqtt.NewClient(opts)
	if token := MqttClient.Connect(); token.Wait() && token.Error() != nil {
		fmt.Println(token.Error())
	}

	sub(MqttClient, "x@gmail.com/test")
	sub(MqttClient, "x@gmail.com/login")
}

// messagePubHandler handles received messages
var messagePubHandler mqtt.MessageHandler = func(client mqtt.Client, msg mqtt.Message) {
	fmt.Printf("Received message: %s from topic: %s\n", msg.Payload(), msg.Topic())
	if msg.Topic() == "x@gmail.com/test" {
		Message = msg.Payload()

		if err := json.Unmarshal(msg.Payload(), &CurrentValue); err != nil {
			fmt.Println(err)
		}
		//Upload data to postgreSQL
		History(CurrentValue)
		go WsWriter(&CurrentValue)
		GetUserData()
		CallMessage(CurrentValue)

	}
}

// CallMessage calls notification class to send a message
func CallMessage(currentValue SensorValues) {
	temperature := "Oro temperatūra neatitinka šiltnamio nustatymų = " + fmt.Sprint(currentValue.Temperature) + "°C, turėtu būti " + fmt.Sprint(Settings.TemperatureFrom) + "-" + fmt.Sprint(Settings.TemperatureTo) + "°C ribose"
	humidity := "Oro drėgmė neatitinka šiltnamio nustatymų = " + fmt.Sprint(currentValue.Humidity) + "%, turėtu būti " + fmt.Sprint(Settings.HumidityFrom) + "-" + fmt.Sprint(Settings.HumidityTo) + "% ribose"
	both := "Oro drėgmė ir temperatūra neatitinka šiltnamio nustatymų = " + fmt.Sprint(currentValue.Humidity) + "% ir " + fmt.Sprint(currentValue.Temperature) +
		"°C, turėtu būti" + fmt.Sprint(Settings.HumidityFrom) + "-" + fmt.Sprint(Settings.HumidityTo) + "% ir" + fmt.Sprint(Settings.TemperatureFrom) + "-" + fmt.Sprint(Settings.TemperatureTo) + "°C ribose"
	switch {
	case Settings.TemperatureFrom > currentValue.Temperature || Settings.TemperatureTo < currentValue.Temperature:
		SendMessage("test", "test1", temperature)
	case Settings.HumidityFrom > currentValue.Humidity || Settings.HumidityTo < currentValue.Humidity:
		SendMessage("test", "test1", humidity)
	case (Settings.TemperatureFrom > currentValue.Temperature || Settings.TemperatureTo < currentValue.Temperature) && (Settings.HumidityFrom > currentValue.Humidity || Settings.HumidityTo < currentValue.Humidity):
		SendMessage("test", "test1", both)
	default:
		fmt.Println("Šiltnamio oro būklė ribose")
	}
}

// connectHandler notifies if connection obtained
var connectHandler mqtt.OnConnectHandler = func(client mqtt.Client) {
	fmt.Println("Connected")
}

// connectLostHandler notifies if connection is lost
var connectLostHandler mqtt.ConnectionLostHandler = func(client mqtt.Client, err error) {
	fmt.Printf("Connect lost: %v", err)
}

// sub Subscribe to mqtt topic
func sub(client mqtt.Client, topic string) {
	token := client.Subscribe(topic, 1, nil)
	token.Wait()
	fmt.Println("Subscribed to topic: %s", topic)
}

// History post history values into DB
func History(values SensorValues) {
	psqlconn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable", host, port, user, password, dbname)

	db, err := sql.Open("postgres", psqlconn)
	if err != nil {
		fmt.Println(err)
	}

	defer db.Close()

	_, err = db.Exec(`INSERT INTO history(id, "deviceName", humidity, temperature, "soilHumidity1", "soilHumidity2") VALUES (DEFAULT, $1 , $2, $3 , $4 , $5)`, "device01", values.Humidity, values.Temperature, values.SoilHumidity1, values.SoilHumidity2)
	if err != nil {
		fmt.Println("Error in creating history", err)
	}
}

// GetUserData gets data for comparison, if the current sensor results matching.
func GetUserData() {
	psqlconn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable", host, port, user, password, dbname)

	db, err := sql.Open("postgres", psqlconn)

	if err != nil {
		fmt.Println(err)
	}

	defer db.Close()
	err = db.QueryRow(`SELECT * FROM settings WHERE id = 1`).Scan(&Settings.ID, &Settings.Device, &Settings.Fan, &Settings.Light, &Settings.LightFrom, &Settings.LightTo,
		&Settings.HumidityFrom, &Settings.HumidityTo, &Settings.TemperatureFrom, &Settings.TemperatureTo, &Settings.SoilHumidity1From,
		&Settings.SoilHumidity2From, &Settings.OwnSettings, &Settings.Houseplant1, &Settings.Houseplant2)
	if err != nil {
		fmt.Println(err.Error())
	}
}
