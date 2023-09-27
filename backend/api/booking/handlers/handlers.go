package handlers

import (
	"context"
	"encoding/json"
	"errors"
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
	if err != nil {
		log.Println("Error connecting to MongoDB.", err)
		return events.APIGatewayV2HTTPResponse{Body: "Error connecting to database.", StatusCode: http.StatusInternalServerError}, err
	}
	switch request.RequestContext.HTTP.Method {
	case "GET":
		return getBookings(request)
	case "POST":
		return createBooking(request)
	case "DELETE":
		return deleteBooking(request)
	case "PUT":
		return updateBooking(request)
	default:
		return events.APIGatewayV2HTTPResponse{}, errors.New("invalid request.")
	}
}

// ------------------------------ GET HANDLER ------------------------------
func getBookings(request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	if rawId, found := request.PathParameters["id"]; found {
		return getOneBooking(rawId)
	}
	if rawId := request.QueryStringParameters["userId"]; len(rawId) != 0 {
		return getBookingsByUser(rawId)
	}
	return getAllBookings()
}

// ------------------------------ GET ALL BOOKINGS ------------------------------
func getAllBookings() (events.APIGatewayV2HTTPResponse, error) {
	collection := client.Database("SmithCabinDB").Collection("bookings")

	cursor, err := collection.Find(context.Background(), bson.M{})

	if err != nil {
		body := "Could not retrieve bookings from database."
		log.Println(body, err)
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
	}

	var bookings []utils.Booking

	if err = cursor.All(context.Background(), &bookings); err != nil {
		body := "Could not retrieve bookings from database."
		log.Println(body, err)
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
	}

	jbytes, err := json.Marshal(bookings)

	if err != nil {
		body := "Failed to read booking data."
		log.Println(body, err)
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
	}

	log.Println("Finished GET /booking")
	return events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusOK}, nil
}

// ------------------------------ GET ALL BOOKINGS FOR A USER ------------------------------
func getBookingsByUser(rawId string) (events.APIGatewayV2HTTPResponse, error) {
	collection := client.Database("SmithCabinDB").Collection("bookings")
	id, err := url.QueryUnescape(rawId)

	cursor, err := collection.Find(context.Background(), bson.D{{Key: "userId", Value: id}})

	if err != nil {
		body := "Could not retrieve bookings from database."
		log.Println(body, err)
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
	}

	var bookings []utils.Booking

	if err = cursor.All(context.Background(), &bookings); err != nil {
		body := "Could not retrieve bookings from database."
		log.Println(body, err)
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
	}

	jbytes, err := json.Marshal(bookings)

	if err != nil {
		body := "Failed to read booking data."
		log.Println(body, err)
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
	}

	log.Println("Finished GET /booking")
	return events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusOK}, nil
}

// ------------------------------ GET ONE BOOKING ------------------------------
func getOneBooking(rawId string) (events.APIGatewayV2HTTPResponse, error) {
	collection := client.Database("SmithCabinDB").Collection("bookings")
	stringId, err := url.QueryUnescape(rawId)

	if err != nil {
		body := "Invalid ID."
		log.Println(body, err)
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
	}

	id, err := primitive.ObjectIDFromHex(stringId)

	if err != nil {
		body := "Invalid ID."
		log.Println(body, err)
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
	}

	var bookingBSON bson.D
	err = collection.FindOne(context.Background(), bson.D{{Key: "_id", Value: id}}).Decode(&bookingBSON)

	if err != nil {
		body := "Booking not found."
		log.Println(body)
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusNotFound}, err
	}

	bbytes, err := bson.Marshal(bookingBSON)

	if err != nil {
		body := "Failed to read booking data."
		log.Println(body)
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
	}

	var booking utils.Booking
	err = bson.Unmarshal(bbytes, &booking)

	if err != nil {
		body := "Failed to read booking data."
		log.Println(body)
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
	}
	jbytes, err := json.Marshal(booking)

	if err != nil {
		body := "Failed to read booking data."
		log.Println(body)
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
	}
	log.Printf("Finished GET /booking/%s\n", id)
	return events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusOK}, nil
}

