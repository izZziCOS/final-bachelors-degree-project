package controller

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	mqttServer "siltnamis/backend/mqtt"
	"siltnamis/config"
	"time"

	"siltnamis/db"
	"siltnamis/errors"
	"siltnamis/utils"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var jwtKey = []byte("secret")

//Claims jwt claims struct
type Claims struct {
	db.User
	jwt.StandardClaims
}

var upGrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// clients - all registered clients
var clients = make(map[*websocket.Conn]bool)

func WsHandler(c *gin.Context) {
	ws, err := upGrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Fatal(err)
	}

	// register client
	clients[ws] = true
}

// SendWebSocketMessage sends sensor messages to clients
func SendWebSocketMessage() {
	for {
		val := <-mqttServer.Broadcast
		sensorValues := fmt.Sprintf("%0.f %0.1f %0.f %0.f", val.Humidity, val.Temperature, val.SoilHumidity1, val.SoilHumidity2)
		for client := range clients {
			err := client.WriteMessage(websocket.TextMessage, []byte(sensorValues))
			if err != nil {
				log.Printf("Websocket error: %s", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}

// Pong tests that api is working
func Pong(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"ping": "pong"})
}

// InitiatePasswordReset reset email with reset url - currently inactive
func InitiatePasswordReset(c *gin.Context) {
	var createReset db.CreateReset
	c.Bind(&createReset)
	if id, ok := checkAndRetrieveUserIDViaEmail(createReset); ok {
		link := fmt.Sprintf("%s/reset/%d", config.CLIENT_URL, id)
		//Reset link is returned in json response for testing purposes since no email service is integrated
		c.JSON(http.StatusOK, gin.H{"success": true, "msg": "Successfully sent reset mail to " + createReset.Email, "link": link})
	} else {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "errors": "No user found for email: " + createReset.Email})
	}
}

//ResetPassword currently inactive
func ResetPassword(c *gin.Context) {
	var resetPassword db.ResetPassword
	c.Bind(&resetPassword)
	if ok, errStr := utils.ValidatePasswordReset(resetPassword); ok {
		password := db.CreateHashedPassword(resetPassword.Password)
		_, err := db.DB.Query(db.UpdateUserPasswordQuery, resetPassword.ID, password)
		errors.HandleErr(c, err)
		c.JSON(http.StatusOK, gin.H{"success": true, "msg": "User password reset successfully"})
	} else {
		c.JSON(http.StatusOK, gin.H{"success": false, "errors": errStr})
	}
}

//GetSettings gets all settings
func GetSettings(c *gin.Context) {
	var settings []db.Settings

	result, err := db.DB.Query(db.GetSettings)
	errors.HandleErr(c, err)

	defer result.Close()
	for result.Next() {
		var setting db.Settings
		err := result.Scan(&setting.ID, &setting.Device, &setting.Fan, &setting.Light, &setting.LightFrom, &setting.LightTo,
			&setting.HumidityFrom, &setting.HumidityTo, &setting.TemperatureFrom, &setting.TemperatureTo, &setting.SoilHumidity1From,
			&setting.SoilHumidity2From, &setting.OwnSettings, &setting.Houseplant1, &setting.Houseplant2)
		if err != nil {
			fmt.Println(err)
		}
		settings = append(settings, setting)
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "settings": settings})
}

//GetHistory gets all history
func GetHistory(c *gin.Context) {
	var histories []db.History

	result, err := db.DB.Query(db.GetHistory)
	errors.HandleErr(c, err)

	defer result.Close()
	for result.Next() {
		var history db.History
		err := result.Scan(&history.ID, &history.DeviceName, &history.Humidity, &history.Temperature, &history.SoilHumidity1,
			&history.SoilHumidity2, &history.Timestamp)
		if err != nil {
			fmt.Println(err)
		}
		histories = append(histories, history)
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "settings": histories})
}

