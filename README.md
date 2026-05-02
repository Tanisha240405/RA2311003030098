# Afford Medical Backend Evaluation

Hey there! This repository contains my solutions for the Afford Medical Backend hiring challenge. 

Currently, it covers the first major parts of the evaluation:

### 1. Logging Middleware (`/logging_middleware`)
A reusable TypeScript npm package that intercepts and validates log outputs (checking for `stack`, `level`, and `package`). It securely sends valid logs to the evaluation server using the Bearer token auth, and defaults to local console logging as a fallback.

### 2. Vehicle Maintenance Scheduler (`/vehicle_maintence_scheduler`)
An Express server that solves the **0/1 Knapsack Problem** for vehicle maintenance. 
It pulls available mechanics' budgets from the `/depots` API and pending vehicles from the `/vehicles` API, calculating the absolute optimal subset of vehicles to service to maximize operational impact without exceeding the mechanic-hour budget.

*(Note: The terminal output and Postman screenshots proving the algorithm works are saved in the `postman_screenshots` and `vehicle_scheduling` folders).*

---
**Setup Instructions:**
If you want to run this locally, make sure you add a `.env` file at the root with the `ACCESS_TOKEN` fetched from the auth API. Then just run `npm install` and `npm run start` inside the specific microservice folder!
