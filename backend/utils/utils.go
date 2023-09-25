package utils

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Booking struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	UserName    string             `bson:"userName" json:"userName"`
	UserId      string             `bson:"userId" json:"userId"`
	Title       string             `bson:"title" json:"title"`
	Description string             `bson:"description" json:"description"`
	Start       string             `bson:"start" json:"start"`
	End         string             `bson:"end" json:"end"`
	AllDay      bool               `bson:"allDay" json:"allDay"`
}

type Comment struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	UserName  string             `bson:"userName" json:"userName"`
	UserId    string             `bson:"userId" json:"userId"`
	BookingID primitive.ObjectID `bson:"bookingId" json:"bookingId"`
	Message   string             `bson:"message" json:"message"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt,omitempty"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt,omitempty"`
}
