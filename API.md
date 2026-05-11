# API Documentation for LocalConnect

## Authentication Endpoints

### Sign Up
- **Endpoint:** `/api/auth/signup`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
      "username": "string",
      "password": "string",
      "email": "string"
  }
  ```
- **Success Response:** 201 Created
  ```json
  {
      "message": "User created successfully!"
  }
  ```
- **Error Response:** 400 Bad Request
  ```json
  {
      "error": "Username already exists"
  }
  ```

### Sign In
- **Endpoint:** `/api/auth/login`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
      "username": "string",
      "password": "string"
  }
  ```
- **Success Response:** 200 OK
  ```json
  {
      "token": "your_jwt_token"
  }
  ```
- **Error Response:** 401 Unauthorized
  ```json
  {
      "error": "Invalid credentials"
  }
  ```

## User Endpoints

### Get User Profile
- **Endpoint:** `/api/user/profile`
- **Method:** `GET`
- **Headers:** `{ "Authorization": "Bearer your_jwt_token" }`
- **Success Response:** 200 OK
  ```json
  {
      "username": "string",
      "email": "string",
      "created_at": "timestamp"
  }
  ```
- **Error Response:** 403 Forbidden
  ```json
  {
      "error": "Access denied"
  }
  ```

## Business Endpoints

### Create Business
- **Endpoint:** `/api/business/create`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
      "name": "string",
      "address": "string",
      "owner_id": "string"
  }
  ```
- **Success Response:** 201 Created
  ```json
  {
      "message": "Business created successfully!"
  }
  ```
- **Error Response:** 400 Bad Request
  ```json
  {
      "error": "Invalid business data"
  }
  ```

### Get Business Details
- **Endpoint:** `/api/business/{business_id}`
- **Method:** `GET`
- **Success Response:** 200 OK
  ```json
  {
      "id": "string",
      "name": "string",
      "address": "string",
      "owner_id": "string"
  }
  ```
- **Error Response:** 404 Not Found
  ```json
  {
      "error": "Business not found"
  }
  ```

## Error Responses

### Common Errors
- 400 Bad Request: Invalid request format.
- 401 Unauthorized: Authentication failed.
- 403 Forbidden: No access to the resource.
- 404 Not Found: Requested resource not found.

## Examples

### Example of Sign Up Request
```bash
curl -X POST http://localhost:3000/api/auth/signup \
-H "Content-Type: application/json" \
-d '{"username": "testuser", "password": "password123", "email": "test@example.com"}'
```

### Example of Sign In Request
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"username": "testuser", "password": "password123"}'
```
