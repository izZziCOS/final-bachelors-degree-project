#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"
#include <LiquidCrystal_I2C.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <Adafruit_NeoPixel.h>
#include <ArduinoJson.h>
#include "time.h"
#include <Preferences.h>

//preferences
Preferences preferences;
//led strip
#define PIN        2
#define NUMPIXELS 12
Adafruit_NeoPixel pixels(NUMPIXELS, PIN, NEO_GRB + NEO_KHZ800);
//bluetooth
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
//dht
#define DHTPIN 15
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);
//soil moisture
#define SOIL1 34
#define SOIL2 35
const int AirValue = 3480;
const int WaterValue = 1700; //original water value is 1500
int soilMoisturePercentage1 = 0;
int soilMoistureValue1 = 0;
int soilMoisturePercentage2 = 0;
int soilMoistureValue2 = 0;
//water pumps
const int WATER1 = 32;
const int WATER2 = 33;
char moisture1[4] = {'0'};
char moisture2[4] = {'0'};
//lcd
LiquidCrystal_I2C lcd(0x27, 16, 2);
//greenhouse status
float temperature = 0;
float humidity = 0;
float soilHumidity1 = 0;
float soilHumidity2 = 0;
char temp[16];
char hum[16];
String BLEReading;
unsigned long previousMillis = 0;  // Stores last time data was published
const long interval = 60000;       // Interval at which to publish sensor readings DOWNGRADED FOR TESTING to 60000
//wifi
const char* ssid;
const char* currentSSID;
const char* password;
String internetoPrieiga;
String internetoSlaptazodis;
WiFiClient espClient;
//mqtt
const char* mqttServer = "192.168.1.81";
const int mqttPort = 1883;
PubSubClient client(espClient);
//time
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 7200;
const int daylightOffset_sec = 3600;
String currentTime;
char lightFrom1[6] = {'0'};
char lightTo1[6] = {'0'};
char timeHour[6];
//fan and light
bool fanValue;
bool lightValue;

// TODO save new settings from pubsub

class MyCallbacks: public BLECharacteristicCallbacks {
    int counter = 0;
    void onWrite(BLECharacteristic *pCharacteristic) {

      std::string value = pCharacteristic->getValue();
      String storedVal;
      if (value.length() > 0) {
        for (int i = 0; i < value.length(); i++) {
          storedVal = storedVal + value[i];
        }
        counter = counter + value.length();
      }
      if (value.length() < 20 || (counter > 52 && counter < 60))
      {
        int i;
        char delimiter[] = ";";
        char *p;
        char string[128];
        String words[3];

        BLEReading.toCharArray(string, sizeof(string));
        i = 0;
        p = strtok(string, delimiter);
        while (p && i < 3)
        {
          words[i] = p;
          p = strtok(NULL, delimiter);
          ++i;
        }
        internetoPrieiga = words[0];
        internetoSlaptazodis = words[1];
        Serial.print("Interneto prieigos pavadinimas ");
        Serial.println(internetoPrieiga);
        preferences.putString("ssid", internetoPrieiga);
        Serial.print("Interneto prieigos slaptazodis ");
        Serial.println(internetoSlaptazodis);
        preferences.putString("password", internetoSlaptazodis);
        
        ssid="changed";
        BLEReading = "";
        counter = 0;
      }
      BLEReading = BLEReading + storedVal;
    }
};

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
   String topicStr = topic; 
  String recv_payload = String(( char *) payload);
  if(topicStr=="x@gmail.com/settings"){
    StaticJsonDocument<600> doc;
    DeserializationError error = deserializeJson(doc, recv_payload);
      if (error) {
      Serial.print(F("deserializeJson() failed: "));
      Serial.println(error.f_str());
      return;
    }
    //assign light times
    const char* lightFrom = doc["lightFrom"];
    const char* lightTo = doc["lightTo"];
    strcpy(lightFrom1,lightFrom);
    strcpy(lightTo1,lightTo);
    preferences.putString("lightFrom1", String(lightFrom));
    preferences.putString("lightTo1", String(lightTo));
    //assign watering values
    const char* soilHumidity1From = doc["soilHumidity1From"];
    strcpy(moisture1,soilHumidity1From);
    preferences.putString("moisture1", String(soilHumidity1From));
    const char* soilHumidity2From = doc["soilHumidity2From"];
    strcpy(moisture2,soilHumidity2From);
    preferences.putString("moisture2", String(soilHumidity2From));
    ////////////////////////////////
    //fan
    if(doc["fan"] == 0){
      digitalWrite(17, LOW);
      preferences.putBool("fan", false);
    }
    else{
      digitalWrite(17, HIGH);
      preferences.putBool("fan", true);
    }
    //light
    if(doc["light"] == 0){
      pixels.clear();
      pixels.show();
      preferences.putBool("light", false);
    }
    else{
      ledStrip();
      preferences.putBool("light", true);
    }
  }
  Serial.println();
}

