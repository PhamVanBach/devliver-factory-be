# Authentication API

A simple Node.js authentication API with Express and MongoDB.

## Features

- User registration and login
- JWT token-based authentication
- Password hashing
- Input validation
- Protected routes
- MongoDB database

## Prerequisites

- Node.js (v14 or higher)
- MongoDB installed and running locally
- npm or yarn package manager

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a .env file in the root directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/auth-db
JWT_SECRET=your-super-secret-key-change-this-in-production
```

3. Start the server:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Register a new user

```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get user data (Protected route)

```
GET /api/auth/user
Authorization: Bearer YOUR_JWT_TOKEN
```

## Response Format

### Success Response

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Error Response

```json
{
  "message": "Error message here"
}
```

## Security Features

- Password hashing using bcrypt
- JWT token authentication
- Input validation
- Protected routes
- CORS enabled
# devliver-factory-be
