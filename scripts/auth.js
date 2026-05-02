require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const AUTH_URL = 'http://20.207.122.201/evaluation-service/auth';

async function authenticate() {
  try {
    const { CLIENT_ID, CLIENT_SECRET, EMAIL, ROLL_NO } = process.env;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error("Missing CLIENT_ID or CLIENT_SECRET in .env file. Please run register.js first.");
      process.exit(1);
    }

    const payload = {
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      email: EMAIL || "tb5980@srmist.edu.in",
      rollNo: ROLL_NO || "RA2311003030098",
      name: "Tanisha Bhargava",
      accessCode: "QkbpxH"
    };

    console.log("Requesting Authorization Token...");
    const response = await axios.post(AUTH_URL, payload);
    
    console.log("\nAuthentication Successful!");
    const token = response.data.access_token;
    console.log(`Access Token: ${token}`);
    console.log(`Expires In: ${response.data.expires_in}`);

    // Replace the token in the .env file
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    if (envContent.includes('ACCESS_TOKEN=')) {
      envContent = envContent.replace(/ACCESS_TOKEN=.*/, `ACCESS_TOKEN=${token}`);
    } else {
      envContent += `\nACCESS_TOKEN=${token}\n`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log("\nSaved new ACCESS_TOKEN to .env");

  } catch (error) {
    console.error("Authentication failed:", error?.response?.data || error.message);
  }
}

authenticate();
