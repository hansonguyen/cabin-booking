package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/hansonguyen/smith-cabin/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var client, err = mongo.Connect(context.Background(), options.Client().ApplyURI(os.Getenv("MONGO_URI")))

// Exported handler function that runs function based on HTTP method
func RunHandler(request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	switch request.RequestContext.HTTP.Method {
	case "GET": return getBookings()
	case "POST": return createBooking(request)
	default: return events.APIGatewayV2HTTPResponse{}, errors.New("invalid request")
	}
}

// GET all bookings
func getBookings() (events.APIGatewayV2HTTPResponse, error) {
	if err != nil {
		return events.APIGatewayV2HTTPResponse{}, err
	}

	collection := client.Database("SmithCabinDB").Collection("bookings")
	cursor, err := collection.Find(context.Background(), bson.M{})

	if err != nil {
		return events.APIGatewayV2HTTPResponse{}, err
	}

	var bookings []utils.Booking

	if err = cursor.All(context.Background(), &bookings); err != nil {
		return events.APIGatewayV2HTTPResponse{}, err
	}

	jbytes, err := json.Marshal(bookings)

	if err != nil {
		return events.APIGatewayV2HTTPResponse{}, err
	}

	ApiResponse := events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusOK}

	return ApiResponse, nil
}

// POST new booking
func createBooking(request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	if err != nil {
		return events.APIGatewayV2HTTPResponse{}, err
	}

	// Validates json and returns error if not working
	ApiResponse := events.APIGatewayV2HTTPResponse{}
	var booking utils.Booking
	err := json.Unmarshal([]byte(request.Body), &booking)

	if err != nil {
		body := "Error: Invalid JSON payload ||| " + fmt.Sprint(err) + " Body Obtained" + "||||" + request.Body
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
	}

	collection := client.Database("SmithCabinDB").Collection("bookings")
	result, err := collection.InsertOne(context.TODO(), booking)

	if err != nil {
		return events.APIGatewayV2HTTPResponse{}, err
	}

	jbytes, err := json.Marshal(result)

	if err != nil {
		return events.APIGatewayV2HTTPResponse{}, err
	}

	ApiResponse = events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusCreated}

	return ApiResponse, nil
}