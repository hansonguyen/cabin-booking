# Lake Mary Cabin Booking Website

A user-friendly website for booking and planning memorable trips to the Lake Mary Cabin with family and friends.

## Getting Started

### Dependencies

The following dependencies are required to run the application properly:

* npm and Node.js
* AWS Lambda, API Gateway, and Cognito

### Setup

**Note:** This website won't function without the correct environment variables and API configuration.

#### Backend

The backend consists of a powerful CRUD API built in Go, deployed using AWS Lambda and API Gateway. Additional Lambda functions facilitate AWS Cognito authorization. To set up authentication, create a user pool in AWS Cognito with the following required environment variables:

```
COGNITO_CLIENT_ID=
COGNITO_CLIENT_SECRET=
COGNITO_ISSUER=
```

#### Frontend

The frontend utilizes NextAuth for authentication. You'll need to generate a secret variable for authentication to work correctly:

```
NEXTAUTH_SECRET=
```


### Running the Program

#### Backend

* Create Go binary files for Lambda deployment:

```shell
go build main.go
```
* Compress the main binary into a ZIP folder for deployment.
* Connect AWS API Gateway routes to Lambda functions.

#### Frontend
* Navigate to the frontend directory:
```shell
cd frontend
```

* Install dependencies:
```shell
npm install
```

* Run the development server:
```shell
npm run dev
```

## Authors

* [Hanson Nguyen](https://www.linkedin.com/in/hansonnguyen/)
* [Lawrence Smith](https://www.linkedin.com/in/lawrencefs/)

## Acknoledgements
We used the following libraries and technologies in building this project:

* [Next.js](https://nextjs.org/)
* [AWS](https://aws.amazon.com/)
* [Go](https://go.dev/)
* [TypeScript](https://www.typescriptlang.org/)
* [NextUI](https://nextui.org/)
* [TailwindCSS](https://tailwindcss.com/)
* [NextAuth](https://next-auth.js.org/)
