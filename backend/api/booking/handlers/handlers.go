package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/aws/aws-lambda-go/events"
	"github.com/hansonguyen/smith-cabin/backend/utils"
)

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
	body := utils.Booking{
		ID: "123",
		UserId: "Hanson",
		StartDate: "today",
		EndDate: "tomorrow",
	}
	jbytes, err := json.Marshal(body)

	if err != nil {
		return events.APIGatewayV2HTTPResponse{}, err
	}

	ApiResponse := events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusOK}

	return ApiResponse, nil
}

// POST new booking
func createBooking(request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	// Validates json and returns error if not working
	ApiResponse := events.APIGatewayV2HTTPResponse{}
	var booking utils.Booking
	err := json.Unmarshal([]byte(request.Body), &booking)

	if err != nil {
		body := "Error: Invalid JSON payload ||| " + fmt.Sprint(err) + " Body Obtained" + "||||" + request.Body
		ApiResponse = events.APIGatewayV2HTTPResponse{Body: body, StatusCode: http.StatusBadRequest}
	} else {
		jbytes, err := json.Marshal(booking)
		if err != nil {
			return events.APIGatewayV2HTTPResponse{}, err
		}
		ApiResponse = events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusCreated}
	}

	return ApiResponse, nil
}