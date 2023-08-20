package utils

import "go.mongodb.org/mongo-driver/bson/primitive"

type Booking struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	UserId    string `bson:"userId" json:"userId"`
	StartDate string `bson:"startDate" json:"startDate"`
	EndDate   string `bson:"endDate" json:"endDate"`
}