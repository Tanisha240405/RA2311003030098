"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logging_middleware_1 = require("logging_middleware");
const axios_1 = __importDefault(require("axios"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: path.join(__dirname, '../../.env') });
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = process.env.PORT || 3001;
// Example db module simulation
const db = {
    connect: async () => {
        // Simulate connection failure sometimes
        const success = Math.random() > 0.2;
        if (!success) {
            (0, logging_middleware_1.Log)("backend", "fatal", "db", "Critical database connection failure.");
            throw new Error("DB Connection failed");
        }
        (0, logging_middleware_1.Log)("backend", "info", "db", "Database connected successfully.");
    }
};
app.post('/schedule', async (req, res) => {
    try {
        const { vehicleId, serviceType } = req.body;
        if (!vehicleId || !serviceType) {
            (0, logging_middleware_1.Log)("backend", "warn", "handler", "Missing required fields for scheduling.");
            return res.status(400).json({ error: "Missing required fields" });
        }
        if (typeof vehicleId !== 'string') {
            (0, logging_middleware_1.Log)("backend", "error", "handler", "received string, expected bool"); // Explicitly using the example from PDF
        }
        (0, logging_middleware_1.Log)("backend", "info", "api", `Scheduling maintenance for vehicle ${vehicleId}`);
        res.status(200).json({ message: "Maintenance scheduled." });
    }
    catch (error) {
        (0, logging_middleware_1.Log)("backend", "error", "handler", "An unexpected error occurred during scheduling.");
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// The 0/1 Knapsack Algorithm
function solveKnapsack(capacity, items) {
    const n = items.length;
    const dp = Array(n + 1).fill(0).map(() => Array(capacity + 1).fill(0));
    for (let i = 1; i <= n; i++) {
        const item = items[i - 1];
        const weight = item.Duration;
        const value = item.Impact;
        for (let w = 1; w <= capacity; w++) {
            if (weight <= w) {
                dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - weight] + value);
            }
            else {
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
app.get('/solve-knapsack', async (req, res) => {
    const TOKEN = process.env.ACCESS_TOKEN;
    if (!TOKEN) {
        return res.status(500).json({ error: "No ACCESS_TOKEN found in .env file." });
    }
    try {
        const BASE_URL = 'http://20.207.122.201/evaluation-service';
        const headers = { Authorization: `Bearer ${TOKEN}` };
        (0, logging_middleware_1.Log)("backend", "info", "api", "Fetching depots and vehicles for knapsack scheduling");
        const depotsRes = await axios_1.default.get(`${BASE_URL}/depots`, { headers });
        const depots = depotsRes.data.depots;
        const vehiclesRes = await axios_1.default.get(`${BASE_URL}/vehicles`, { headers });
        const vehicles = vehiclesRes.data.vehicles;
        const results = depots.map((depot) => {
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
    }
    catch (error) {
        (0, logging_middleware_1.Log)("backend", "error", "api", "Failed to solve knapsack");
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
    }
    catch (e) {
        console.error("Startup failed due to DB error");
    }
});
//# sourceMappingURL=index.js.map