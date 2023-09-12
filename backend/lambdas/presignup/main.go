package main

import (
	"fmt"
	"os"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

var approvedEmails []string

func handler(event events.CognitoEventUserPoolsPreSignup) (events.CognitoEventUserPoolsPreSignup, error) {
	fmt.Printf("PreSignup of user: %s\n", event.UserName)

	// Check if the email is in the approved list
	if !isEmailApproved(event.Request.UserAttributes["email"], approvedEmails) {
		return event, fmt.Errorf("email is not in the approved list")
	}

	// Set AutoConfirmUser to true to automatically confirm the user
	event.Response.AutoConfirmUser = true

	return event, nil
}

// Check if the email is in the approved list
func isEmailApproved(email string, approvedEmails []string) bool {
	for _, approvedEmail := range approvedEmails {
		if email == approvedEmail {
			return true
		}
	}
	return false
}

func main() {
	// Retrieve the approved email addresses from the environment variable
	approvedEmailsStr := os.Getenv("APPROVED_EMAILS")
	approvedEmails = strings.Split(approvedEmailsStr, ",")

	lambda.Start(handler)
}
