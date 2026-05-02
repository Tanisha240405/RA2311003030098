require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

const BASE_URL = 'http://20.207.122.201/evaluation-service';
const TOKEN = process.env.ACCESS_TOKEN;

// The 0/1 Knapsack Algorithm
function solveKnapsack(capacity, items) {
  const n = items.length;
  // dp[i][w] stores the max impact score for first i items with weight limit w
  const dp = Array(n + 1).fill().map(() => Array(capacity + 1).fill(0));

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

  // Backtrack to find the selected items
  let res = dp[n][capacity];
  let w = capacity;
  const selectedTasks = [];
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

async function run() {
  if (!TOKEN) {
    console.error("No ACCESS_TOKEN found in .env file.");
    process.exit(1);
  }

  try {
    const headers = { Authorization: `Bearer ${TOKEN}` };

    console.log("Fetching depots...");
    const depotsRes = await axios.get(`${BASE_URL}/depots`, { headers });
    const depots = depotsRes.data.depots;

    console.log("Fetching vehicles...");
    const vehiclesRes = await axios.get(`${BASE_URL}/vehicles`, { headers });
    const vehicles = vehiclesRes.data.vehicles;

    console.log(`\nFound ${depots.length} depots and ${vehicles.length} vehicles.\n`);

    depots.forEach(depot => {
      const budget = depot.MechanicHours;
      console.log(`=== Depot ID: ${depot.ID} (Budget: ${budget} hours) ===`);
      
      const result = solveKnapsack(budget, vehicles);
      
      console.log(`Max Operational Impact: ${result.maxImpact}`);
      console.log(`Mechanic Hours Used: ${result.totalDuration} / ${budget}`);
      console.log(`Selected Tasks (${result.selectedTasks.length}):`);
      console.log(JSON.stringify(result.selectedTasks, null, 2));
      console.log("\n---------------------------------------------------\n");
    });

  } catch (error) {
    console.error("Error occurred:", error?.response?.data || error.message);
  }
}

run();
