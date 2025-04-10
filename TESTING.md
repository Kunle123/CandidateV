 b# CandidateV Testing Guide

This guide will help you test the CandidateV components that have been implemented so far.

## Prerequisites

Before running the tests, make sure you have the following installed:

1. PostgreSQL database server
2. Python 3.9+
3. Node.js 16+
4. npm 8+

## Setup Database

1. Connect to your PostgreSQL server
2. Run the SQL script to create the necessary databases:

```bash
psql -U postgres -f scripts/setup_local_db.sql
```

## Install Dependencies

1. Install the Python dependencies for each service:

```bash
cd backend/auth_service
pip install -r requirements.txt

cd ../user_service
pip install -r requirements.txt
```

2. Install the Node.js dependencies for the API Gateway:

```bash
cd ../../api
npm install
```

3. Install the dependencies for the test script:

```bash
cd ../scripts
pip install -r requirements.txt
```

## Run Database Migrations

1. Run the migrations for the Auth Service:

```bash
cd backend/auth_service
alembic upgrade head
```

2. Run the migrations for the User Service:

```bash
cd ../user_service
alembic upgrade head
```

## Start Services

You can start all the services using the provided batch script:

```bash
scripts/start_services.bat
```

This will start the following services:
- Auth Service: http://localhost:8000
- User Service: http://localhost:8001
- API Gateway: http://localhost:3000

## Run Tests

Once all services are running, you can run the test script to verify that everything is working correctly:

```bash
cd scripts
python test_services.py
```

The test script will:
1. Test the Auth Service by registering a test user and logging in
2. Test the User Service by getting and updating the user profile
3. Test the API Gateway by accessing services through it

## Manual Testing

You can also test the APIs manually using tools like Postman or curl.

### Auth Service

#### Register a User
```bash
curl -X POST http://localhost:8000/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"Test1234!","name":"Test User"}'
```

#### Login
```bash
curl -X POST http://localhost:8000/api/auth/login -d "username=test@example.com&password=Test1234!"
```
This will return an access token and refresh token that you'll need for subsequent requests.

### User Service

#### Get User Profile
```bash
curl -X GET http://localhost:8001/api/users/me -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Update User Profile
```bash
curl -X PUT http://localhost:8001/api/users/me -H "Authorization: Bearer YOUR_ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"bio":"This is a test bio","job_title":"Software Developer"}'
```

### API Gateway

The API Gateway routes requests to the appropriate service. You can use the same endpoints as above, but with the API Gateway URL:

```bash
curl -X GET http://localhost:3000/api/users/me -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Next Steps

After verifying that the current components work correctly, we can proceed with implementing the next components in the sequence:

1. CV Management Service
2. Frontend Application
3. Export & Document Service
4. AI Optimization Service
5. Payment & Subscription Service 