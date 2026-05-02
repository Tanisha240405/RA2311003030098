# Afford Medical Backend Evaluation

### 1. Logging Middleware (`/logging_middleware`)
A reusable TypeScript npm package that intercepts and validates log outputs (checking for `stack`, `level`, and `package`). It securely sends valid logs to the evaluation server using the Bearer token auth, and defaults to local console logging as a fallback.

### 2. Vehicle Maintenance Scheduler (`/vehicle_maintence_scheduler`)
An Express server that solves the **0/1 Knapsack Problem** for vehicle maintenance. 
It pulls available mechanics' budgets from the `/depots` API and pending vehicles from the `/vehicles` API, calculating the absolute optimal subset of vehicles to service to maximize operational impact without exceeding the mechanic-hour budget.

*(Note: The terminal output and Postman screenshots proving the algorithm works are saved in the `postman_screenshots` and `vehicle_scheduling` folders).*

### 3. Notification System (`/notification_app_be`)

A microservice for reliable notification delivery across multiple channels (Email, SMS, Push) while respecting user preferences.

Key components:
- **API Gateway**: Entry point for notification requests, handling validation, rate limiting, and authentication.
- **Preference Service**: Stores user channel preferences and manages Do Not Disturb time windows.
- **Orchestrator and Message Broker**: Asynchronous routing engine using queues (e.g., RabbitMQ) to check preferences, format payloads, and route to channel-specific queues.
- **Delivery Workers**: Specialized workers for each channel (Email via SendGrid/AWS SES, SMS via Twilio, Push via Firebase FCM), managing retries, backoff, and status updates.
- **Observability & Logging**: Lifecycle tracking via the logging middleware for debugging and monitoring.

Features: Idempotency to prevent duplicates, Dead Letter Queue for persistent failures.
