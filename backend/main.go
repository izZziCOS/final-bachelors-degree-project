package main

import (
	_ "database/sql"
	mqttServer "siltnamis/backend/mqtt"

	"siltnamis/controller"
	"siltnamis/db"
	"siltnamis/router"

	_ "github.com/lib/pq"
)

func init() {
	db.Connect()
}

func main() {
	//keepAlive := make(chan os.Signal)
	//signal.Notify(keepAlive, os.Interrupt, syscall.SIGTERM)
	mqttServer.MqttServer()
	r := router.SetupRouter()
	// Listen and Serve in 0.0.0.0:80
	go controller.SendWebSocketMessage()

	r.Run(":80")
	//<-keepAlive
}