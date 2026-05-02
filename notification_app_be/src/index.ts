import express from 'express';
import type { Request, Response } from 'express';
import { Log } from 'logging_middleware';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;

app.post('/notify', async (req: Request, res: Response) => {
  const { userId, message } = req.body;
  const stagesOutput: string[] = [];

  // Stage 1: Validation
  stagesOutput.push("[Stage 1: Validation] Validating request payload...");
  if (!userId || !message) {
    stagesOutput.push("[Stage 1: Validation] Failed: Missing required fields");
    Log("backend", "warn", "handler", "Missing user ID or message in notification request.");
    return res.status(400).json({ error: "Missing required fields", stages: stagesOutput });
  }
  stagesOutput.push(`[Stage 1: Validation] Passed: userId=${userId}, message="${message}"`);

  // Stage 2: User Preference Check
  stagesOutput.push("[Stage 2: User Preference Check] Checking user notification preferences...");
  // Simulate DB call
  await new Promise(resolve => setTimeout(resolve, 300));
  stagesOutput.push("[Stage 2: User Preference Check] Passed: User prefers Email and Push notifications");

  // Stage 3: Message Formatting
  stagesOutput.push("[Stage 3: Message Formatting] Formatting message based on user preferences...");
  stagesOutput.push(`[Stage 3: Message Formatting] Output: { "email": "<h1>${message}</h1>", "push": "${message}" }`);

  // Stage 4: Dispatch to Queue
  stagesOutput.push("[Stage 4: Dispatch to Queue] Sending formatted messages to message broker (Kafka/RabbitMQ)...");
  Log("backend", "info", "api", `Dispatching notification to user ${userId}`);
  await new Promise(resolve => setTimeout(resolve, 300));
  stagesOutput.push("[Stage 4: Dispatch to Queue] Passed: Messages queued successfully (Topics: email_queue, push_queue)");

  // Stage 5: Delivery
  stagesOutput.push("[Stage 5: Delivery] Senders consumed messages and dispatched to 3rd party providers (SendGrid, FCM)...");
  stagesOutput.push("[Stage 5: Delivery] Passed: Notification sent successfully to all channels");

  // Log all stages to server console
  console.log("\n=== Notification Request Processed ===");
  stagesOutput.forEach(stage => console.log(stage));
  console.log("======================================\n");

  res.status(200).json({ 
    success: true, 
    message: "Notification sent successfully.",
    stages: stagesOutput
  });
});

app.listen(PORT, () => {
  console.log(`Notification App running on port ${PORT}`);
  Log("backend", "info", "config", "Notification Application Started");
});
