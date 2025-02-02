Nifty Data Fetching and Analytics API

Overview

This API provides functionalities to fetch historical Nifty index data from an external API and store it in a MySQL database. Additionally, it performs analytics on the stored data to evaluate trading strategies based on breakout patterns.

Features

Fetches historical Nifty index data from a specified API.

Stores data into a MySQL database.

Performs analytics on stored data to simulate trading strategies.

Supports configurable parameters for strategy evaluation.

Prerequisites

Node.js installed

MySQL database set up

Sequelize ORM configured

API key for external data provider (if required)

Installation

Clone the repository:

git clone https://github.com/your-repo/nifty-analytics.git

Navigate to the project directory:

cd nifty-analytics

Install dependencies:

npm install

Configuration

Update the database configuration in models/index.js and ensure API credentials (if needed) are set in environment variables or directly in the script (not recommended).

API Endpoints

1. Fetch Nifty Data

Endpoint: POST /getData

Request Body:

{
  "startDt": "YYYY-MM-DD",
  "endDt": "YYYY-MM-DD"
}

Description:
Fetches historical Nifty data between the specified dates and stores it in the database.

Response:

{
  "success": true
}

2. Perform Analytics

Endpoint: POST /doAnalytics

Request Body:

{
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "entryBuffer": 2,
  "slBuffer": 5,
  "takeProfitBuffer": 10,
  "exitTradeTime": "15:30:00",
  "considerCandleStart": "09:15:00",
  "considerCandleEnd": "09:45:00"
}

Description:
Performs analytics on the stored data to simulate trading strategies.

Response:

{
  "success": true,
  "totalProfit": 1200
}

Technologies Used

Node.js - Backend runtime

Express.js - API framework

Sequelize - ORM for database interaction

MySQL - Database

Axios - HTTP client

Moment.js - Date/time manipulation

Running the Application

To start the application:

node index.js

Ensure your database is running and properly configured.

License

This project is licensed under the MIT License.
