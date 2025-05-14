package db

// SensorHistory struct
type Settings struct {
	ID                int     `json:"id"`
	Device            string  `json:"device"`
	Fan               bool    `json:"fan"`
	Light             bool    `json:"light"`
	LightFrom         string  `json:"lightFrom"`
	LightTo           string  `json:"lightTo"`
	TemperatureFrom   float32 `json:"temperatureFrom"`
	TemperatureTo     float32 `json:"temperatureTo"`
	HumidityTo        float32 `json:"humidityTo"`
	HumidityFrom      float32 `json:"humidityFrom"`
	SoilHumidity1From float32 `json:"soilHumidity1From"`
	SoilHumidity2From float32 `json:"soilHumidity2From"`
	OwnSettings       bool    `json:"ownSettings"`
	Houseplant1       string  `json:"houseplant1"`
	Houseplant2       string  `json:"houseplant2"`
}

// SettingsToSend struct used for websocket message
type SettingsToSend struct {
	Fan               bool   `json:"fan"`
	Light             bool   `json:"light"`
	LightFrom         string `json:"lightFrom"`
	LightTo           string `json:"lightTo"`
	SoilHumidity1From string `json:"soilHumidity1From"`
	SoilHumidity2From string `json:"soilHumidity2From"`
}

// History struct
type History struct {
	ID            int     `json:"id"`
	DeviceName    string  `json:"deviceName"`
	Humidity      float32 `json:"humidity"`
	Temperature   float32 `json:"temperature"`
	SoilHumidity1 float32 `json:"soilHumidity1"`
	SoilHumidity2 float32 `json:"soilHumidity2"`
	Timestamp     string  `json:"timestamp"`
}

// Houseplant struct
type Houseplant struct {
	ID               int     `json:"id"`
	Name             string  `json:"name"`
	HumidityFrom     float32 `json:"humidityFrom"`
	HumidityTo       float32 `json:"humidityTo"`
	TemperatureFrom  float32 `json:"temperatureFrom"`
	TemperatureTo    float32 `json:"temperatureTo"`
	SoilHumidityFrom float32 `json:"soilHumidityFrom"`
}
