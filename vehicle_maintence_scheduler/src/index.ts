import express from 'express';
import type { Request, Response } from 'express';
import { Log } from 'logging_middleware';
import axios from 'axios';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Example db module simulation
const db = {
  connect: async () => {
    // Simulate connection failure sometimes
    const success = Math.random() > 0.2;
    if (!success) {
      Log("backend", "fatal", "db", "Critical database connection failure.");
      throw new Error("DB Connection failed");
    }
    Log("backend", "info", "db", "Database connected successfully.");
  }
}

app.post('/schedule', async (req: Request, res: Response) => {
  try {
    const { vehicleId, serviceType } = req.body;

    if (!vehicleId || !serviceType) {
      Log("backend", "warn", "handler", "Missing required fields for scheduling.");
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (typeof vehicleId !== 'string') {
       Log("backend", "error", "handler", "received string, expected bool"); // Explicitly using the example from PDF
    }

    Log("backend", "info", "api", `Scheduling maintenance for vehicle ${vehicleId}`);

    res.status(200).json({ message: "Maintenance scheduled." });

  } catch (error) {
    Log("backend", "error", "handler", "An unexpected error occurred during scheduling.");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// The 0/1 Knapsack Algorithm
function solveKnapsack(capacity: number, items: any[]) {
  const n = items.length;
  const dp = Array(n + 1).fill(0).map(() => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];
    const weight = item.Duration;
    const value = item.Impact;

    for (let w = 1; w <= capacity; w++) {
      if (weight <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - weight] + value);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  let res = dp[n][capacity];
  let w = capacity;
  const selectedTasks: string[] = [];
  let totalDuration = 0;

  for (let i = n; i > 0 && res > 0; i--) {
    if (res !== dp[i - 1][w]) {
      const item = items[i - 1];
      selectedTasks.push(item.TaskID);
      res -= item.Impact;
      w -= item.Duration;
      totalDuration += item.Duration;
    }
  }

  return {
    maxImpact: dp[n][capacity],
    totalDuration,
    selectedTasks
  };
}

app.get('/solve-knapsack', async (req: Request, res: Response): Promise<any> => {
  const TOKEN = process.env.ACCESS_TOKEN;
  if (!TOKEN) {
    return res.status(500).json({ error: "No ACCESS_TOKEN found in .env file." });
  }

  try {
    const BASE_URL = 'http://20.207.122.201/evaluation-service';
    const headers = { Authorization: `Bearer ${TOKEN}` };

    Log("backend", "info", "api", "Fetching depots and vehicles for knapsack scheduling");
    
    const depotsRes = await axios.get(`${BASE_URL}/depots`, { headers });
    const depots = depotsRes.data.depots;

    const vehiclesRes = await axios.get(`${BASE_URL}/vehicles`, { headers });
    const vehicles = vehiclesRes.data.vehicles;

    const results = depots.map((depot: any) => {
      const budget = depot.MechanicHours;
      const solution = solveKnapsack(budget, vehicles);
      return {
        depotId: depot.ID,
        budget: budget,
        maxOperationalImpact: solution.maxImpact,
        mechanicHoursUsed: `${solution.totalDuration} / ${budget}`,
        selectedTasksCount: solution.selectedTasks.length,
        selectedTasks: solution.selectedTasks
      };
    });

    res.status(200).json({
      success: true,
      depotsCount: depots.length,
      vehiclesCount: vehicles.length,
      results: results
    });

  } catch (error: any) {
    Log("backend", "error", "api", "Failed to solve knapsack");
    res.status(500).json({ 
      error: "API Request Failed", 
      details: error?.response?.data || error.message 
    });
  }
});

app.listen(PORT, async () => {
  console.log(`Vehicle Maintenance Scheduler running on port ${PORT}`);
  try {
     await db.connect();
  } catch(e) {
     console.error("Startup failed due to DB error");
  }
});
