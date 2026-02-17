# Ultimate Chords Setup Guide

This guide explains how to set up and run the Ultimate Chords application, which consists of a Python Flask server and a React (Vite) client.

## Prerequisites

-   **Node.js** (v18 or higher recommended)
-   **Python** (v3.8 or higher recommended)

## Project Structure

-   `client/`: React frontend application
-   `server/`: Flask backend API

## Setup Instructions

### 1. Server Setup

Navigate to the server directory and set up a virtual environment:

```bash
cd server
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Client Setup

Navigate to the client directory and install dependencies:

```bash
cd client
npm install
```

## Running the Application

You will need two terminal windows to run the full application.

### Terminal 1: Start the Server

```bash
cd server
source venv/bin/activate  # On Windows: venv\Scripts\activate
python run.py
```

The server will start on [http://127.0.0.1:5001](http://127.0.0.1:5001).

### Terminal 2: Start the Client

```bash
cd client
npm run dev
```

The client will typically start on [http://localhost:5173](http://localhost:5173).

## Development Notes

-   The server includes a `debug_scraper.py` and other utilities for testing the scraping logic independently.
-   The client uses Vite, so HMR (Hot Module Replacement) is active during development.