void setup() {
  initialSetup();
  initialBluetooth();
  connectToWifi();
  connectandSubMQTT();
  readDHTandPrint();
}

void loop() {
  client.loop();
  greenhouseStatus();
  setLocalTime();
  checkLights();
  checkWifiName();
}

void checkWifiName(){
  currentSSID = internetoPrieiga.c_str();
  if(ssid != currentSSID){
    Serial.println(currentSSID);
    Serial.println(ssid);
    WiFi.disconnect();
    connectToWifi();
    connectandSubMQTT();
  }
}

void greenhouseStatus(){
  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    soilMoisture();
    readDHTandPrint();
    // Save the last time a new reading was published
    previousMillis = currentMillis;
    String payload="{\"humidity\":"+String(humidity)+ ",\"temperature\":"+String(temperature)+ ",\"soilHumidity1\":"+String(soilMoisturePercentage1)+ ",\"soilHumidity2\":"+String(soilMoisturePercentage2)+"} ";
    if (client.publish("x@gmail.com/test", payload.c_str()) == true) {
        Serial.println("Success sending message");
    } else {
        Serial.println("Error sending message");
    }
    if(atoi(moisture1) > soilMoisturePercentage1){
      water1Plant();
    }
    if(atoi(moisture2) > soilMoisturePercentage2){
      water2Plant();
    }
    printLightInfo();
  }
}


void soilMoisture(){
  soilMoistureValue1 = analogRead(SOIL1);
  soilMoistureValue2 = analogRead(SOIL2);
  soilMoisturePercentage1 = map(soilMoistureValue1, AirValue, WaterValue, 0, 100);
  soilMoisturePercentage2 = map(soilMoistureValue2, AirValue, WaterValue, 0, 100);
  
  if(soilMoisturePercentage1 < 0 ){
    soilMoisturePercentage1 = 0;
  }
  if(soilMoisturePercentage1 > 100 ){
    soilMoisturePercentage1 = 100;
  }
  if(soilMoisturePercentage2 < 0 ){
    soilMoisturePercentage2 = 0;
  }
  if(soilMoisturePercentage2 > 100 ){
    soilMoisturePercentage2 = 100;
  }
}

void readDHTandPrint(){
  humidity = dht.readHumidity();
  temperature = dht.readTemperature();
  lcd.setCursor(0, 0);
  sprintf(temp, "Temperature=%.2f", temperature);
  lcd.print(temp);
  lcd.setCursor(0, 1);
  sprintf(hum, "Humidity=%.2f", humidity);
  lcd.print(hum);
}

void ledStrip(){
  pixels.begin();
  pixels.setPixelColor(0, pixels.Color(255, 0, 0));
  pixels.setPixelColor(1, pixels.Color(255, 0, 0));
  pixels.setPixelColor(2, pixels.Color(0, 0, 255));
  pixels.setPixelColor(3, pixels.Color(255, 0, 0));
  pixels.setPixelColor(4, pixels.Color(255, 0, 0));
  pixels.setPixelColor(5, pixels.Color(0, 0, 255));
  pixels.setPixelColor(6, pixels.Color(255, 0, 0));
  pixels.setPixelColor(7, pixels.Color(255, 0, 0));
  pixels.setPixelColor(8, pixels.Color(0, 0, 255));
  pixels.setPixelColor(9, pixels.Color(255, 0, 0));
  pixels.setPixelColor(10, pixels.Color(255, 0, 0));
  pixels.setPixelColor(11, pixels.Color(0, 0, 255));
  pixels.show();
}

void setLocalTime(){
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    Serial.println("Failed to obtain time");
    return;
  }
  strftime(timeHour,6, "%H:%M", &timeinfo);
}

