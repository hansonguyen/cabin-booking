package utils

import "go.mongodb.org/mongo-driver/bson/primitive"

type Booking struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	UserName    string	`bson:"userName" json:"userName"`
	UserId      string	`bson:"userId" json:"userId"`
	Title 		string	`bson:"title" json:"title"`
	Start 		string	`bson:"start" json:"start"`
	End   		string	`bson:"end" json:"end"`
	AllDay		bool	`bson:"allDay" json:"allDay"`
}