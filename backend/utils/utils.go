package utils

type Booking struct {
	ID        string `json:"id"`
	UserId    string `json:"userId"`
	StartDate string `json:"startDate"`
	EndDate   string `json:"endDate"`
}