package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"

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
		return getCommentsByPost(request)
	case "POST":
		return createComment(request)
	case "DELETE":
		return deleteComment(request)
	case "PUT":
		return updateComment(request)
	default:
		return events.APIGatewayV2HTTPResponse{}, errors.New("invalid request.")
	}
}

// ------------------------------ GET ONE COMMENT ------------------------------
func getCommentsByPost(request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	rawId := request.QueryStringParameters["bookingId"]
	if len(rawId) != 0 {
		collection := client.Database("SmithCabinDB").Collection("comments")
		stringId, err := url.QueryUnescape(rawId)

		id, err := primitive.ObjectIDFromHex(stringId)

		if err != nil {
			body := "Invalid ID."
			log.Println(body, err)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
		}

		if err != nil {
			body := "Invalid ID."
			log.Println(body, err)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
		}

		cursor, err := collection.Find(context.Background(), bson.D{{Key: "bookingId", Value: id}})

		if err != nil {
			body := "Could not retrieve comments from database."
			log.Println(body, err)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
		}

		var comments []utils.Comment

		if err = cursor.All(context.Background(), &comments); err != nil {
			body := "Could not retrieve comments from database."
			log.Println(body, err)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
		}

		jbytes, err := json.Marshal(comments)

		if err != nil {
			body := "Failed to read comment data."
			log.Println(body, err)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
		}

		log.Println("Finished GET /comment")
		return events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusOK}, nil
	}
	body := "No booking ID provided."
	log.Println(body, err)
	return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
}

// ------------------------------ POST COMMENT ------------------------------
func createComment(request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	// Validates json and returns error if not working
	var comment utils.Comment
	err := json.Unmarshal([]byte(request.Body), &comment)

	if err != nil {
		body := "Invalid body for comment."
		log.Println(comment)
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
	}

	// Add createdAt and updatedAt fields to new comment
	currentTime := time.Now()
	comment.CreatedAt = currentTime
	comment.UpdatedAt = currentTime

	collection := client.Database("SmithCabinDB").Collection("comments")
	result, err := collection.InsertOne(context.TODO(), comment)

	if err != nil {
		body := "Failed to add comment."
		log.Println(body)
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
	}

	jbytes, err := json.Marshal(result)

	if err != nil {
		body := "Failed to read comment data."
		log.Println(body)
		return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
	}

	log.Println("Finished POST /comment")
	return events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusCreated}, nil
}

// ------------------------------ DELETE COMMENT ------------------------------
func deleteComment(request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	collection := client.Database("SmithCabinDB").Collection("comments")

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

		var commentBSON bson.D
		err = collection.FindOneAndDelete(context.Background(), bson.D{{Key: "_id", Value: id}}).Decode(&commentBSON)

		if err != nil {
			body := "Comment not found."
			log.Println(body)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusNotFound}, err
		}

		bbytes, err := bson.Marshal(commentBSON)

		if err != nil {
			body := "Failed to read comment data."
			log.Println(body)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
		}

		var comment utils.Comment
		err = bson.Unmarshal(bbytes, &comment)

		if err != nil {
			body := "Failed to read comment data."
			log.Println(body)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
		}
		jbytes, err := json.Marshal(comment)

		if err != nil {
			body := "Failed to read comment data."
			log.Println(body)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
		}
		log.Printf("Finished DELETE /comment/%s\n", id)
		return events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusOK}, nil
	}
	body := "No ID provided."
	log.Println(body)
	return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
}

// ------------------------------ PUT NEW COMMENT ------------------------------
func updateComment(request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	collection := client.Database("SmithCabinDB").Collection("comments")
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

		var comment utils.Comment
		err = json.Unmarshal([]byte(request.Body), &comment)

		if err != nil {
			body := "Invalid body for comment."
			log.Println(comment)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
		}

		filter := bson.M{"_id": id}
		update := bson.D{
			{Key: "$set", Value: bson.D{
				{Key: "userName", Value: comment.UserName},
				{Key: "userId", Value: comment.UserId},
				{Key: "bookingId", Value: comment.BookingID},
				{Key: "message", Value: comment.Message},
				{Key: "createdAt", Value: comment.CreatedAt},
				{Key: "updatedAt", Value: time.Now()},
			}},
		}

		err = collection.FindOneAndUpdate(context.TODO(), filter, update, options.FindOneAndUpdate().SetReturnDocument(options.After)).Decode(&comment)

		if err != nil {
			body := "Comment not found."
			log.Println(body)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusNotFound}, err
		}

		jbytes, err := json.Marshal(comment)

		if err != nil {
			body := "Failed to read comment data."
			log.Println(body)
			return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusInternalServerError}, err
		}

		log.Printf("Finished PUT /comment/%s\n", id)
		return events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusCreated}, nil

	}
	body := "No ID provided."
	log.Println(body)
	return events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}, err
}
