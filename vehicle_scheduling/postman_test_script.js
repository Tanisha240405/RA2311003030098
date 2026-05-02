// === POSTMAN TEST SCRIPT ===
// Instructions:
// 1. Create a GET request to http://20.207.122.201/evaluation-service/vehicles
// 2. Set the Authorization to your Bearer token.
// 3. Go to the "Tests" tab and paste this entire script.
// 4. Click "Send" and open the "Postman Console" (bottom left) to see the algorithmic output!

pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

const vehicles = pm.response.json().vehicles;

// The 0/1 Knapsack Algorithm
function solveKnapsack(capacity, items) {
  const n = items.length;
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

// Fetch Depots and run the algorithm
const getRequest = {
  url: 'http://20.207.122.201/evaluation-service/depots',
  method: 'GET',
  header: {
    'Authorization': 'Bearer ' + pm.environment.get("token") || pm.request.headers.get("Authorization")
  }
};

pm.sendRequest(getRequest, function (err, res) {
    if (err) {
        console.error("Failed to fetch depots:", err);
        return;
    }
    
    const depots = res.json().depots;
    console.log(`Successfully fetched ${depots.length} depots and ${vehicles.length} vehicles.`);
    console.log("=== RUNNING VEHICLE SCHEDULING ALGORITHM ===");

    depots.forEach(depot => {
        const result = solveKnapsack(depot.MechanicHours, vehicles);
        console.log(`\n--- Depot ${depot.ID} (Budget: ${depot.MechanicHours}h) ---`);
        console.log(`Max Impact: ${result.maxImpact}`);
        console.log(`Hours Used: ${result.totalDuration} / ${depot.MechanicHours}`);
        console.log(`Selected Tasks:`, result.selectedTasks);
    });
});
