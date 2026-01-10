# LV4 Capstone MVP - Media Night Picker

## Table of Contents

1. [Overview](#overview)
2. [Project Purpose](#project-purpose)
3. [Problem Statement](#problem-statement)
4. [MVP Description](#mvp-description)
5. [Project Structure](#project-structure)
6. [Setup and Run Instructions](#setup-and-run-instructions)
7. [Usage](#usage)
8. [Configuration](#configuration)
9. [Notes and Limitations](#notes-and-limitations)

---

## Overview

This project is a small full-stack React + Supabase application built as the **LV4 Capstone MVP**. The app allows a user to define the context for a movie night (mood, runtime, location, and date) and store unique recommendation sets in a database. Previously saved sets are retrieved and displayed on page load and after new submissions.

The codebase intentionally prioritizes clarity and correctness over polish, with a focus on demonstrating a complete end-to-end data flow suitable for an MVP demo.

---

## Project Purpose

**This app is for movie watchers who want to quickly plan a movie night based on vibe and time constraints.**

---

## Problem Statement

Choosing a movie can be unnecessarily time-consuming when the viewer already knows the general vibe and time window they want. This app reduces that friction by allowing a user to define a small set of preferences and persist those choices as reusable recommendation sets.

---

## MVP Description

At its current MVP stage, the app can:

- Accept user input for:

  - ZIP code (validated)
  - Watch date
  - One or more moods
  - Desired movie length range

- Generate a deterministic `query_signature` (via a database-generated column)
- Prevent duplicate recommendation sets from being inserted
- Persist recommendation sets in Supabase
- Retrieve and display saved sets on page load and after insertion
- Maintain functionality across page refreshes

---

## Project Structure

```
src/
├── App.jsx
├── main.jsx
├── index.css
├── App.css
├── Components/
│   └── FormFields.jsx
└── utils/
    └── supabase.js
```

### Key Files

- **App.jsx**

  - Defines the top-level page layout and renders the main form component.

- **Components/FormFields.jsx**

  - Core application logic and UI.
  - Handles form state, Supabase reads/writes, duplicate detection, and rendering saved sets.

- **utils/supabase.js**

  - Initializes the Supabase client used throughout the app.

- **main.jsx**

  - Entry point that mounts the React app.

---

## Setup and Run Instructions

### Prerequisites

- Node.js (v18+ recommended)
- A Supabase project with the required tables

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The app will be available at the local Vite dev server URL (typically `http://localhost:5173`).

---

## Usage

1. Enter a valid 5-digit ZIP code.
2. Select a watch date (enabled after ZIP validation).
3. Choose one or more mood pills.
4. Select a movie length bucket (optional).
5. Click **Get Movies**.

### Expected Behavior

- If the same combination already exists, the app will detect it and skip insertion.
- If the combination is new, it will be saved to Supabase.
- The list on the right will update immediately.
- Refreshing the page will reload previously saved sets.

---

## Configuration

### Environment / Constants

- `IS_TESTING` (in `FormFields.jsx`)

  - Toggles between a temporary and production table name.

```js
const IS_TESTING = true
```

- Supabase credentials are expected to be configured in `utils/supabase.js`.

No additional environment variables are required by the frontend code shown.

---

## Notes and Limitations

- The app currently stores recommendation _sets_ only; it does not yet fetch or display actual movie titles.
- Weather is hard-coded to `CLEAR` for MVP purposes.
- Duplicate handling currently stops insertion but only logs feedback to the console.
- Authentication is not implemented; the app assumes a single primary user.
- UI styling is intentionally minimal and Bootstrap-based.

These limitations are acceptable for MVP scope and provide clear next steps for post-MVP iteration.
