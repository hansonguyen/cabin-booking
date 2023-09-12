package main

import (
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/hansonguyen/smith-cabin/backend/api/booking/handlers"
)

func HandleRequest(request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	return handlers.RunHandler(request)
}

func main() {
	lambda.Start(HandleRequest)
}
