package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/hansonguyen/smith-cabin/backend/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var client, err = mongo.Connect(context.Background(), options.Client().ApplyURI(os.Getenv("MONGO_URI")))

// Exported handler function that runs function based on HTTP method
func RunHandler(request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	switch request.RequestContext.HTTP.Method {
	case "GET": return getBookings(request)
	case "POST": return createBooking(request)
	case "DELETE": return deleteBooking(request)
	default: return events.APIGatewayV2HTTPResponse{}, errors.New("invalid request")
	}
}

// GET one or all bookings
func getBookings(request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	if err != nil {
		log.Println("Error connecting to MongoDB", err)
		return events.APIGatewayV2HTTPResponse{}, err
	}
	
	collection := client.Database("SmithCabinDB").Collection("bookings")

	if rawId, found := request.PathParameters["id"]; found {
		stringId, err := url.QueryUnescape(rawId)

		if err != nil {
			log.Println("Invalid ID", err)
			return events.APIGatewayV2HTTPResponse{}, err
		}

		id, err := primitive.ObjectIDFromHex(stringId)
		
		if err != nil{
			log.Println("Invalid ID", err)
			return events.APIGatewayV2HTTPResponse{}, err
		}

		var bookingBSON bson.D
		err = collection.FindOne(context.Background(), bson.D{{"_id", id}}).Decode(&bookingBSON)

		if err != nil {
			log.Printf("Document not found with id (%s): %s\n", id, err)
			return events.APIGatewayV2HTTPResponse{}, err
		}

		bbytes, err := bson.Marshal(bookingBSON)

		if err != nil {
			log.Println("Unable to marshal BSON object", err)
			return events.APIGatewayV2HTTPResponse{}, err
		}

		var booking utils.Booking
		err = bson.Unmarshal(bbytes, &booking)

		if err != nil {
			log.Println("Unable to unmarshal BSON object", err)
			return events.APIGatewayV2HTTPResponse{}, err
		}
		jbytes, err := json.Marshal(booking)

		if err != nil {
			log.Println("Unable to marshal Booking object", err)
			return events.APIGatewayV2HTTPResponse{}, err
		}
		log.Printf("Finished GET /booking/%s\n", id)
		return events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusOK}, nil
	}

	cursor, err := collection.Find(context.Background(), bson.M{})

	if err != nil {
		log.Println("Could not retrieve documents from database", err)
		return events.APIGatewayV2HTTPResponse{}, err
	}

	var bookings []utils.Booking

	if err = cursor.All(context.Background(), &bookings); err != nil {
		log.Println("Could not retrieve documents from database", err)
		return events.APIGatewayV2HTTPResponse{}, err
	}

	jbytes, err := json.Marshal(bookings)

	if err != nil {
		log.Println("Unable to marshal Bookings object", err)
		return events.APIGatewayV2HTTPResponse{}, err
	}

	log.Println("Finished GET /booking")
	return events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusOK}, nil
}

// POST new booking
func createBooking(request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	if err != nil {
		log.Println("Error connecting to MongoDB", err)
		return events.APIGatewayV2HTTPResponse{}, err
	}

	// Validates json and returns error if not working
	ApiResponse := events.APIGatewayV2HTTPResponse{}
	var booking utils.Booking
	err := json.Unmarshal([]byte(request.Body), &booking)

	if err != nil {
		body := "Error: Invalid JSON payload ||| " + fmt.Sprint(err) + " Body Obtained" + "||||" + request.Body
		log.Println("Unable to unmarshal JSON payload")
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
	}

	collection := client.Database("SmithCabinDB").Collection("bookings")
	result, err := collection.InsertOne(context.TODO(), booking)

	if err != nil {
		log.Println("Could not insert booking into database")
		return events.APIGatewayV2HTTPResponse{}, err
	}

	jbytes, err := json.Marshal(result)

	if err != nil {
		log.Println("Unable to marshal document")
		return events.APIGatewayV2HTTPResponse{}, err
	}

	ApiResponse = events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusCreated}
	log.Println("Finished POST /booking")
	return ApiResponse, nil
}

// DELETE booking
func deleteBooking(request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	if err != nil {
		log.Println("Error connecting to MongoDB", err)
		return events.APIGatewayV2HTTPResponse{}, err
	}
	
	collection := client.Database("SmithCabinDB").Collection("bookings")

	if rawId, found := request.PathParameters["id"]; found {
		stringId, err := url.QueryUnescape(rawId)

		if err != nil {
			log.Println("Invalid ID", err)
			return events.APIGatewayV2HTTPResponse{}, err
		}

		id, err := primitive.ObjectIDFromHex(stringId)
		
		if err != nil{
			log.Println("Invalid ID", err)
			return events.APIGatewayV2HTTPResponse{}, err
		}

		var bookingBSON bson.D
		err = collection.FindOneAndDelete(context.Background(), bson.D{{"_id", id}}).Decode(&bookingBSON)

		if err != nil {
			log.Printf("Document not found with id (%s): %s\n", id, err)
			return events.APIGatewayV2HTTPResponse{}, err
		}

		bbytes, err := bson.Marshal(bookingBSON)

		if err != nil {
			log.Println("Unable to marshal BSON object", err)
			return events.APIGatewayV2HTTPResponse{}, err
		}

		var booking utils.Booking
		err = bson.Unmarshal(bbytes, &booking)

		if err != nil {
			log.Println("Unable to unmarshal BSON object", err)
			return events.APIGatewayV2HTTPResponse{}, err
		}
		jbytes, err := json.Marshal(booking)

		if err != nil {
			log.Println("Unable to marshal Booking object", err)
			return events.APIGatewayV2HTTPResponse{}, err
		}
		log.Printf("Finished DELETE /booking/%s\n", id)
		return events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusOK}, nil
	}
	log.Println("No ID provided")
	return events.APIGatewayV2HTTPResponse{}, nil
}