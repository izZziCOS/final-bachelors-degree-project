package db

// All used queries for database
const (
	CheckUserExists         = `SELECT id from users WHERE email = $1`
	LoginQuery              = `SELECT * from users WHERE email = $1`
	CreateUserQuery         = `INSERT INTO users(id,name,password,email) VALUES (DEFAULT, $1 , $2, $3);`
	UpdateUserPasswordQuery = `UPDATE users SET password = $2 WHERE id = $1`
	CreateHistory           = `INSERT INTO history(id, "deviceName", humidity, temperature, "soilHumidity1", "soilHumidity2") VALUES (DEFAULT, $1 , $2, $3 , $4 , $5)`
	GetSettings 			= `SELECT * FROM settings`
	UpdateSettings 			= `UPDATE settings SET fan = $1, light = $2, "lightFrom" = $3, "lightTo" = $4, "humidityFrom" = $5, "humidityTo" = $6, "temperatureFrom" = $7, 
									  "temperatureTo" = $8, "soilHumidity1From" = $9, "soilHumidity2From" = $10, "ownSettings" = $11, houseplant1 = $12, houseplant2 = $13 WHERE id = 1`
	GetHistory 				= `SELECT * FROM history`
	GetHouseplants 			= `SELECT * FROM houseplants`
)
