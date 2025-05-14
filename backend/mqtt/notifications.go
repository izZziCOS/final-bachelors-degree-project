package mqttServer

import (
	"log"

	"github.com/appleboy/go-fcm"
)

// SendMessage sends an alert to user when greenhouse data doesn't match settings
func SendMessage(data1, data2, body string) {
	// Create the message to be sent.
	msg := &fcm.Message{
		To: "cTF14mPVQ4OQwzTr6CagcI:APA91bGhUH9vaal3ulfX33qmA5wE3qaHx8JwDyS9sEjygbYP5ahhfjh_RHYCIozbrz1ZL1B8rl6PEPUz362K-_FHABl6iznAQ9SjFlq-KC_ViHljKkFDgxzgsHI1C14rf-7Q0lrL7QMt",
		Data: map[string]interface{}{
			data1: data2,
		},
		Notification: &fcm.Notification{
			Title: "Išmanusis kambarinių augalų šiltnamis",
			Body:  body,
		},
	}

	// Create a FCM client to send the message.
	client, err := fcm.NewClient("AAAARYBn7To:APA91bGje9u2X2QcvO8nXXBXzs-_Tp2ri_ZtzK7dT0kLcRXYEfOPHJdaCwOGPKBbad6IYiDB3As0-wr6ahiawSNQZ_KZqgs64MbYouXblPwIuHhLwWxsHMVFQeRemmDFTKeoaVGQ_kgC")
	if err != nil {
		log.Fatalln(err)
	}

	// Send the message and receive the response without retries.
	response, err := client.Send(msg)
	if err != nil {
		log.Fatalln(err)
	}

	log.Printf("%#v\n", response)
}