void checkLights(){
  if(strcmp(lightFrom1, timeHour) == 0){
    ledStrip();
  }
  if(strcmp(lightTo1, timeHour) == 0){
    pixels.clear();
    pixels.show();
  }
}

void printLightInfo(){
  Serial.println("Current time: ");
  Serial.println(timeHour);
  Serial.println("Light ON time");
  Serial.println(lightFrom1);
  Serial.println("Light OFF time");
  Serial.println(lightTo1);
}

void water1Plant(){
  Serial.println("Watering plant 1");
  digitalWrite(WATER1, HIGH); // turn on pump 1 seconds
  delay(500);
  digitalWrite(WATER1, LOW);  // turn off pump
}

void water2Plant(){
  Serial.println("Watering plant 2");
  digitalWrite(WATER2, HIGH); // turn on pump 1 seconds
  delay(500);
  digitalWrite(WATER2, LOW);  // turn off pump
}

void initialSetup(){
  preferences.begin("siltnamis", false); 
  dht.begin();
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  lcd.init();
  lcd.backlight();
  //initialize water pumps
  pinMode(WATER1, OUTPUT);
  pinMode(WATER2, OUTPUT);
  pinMode(17, OUTPUT);
  Serial.begin(115200);
  
  internetoPrieiga = preferences.getString("ssid", "");
  internetoSlaptazodis = preferences.getString("password", "");
  (preferences.getString("lightFrom1", "")).toCharArray(lightFrom1,6);
  (preferences.getString("lightTo1", "")).toCharArray(lightTo1,6);
  (preferences.getString("moisture1", "")).toCharArray(moisture1,4);
  (preferences.getString("moisture1", "")).toCharArray(moisture2,4);
  fanValue = preferences.getBool("fan", true);
  lightValue = preferences.getBool("light", true);
  
  Serial.println("internetoPrieiga");
  Serial.println(internetoPrieiga);
  Serial.println("internetoSlaptazodis");
  Serial.println(internetoSlaptazodis);
  Serial.println("light");
  Serial.println(lightValue);
  Serial.println("fan");
  Serial.println(fanValue);
  Serial.println("lightFrom1");
  Serial.println(lightFrom1);
  Serial.println("lightTo1");
  Serial.println(lightTo1);
  Serial.println("moisture1");
  Serial.println(moisture1);
  Serial.println("moisture2");
  Serial.println(moisture2);

  if(fanValue == true){
    digitalWrite(17, HIGH);
  }
  else{
    digitalWrite(17, LOW);
  }

  if(lightValue == true){
    ledStrip();
  }
  else{
    pixels.clear();
    pixels.show();
  }
}

void initialBluetooth(){
  BLEDevice::init("Išmanusis šiltnamis");
  BLEServer *pServer = BLEDevice::createServer();
  BLEService *pService = pServer->createService(SERVICE_UUID);
  BLECharacteristic *pCharacteristic = pService->createCharacteristic(
                                         CHARACTERISTIC_UUID,
                                         BLECharacteristic::PROPERTY_READ |
                                         BLECharacteristic::PROPERTY_WRITE
                                       );
  pCharacteristic->setCallbacks(new MyCallbacks());
  pCharacteristic->setValue("Prisijungta");
  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
}

void connectToWifi(){
  while (ssid != "") { //pries tai buvo != check bout that
    delay(1000);
    Serial.println("SSID and Password not set");
    if(internetoPrieiga!=""){
      ssid = internetoPrieiga.c_str();
      password = internetoSlaptazodis.c_str();
      if(ssid!=""){
        break;
      }
    }
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.println("Connecting to WiFi..");
  }

  Serial.println("Connected to the WiFi network");
}

 void connectandSubMQTT(){
  client.setServer(mqttServer, mqttPort);
  client.setCallback(callback);
  client.setBufferSize(512);

  while (!client.connected()) {
    Serial.println("Connecting to MQTT...");

    if (client.connect("ESP32Client")) {
      Serial.println("connected");
    } else {

      Serial.print("failed with state ");
      Serial.print(client.state());
      delay(2000);

    }
  }
  client.subscribe("x@gmail.com/test");
  client.subscribe("x@gmail.com/settings");
  client.publish("x@gmail.com/login", "user: x has connected to device: x, ssid name: x");
 }