//GetHouseplants gets all plants
func GetHouseplants(c *gin.Context) {
	var houseplants []db.Houseplant

	result, err := db.DB.Query(db.GetHouseplants)
	errors.HandleErr(c, err)

	defer result.Close()
	for result.Next() {
		var houseplant db.Houseplant
		err := result.Scan(&houseplant.ID, &houseplant.Name, &houseplant.HumidityFrom, &houseplant.HumidityTo, &houseplant.TemperatureFrom,
			&houseplant.TemperatureTo, &houseplant.SoilHumidityFrom)
		if err != nil {
			fmt.Println(err)
		}
		houseplants = append(houseplants, houseplant)
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": houseplants})
}

//UpdateSettings updates settings
func UpdateSettings(c *gin.Context) {
	var settings db.Settings

	c.Bind(&settings)

	_, err := db.DB.Query(db.UpdateSettings, settings.Fan, settings.Light, settings.LightFrom, settings.LightTo,
		settings.HumidityFrom, settings.HumidityTo, settings.TemperatureFrom, settings.TemperatureTo,
		settings.SoilHumidity1From, settings.SoilHumidity2From, settings.OwnSettings, settings.Houseplant1, settings.Houseplant2)
	errors.HandleErr(c, err)


	if err != nil {
		fmt.Println(err)
		return
	}
	settingsToSend := db.SettingsToSend{Fan: settings.Fan, Light: settings.Light, LightFrom: settings.LightFrom, LightTo: settings.LightTo, SoilHumidity1From: fmt.Sprint(settings.SoilHumidity1From), SoilHumidity2From: fmt.Sprint(settings.SoilHumidity2From)}
	e, err := json.Marshal(settingsToSend)

	token := mqttServer.MqttClient.Publish("x/settings", 0, false, string(e))
	token.Wait()
	fmt.Println(err)

	c.JSON(http.StatusOK, gin.H{"success": true, "msg": "User settings updated successfully"})
}

//Create new user
func Create(c *gin.Context) {
	var user db.Register
	c.Bind(&user)
	exists := checkUserExists(user)

	valErr := utils.ValidateUser(user, errors.ValidationErrors)
	if exists == true {
		valErr = append(valErr, "Vartotojas su šiuo el.paštu jau egzistuoja")
	}
	fmt.Println(valErr)
	if len(valErr) > 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"success": false, "errors": valErr})
		return
	}
	db.HashPassword(&user)
	_, err := db.DB.Query(db.CreateUserQuery, user.Name, user.Password, user.Email)
	errors.HandleErr(c, err)
	c.JSON(http.StatusOK, gin.H{"success": true, "msg": "Vartotojas sukurtas"})
}

// Session returns JSON of user info
func Session(c *gin.Context) {
	user, isAuthenticated := AuthMiddleware(c, jwtKey)
	if !isAuthenticated {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "msg": "unauthorized"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "user": user})
}

// Login controller
func Login(c *gin.Context) {
	var user db.Login
	c.Bind(&user)

	row := db.DB.QueryRow(db.LoginQuery, user.Email)

	var id int
	var name, email, password, createdAt, updatedAt string

	err := row.Scan(&id, &name, &password, &email, &createdAt, &updatedAt)

	if err == sql.ErrNoRows {
		fmt.Println(sql.ErrNoRows, "err")
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "msg": "Neteisingi prisijungimo duomenys"})
		return
	}

	match := db.CheckPasswordHash(user.Password, password)
	if !match {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "msg": "Neteisingi prisijungimo duomenys"})
		return
	}

	//expiration time of the token ->30 mins
	expirationTime := time.Now().Add(30 * time.Minute)

	// Create the JWT claims, which includes the User struct and expiry time
	claims := &Claims{

		User: db.User{
			Name: name, Email: email, CreatedAt: createdAt, UpdatedAt: updatedAt,
		},
		StandardClaims: jwt.StandardClaims{
			//expiry time, expressed as unix milliseconds
			ExpiresAt: expirationTime.Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	// Create the JWT token string
	tokenString, err := token.SignedString(jwtKey)
	errors.HandleErr(c, err)
	http.SetCookie(c.Writer, &http.Cookie{
		Name:    "token",
		Value:   tokenString,
		Expires: expirationTime,
	})

	fmt.Println(tokenString)
	c.JSON(http.StatusOK, gin.H{"success": true, "msg": "Sėkmingai prisijungta", "user": claims.User, "token": tokenString})
}
// Checks if email that user registered with exists in the database
func checkUserExists(user db.Register) bool {
	rows, err := db.DB.Query(db.CheckUserExists, user.Email)
	if err != nil {
		return false
	}
	if !rows.Next() {
		return false
	}
	return true
}

//Returns -1 as ID if the user doesnt exist in the table
func checkAndRetrieveUserIDViaEmail(createReset db.CreateReset) (int, bool) {
	rows, err := db.DB.Query(db.CheckUserExists, createReset.Email)
	if err != nil {
		return -1, false
	}
	if !rows.Next() {
		return -1, false
	}
	var id int
	err = rows.Scan(&id)
	if err != nil {
		return -1, false
	}
	return id, true
}
