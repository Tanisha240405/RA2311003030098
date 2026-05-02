# Notification System Design (Campus Microservice)

## 1. Quick Overview
This doc explains the high-level architecture we're using for the Campus Notification System. The goal is to make sure we can send notifications across multiple channels (like Email, SMS, and Push) reliably. We also need to handle user preferences so we don't spam people who opted out.

## 2. Main Components

### API Gateway
- **What it does**: This is the main entry point for any internal service that wants to trigger a notification.
- **Key jobs**: It handles basic request validation (checking if the payload has the required fields), rate limiting to stop spam, and basic auth.

### Preference Service
- **What it does**: Keeps track of what the user actually wants to receive.
- **Key jobs**: Stores channel preferences (e.g. if a user only wants emails but no SMS) and manages "Do Not Disturb" time windows.

### Orchestrator and Message Broker
- **What it does**: This is the core routing engine.
- **How it works**: 
  - We use a Message Broker (like RabbitMQ or Kafka) to keep things asynchronous. We can split topics by channel (`email_queue`, `sms_queue`, etc).
  - An Orchestrator Worker pulls the initial request, checks the Preference Service to see if the user allows this type of message, formats the payload, and then pushes it to the right specific channel queue.

### Senders / Delivery Workers
- **What they do**: These are tiny dedicated workers that just listen to their specific queue and talk to the actual 3rd party providers.
  - **Email Worker**: Talks to SendGrid or AWS SES.
  - **SMS Worker**: Talks to Twilio.
  - **Push Worker**: Talks to Firebase (FCM).
- **Key jobs**: They handle provider rate limits, exponential backoff for retries, and update the status if a message bounces.

### Observability & Logging
- **What it does**: Tracks the notification lifecycle.
- **Key jobs**: Uses our central logging middleware to track if a message was Queued, Sent, or Failed. Super important for debugging.

## 3. Basic Flow Diagram

```
[Triggering Service] --> POST /notify --> [API Gateway]
                                                |
                                                v
                                         [Main Queue]
                                                |
                                                v
                                 [Orchestrator Worker] <--> [Preference DB]
                                                |
            ---------------------------------------------------------
            |                           |                           |
            v                           v                           v
      [Email Queue]                 [SMS Queue]                [Push Queue]
            |                           |                           |
            v                           v                           v
     [Email Worker]                [SMS Worker]               [Push Worker]
            |                           |                           |
            v                           v                           v
       (SendGrid)                    (Twilio)                      (FCM)
```

## 4. Scalability Notes
- **Idempotency**: We have to make sure retries don't accidentally send the same email twice.
- **DLQ (Dead Letter Queue)**: If a message fails like 5 times, it gets moved to a DLQ so we can manually figure out why it's failing without blocking the queue.
