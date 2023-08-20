package main

import (
	"encoding/json"
	"fmt"

	"net/http"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func HandleRequest(request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
    ApiResponse := events.APIGatewayV2HTTPResponse{}

    // Switch for identifying the HTTP request
    switch request.RequestContext.HTTP.Method {
    case "GET":
		body := Booking{
			ID: "123",
			UserId: "Hanson",
			StartDate: "today",
			EndDate: "tomorrow",
		}
		jbytes, err := json.Marshal(body)

		if err != nil {
			return events.APIGatewayV2HTTPResponse{}, err
		}

        ApiResponse = events.APIGatewayV2HTTPResponse{Body: string(jbytes), StatusCode: http.StatusOK}

    case "POST":    
        // Validates json and returns error if not working
        var booking Booking
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

    }
    // Response
    return ApiResponse, nil
}

func main() {
    lambda.Start(HandleRequest)
}

type Booking struct {
	ID			string	`json:"id"`
	UserId		string	`json:"userId"`
	StartDate	string	`json:"startDate"`
	EndDate		string	`json:"endDate"`
}