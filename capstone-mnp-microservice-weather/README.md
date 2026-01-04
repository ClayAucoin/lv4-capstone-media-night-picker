# MICROSERVICE-BACKEND

A lightweight Node.js weather microservice that retrieves daily weather information for a given ZIP code and date using the Visual Crossing Weather API. This service includes API-key protection, complete request validation, and helpful error responses.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Installation](#installation)
   - [Prerequisites](#prerequisites)
   - [Clone the repository](#clone-the-repository)
   - [Install dependencies](#install-dependencies)
   - [Configure environment](#configure-environment)
   - [Start the server](#start-the-server)
6. [Environment Variables](#environment-variables)
7. [API Authentication](#api-authentication)
8. [Input Validation Rules](#input-validation-rules)
   - [ZIP](#zip)
   - [Date](#date)
9. [Routes](#routes)
   - [GET /](#get-)
   - [GET /api/v1/weather](#get-apiv1weather)
10. [Example Requests](#example-requests)
11. [Example Success Response](#example-success-response)
12. [Error Handling](#error-handling)
13. [404 Handler](#404-handler)
14. [Running the Server](#running-the-server)

---

## Overview

This backend microservice accepts a ZIP code and a date, validates the input, queries the Visual Crossing Weather API, and returns normalized weather data for the requested day. All public routes are protected by an API key header, and the weather route enforces strict parameter validation before calling the upstream weather provider.

---

## Features

- Validates ZIP, year, month, and day parameters before making external API calls.
- Protects routes using an `x-api-key` header via middleware.
- Queries the Visual Crossing Weather API for a specific date and ZIP code.
- Normalizes returned data so consumers get a consistent response shape.
- Includes a global 404 JSON handler for unknown routes.
- Uses centralized middleware for both authentication and validation.

---

## Tech Stack

- **Node.js**
- **Express.js**
- **Visual Crossing Weather API**
- Native `fetch` for HTTP requests
- Custom Express middleware

---

## Project Structure

```text
.
└── src/
    ├── app.js              # Express app setup, routes, and 404 handler
    ├── index.js            # Entry point that starts the HTTP server
    ├── config.js           # Configuration values (port and API keys)
    │
    └── middleware/
        └── validators.js   # API key middleware and weather query validator
```

---

## Installation

### Prerequisites

Make sure you have:

- **Node.js** (LTS version recommended)
- **npm** (comes with Node)
- A **Visual Crossing Weather API key**
- An internal API key value you will use for the `x-api-key` header

### Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/lv4-microservice-1-backend.git
cd lv4-microservice-1-backend
```

(Adjust the repo URL to match your actual GitHub repository.)

### Install dependencies

```bash
npm install
```

### Configure environment

You can use a `config.js` file that exports a `config` object. A simple example:

```js
// src/config.js
export const config = {
  port: 3001,
  api_key: "YOUR_INTERNAL_API_KEY",
  weather_key: "YOUR_VISUAL_CROSSING_API_KEY",
}
```

- `port` – The port your microservice will listen on.
- `api_key` – The secret the client must send in the `x-api-key` header.
- `weather_key` – Your Visual Crossing API key.

Alternatively, you can adapt this to use environment variables if your project is set up for that.

### Start the server

```bash
npm start
```

If everything is configured correctly, you should see output similar to:

```text
Weather Microservice running on port 3001
```

Now you can hit the endpoints using a REST client (Postman, Thunder Client, curl, etc).

---

## Environment Variables

The configuration module is expected to expose at least:

- `port` – Port number for the Express server.
- `api_key` – Internal API key used by `validateAPIKey`.
- `weather_key` – API key for the Visual Crossing Weather API.

Example `config.js`:

```js
export const config = {
  port: 3001,
  api_key: "YOUR_INTERNAL_API_KEY",
  weather_key: "YOUR_VISUAL_CROSSING_API_KEY",
}
```

---

## API Authentication

All public routes use `validateAPIKey` middleware.

- Header name: `x-api-key`
- Value: must match `config.api_key`

If the header is missing or incorrect, the service responds with:

```json
{
  "message": "Not authorized."
}
```

Status code: **401 Unauthorized**

---

## Input Validation Rules

Validation is handled by `validateWeatherQuery` middleware, which inspects query parameters and rejects invalid requests with a 422 response and detailed error descriptions.

### ZIP

- Required
- Must be exactly **5 digits**
- Example: `70123`

### Date

- Example: `2025-01-31`
- Required
- Year must be between **1900 and 2100**
- Month must be between **01 and 12**
- Day must be between **01 and 31**
- Additionally, year, month, and day must form a **valid calendar date**

  - e.g., `2025-02-30` is rejected as an invalid date

  On validation failure, a sample response looks like:

  ```json
  {
    "message": "Invalid request parameters",
    "errors": [
      {
        "field": "zip",
        "message": "zip must be a 5-digit number",
        "value": "abc"
      }
    ]
  }
  ```

  Status code: **422 Unprocessable Entity**

---

## Routes

### GET /

Root route, also protected by `validateAPIKey`.

Returns JSON describing the service and expected query parameters:

```json
{
  "message": "This endpoint returns the weather for a specific date.",
  "requiredParameters": {
    "zip": "5-digit US ZIP code",
    "date": "4-digit year" - "2-digit month (01-12)" - "2-digit day (01-31)"
  },
  "format": "/api/v1/weather?zip={zip}&date={year-month-day}",
  "example": "/api/v1/weather?zip=70123&date=2024-12-25"
}
```

---

### GET /api/v1/weather

Main weather endpoint, guarded by both `validateAPIKey` and `validateWeatherQuery`.

**Query parameters:**

- `zip` – 5-digit ZIP code
- `date` – 4-digit year-month number (01–12)-day of month (01–31)

**Headers:**

- `x-api-key: YOUR_INTERNAL_API_KEY`

Internally, the service:

1. Builds a date string in the format `YYYY-MM-DD`.
2. Calls Visual Crossing with this URL pattern:

   ```text
   https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{zip}/{dateString}?unitGroup=us&include=current&contentType=json&key={weather_key}
   ```

3. Reads `data.days[0]` when available, or falls back to `data.currentConditions`.
4. Sends a normalized JSON response to the client.

---

## Example Requests

Using curl:

```bash
curl "http://localhost:3001/api/v1/weather?zip=70123&date=2025-12-10"   -H "x-api-key: YOUR_INTERNAL_API_KEY"
```

---

## Example Success Response

A typical (abridged) success response:

```json
{
  "reqDate": "2025-12-10",
  "temp": 61.5,
  "precipitation": 0,
  "conditions": "Partially cloudy",
  "icon": "partly-cloudy-day",
  "sunrise": "07:01:00",
  "sunset": "17:03:00",
  "description": "Partially cloudy throughout the day"
}
```

Exact values depend on Visual Crossing’s data for that date and ZIP.

---

## Error Handling

All errors eventually pass through the global error handler in `src/app.js`, which produces a consistent JSON error structure:

```json
{
  "ok": false,
  "error": {
    "status": 422,
    "message": "Missing required fields",
    "code": "VALIDATION_ERROR",
    "details": {
      "missing": ["imdb_id", "title"]
    }
  }
}
```

### Error Shape

- `ok`: always `false` for errors
- `error.status`: HTTP status code (e.g. 400, 404, 422, 500)
- `error.message`: human-readable message
- `error.code`: machine-friendly error code (e.g. `INVALID_ID`, `VALIDATION_ERROR`, `READ_ERROR`, `INSERT_ERROR`, `UPDATE_ERROR`, `DELETE_ERROR`, `NOT_FOUND`)
- `error.details` (optional): additional data about the error (missing fields, invalid values, etc.)

### Unauthorized (401)

Missing or invalid API key:

```json
{
  "ok": false,
  "error": {
    "status": 401,
    "message": "Not authorized.",
    "code": "MISSING_API_TOKEN"
  }
}
```

### Validation Errors (422)

Invalid query parameters:

```json
{
  "message": "Invalid request parameters",
  "errors": [
    {
      "field": "year",
      "message": "year must be between 1900 and 2100",
      "value": "1500"
    }
  ]
}
```

### No Weather Data (404)

If Visual Crossing returns no usable data for that date:

```json
{
  "ok": true,
  "status": 404,
  "message": "No weather data found for that date.",
  "date": 1940-01-31
}
```

### Internal Server Error (500)

Unexpected errors during fetch or processing:

```json
{
  "ok": false,
  "error": {
    "status": 500,
    "message": "Internal server error",
    "code": "INTERNAL_ERROR",
    "details": {
      "missing": "error details"
    }
  }
}
```

---

### 404 Handler

Unknown routes are handled by a dedicated 404 middleware, which uses `sendError` to produce a `NOT_FOUND` error including the path and method that were requested.

---

## Running the Server

After installation and configuration:

```bash
npm start
```

Then open or query:

- `http://localhost:3001/` for the root info route
- `http://localhost:3001/api/v1/weather?zip=70123&year=2025&month=12&day=10` for a weather request (with the correct `x-api-key` header)

This microservice is now ready to be consumed by other applications or frontends as part of a larger system.
/
