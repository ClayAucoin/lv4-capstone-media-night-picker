# README-BACKEND - Data Persistent to Disk

## Table of Contents

- [Overview](#overview)
- [What This Project Does](#what-this-project-does)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Configuration](#configuration)
- [API Responses](#api-responses)
- [Input JSON Structure](#input-json-structure)
- [Error Handling](#error-handling)
- [Validation Handling](#validation-handling)
- [Endpoints](#endpoints)
- [Example Requests & Responses](#example-requests--responses)
- [Testing](#testing)
- [Logging](#logging)
- [Notes & Limitations](#notes--limitations)

---

## Overview

This backend is a Node.js and Express application built to manage a simple in-memory movie catalog. It supports listing movies, fetching individual movies, adding new entries, and deleting movies. The project includes strong validation, centralized error handling, and both file and console logging.

---

## What This Project Does

- Serves a REST API for movie data
- Validates IDs and request bodies before processing
- Uses centralized error formatting across the app
- Logs all requests to console and to a file
- Provides an Express backend example with full test coverage

---

## Tech Stack

- Node.js
- Express.js
- dotenv
- Supertest
- Vitest
- Custom middleware (colorLogger, fileLogger, validators)
- sendError utility

---

## Project Structure

```http
.
└── src/
    ├── app.js
    ├── config.js
    ├── data.js
    ├── index.js
    ├── index-disk.js
    │
    ├── routes/
    │   ├── root.js
    │   ├── movies.js
    │   ├── find-item.js
    │   ├── add-item.js
    │   └── del-item.js
    │
    ├── middleware/
    │   ├── colorLogger.js
    │   ├── fileLogger.js
    │   └── validators.js
    │
    └── utils/
        └── sendError.js
```

---

## Setup Instructions

### Install dependencies

```bash
npm install
```

### Start the server

```bash
node src/index.js
```

### Run the test suite

```bash
npm test
```

---

## Configuration

The server loads settings from `.env`:

```
PORT=3000
NODE_ENV=development
```

`PORT` defaults to `3000` if not provided.

---

## API Responses

### Success (200)

```json
{
  "ok": true,
  "message": "Optional message",
  "data": {}
}
```

### Error Responses

```json
{
  "ok": false,
  "error": {
    "status": 404,
    "message": "Route not found",
    "code": "NOT_FOUND"
  }
}
```

### Validation Errors

```json
{
  "ok": false,
  "error": {
    "status": 422,
    "message": "Missing required fields",
    "code": "VALIDATION_ERROR",
    "details": {
      "missing": ["id", "title"]
    }
  }
}
```

---

## Input JSON Structure

```json
{
  "id": 20,
  "imdb_id": "tt1234567",
  "title": "Example Movie",
  "year": 2024,
  "runtime": "1:58:00",
  "rating": "PG-13",
  "poster": "https://example.com/poster.jpg",
  "genres": ["Action", "Drama"]
}
```

---

## Error Handling

All errors pass through the global error handler in `app.js` which ensures a consistent response format.  
Errors are created with `sendError(status, message, code, details?)`.

---

## Validation Handling

### `validateId`

Ensures:

- `id` exists
- `id` is a number
- `id` is an integer
- `id` is greater than zero

### `validateMovieBody`

Ensures:

- Request body exists
- Required fields exist (`id`, `title`, `year`)
- Types are valid
- `year` is greater than 1900

---

## Endpoints <a id="endpoints"></a>

### GET /

Returns a simple HTML response confirming server status.

---

### GET /movies/

Returns all movies.

---

### GET /find-item/

- Alias route returning all movies.

### GET /find-item/:id

- Fetches a single movie by ID.

---

### POST /add-item/

Adds a movie using JSON request body.

---

### DELETE /del-item/:id

Deletes a movie by ID.

---

## Example Requests & Responses

### GET /movies (success)

```json
{
  "ok": true,
  "data": [
    {
      "id": 16,
      "title": "Monkey Man",
      "year": 2024
    }
  ]
}
```

### GET /find-item/9999 (not found)

```json
{
  "ok": false,
  "error": {
    "status": 404,
    "message": "Movie not found",
    "code": "NOT_FOUND"
  }
}
```

### POST /add-item (success)

```json
{
  "ok": true,
  "message": "Movie added successfuly",
  "data": { "id": 26, "title": "New Movie", "year": 2024 }
}
```

---

## Testing

The test suite uses **Vitest** and **Supertest**.  
Routes, validation, utilities, and the global error handler are fully tested.

Run:

```bash
npm test
```

---

## Logging

### colorLogger

- Shows method, path, status code, timing
- Colored output for readability

### fileLogger

- Appends logs to `src/logs.txt`
- Stores timestamp, method, path, status code, duration

---

## Notes & Limitations

- Movies are stored in memory only
- No authentication
- Reset occurs on every restart
- Good learning base before adding databases, JWT, etc.