// ------------------------------ POST BOOKING ------------------------------
func createBooking(request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	// Validates json and returns error if not working
	var booking utils.Booking
	err := json.Unmarshal([]byte(request.Body), &booking)

	if err != nil {
		body := "Invalid body for booking."
		log.Println(booking)
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
	}

	collection := client.Database("SmithCabinDB").Collection("bookings")
	result, err := collection.InsertOne(context.TODO(), booking)

	if err != nil {
		body := "Failed to add booking."
		log.Println(body)
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
	}

	jbytes, err := json.Marshal(result)

	if err != nil {
		body := "Failed to read booking data."
		log.Println(body)
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
	}

	log.Println("Finished POST /booking")
	return events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusCreated}, nil
}

// ------------------------------ DELETE BOOKING ------------------------------
func deleteBooking(request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	collection := client.Database("SmithCabinDB").Collection("bookings")

	if rawId, found := request.PathParameters["id"]; found {
		stringId, err := url.QueryUnescape(rawId)

		if err != nil {
			body := "Invalid ID."
			log.Println(body, err)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
		}

		id, err := primitive.ObjectIDFromHex(stringId)

		if err != nil {
			body := "Invalid ID."
			log.Println(body, err)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
		}

		var bookingBSON bson.D
		err = collection.FindOneAndDelete(context.Background(), bson.D{{Key: "_id", Value: id}}).Decode(&bookingBSON)

		if err != nil {
			body := "Booking not found."
			log.Println(body)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusNotFound}, err
		}

		bbytes, err := bson.Marshal(bookingBSON)

		if err != nil {
			body := "Failed to read booking data."
			log.Println(body)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
		}

		var booking utils.Booking
		err = bson.Unmarshal(bbytes, &booking)

		if err != nil {
			body := "Failed to read booking data."
			log.Println(body)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
		}
		jbytes, err := json.Marshal(booking)

		if err != nil {
			body := "Failed to read booking data."
			log.Println(body)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
		}
		log.Printf("Finished DELETE /booking/%s\n", id)
		return events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusOK}, nil
	}
	body := "No ID provided."
	log.Println(body)
	return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
}

// ------------------------------ PUT NEW BOOKING ------------------------------
func updateBooking(request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	collection := client.Database("SmithCabinDB").Collection("bookings")
	if rawId, found := request.PathParameters["id"]; found {
		stringId, err := url.QueryUnescape(rawId)

		if err != nil {
			body := "Invalid ID."
			log.Println(body, err)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
		}

		id, err := primitive.ObjectIDFromHex(stringId)

		if err != nil {
			body := "Invalid ID."
			log.Println(body, err)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
		}

		var booking utils.Booking
		err = json.Unmarshal([]byte(request.Body), &booking)

		if err != nil {
			body := "Invalid body for booking."
			log.Println(booking)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
		}

		filter := bson.M{"_id": id}
		update := bson.D{
			{Key: "$set", Value: bson.D{
				{Key: "userName", Value: booking.UserName},
				{Key: "userId", Value: booking.UserId},
				{Key: "title", Value: booking.Title},
				{Key: "description", Value: booking.Description},
				{Key: "start", Value: booking.Start},
				{Key: "end", Value: booking.End},
				{Key: "allDay", Value: booking.AllDay},
			}},
		}

		err = collection.FindOneAndUpdate(context.TODO(), filter, update, options.FindOneAndUpdate().SetReturnDocument(options.After)).Decode(&booking)

		if err != nil {
			body := "Booking not found."
			log.Println(body)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusNotFound}, err
		}

		jbytes, err := json.Marshal(booking)

		if err != nil {
			body := "Failed to read booking data."
			log.Println(body)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
		}

		log.Printf("Finished PUT /booking/%s\n", id)
		return events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusCreated}, nil

	}
	body := "No ID provided."
	log.Println(body)
	return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
}
