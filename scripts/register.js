const axios = require('axios');
const fs = require('fs');
const path = require('path');

const REGISTRATION_URL = 'http://20.207.122.201/evaluation-service/register';

// TODO: Replace with your actual details
const payload = {
  email: "tb5980@srmist.edu.in",
  name: "Tanisha Bhargava",
  mobileNo: "8287062872",
  githubUsername: "Tanisha240405",
  rollNo: "RA2311003030098",
  accessCode: "QkbpxH"
};

async function register() {
  try {
    console.log("Sending registration request...");
    const response = await axios.post(REGISTRATION_URL, payload);
    
    console.log("\nRegistration Successful!");
    console.log(response.data);

    // Save clientID and clientSecret to .env file in the root
    const envContent = `CLIENT_ID=${response.data.clientID}\nCLIENT_SECRET=${response.data.clientSecret}\nEMAIL=${payload.email}\nROLL_NO=${payload.rollNo}\n`;
    const envPath = path.join(__dirname, '..', '.env');
    fs.writeFileSync(envPath, envContent, { flag: 'a' });
    console.log(`\nSaved credentials to ${envPath}`);

  } catch (error) {
    console.error("Registration failed:", error?.response?.data || error.message);
  }
}

register();
