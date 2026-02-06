/* eslint-disable */
const dns = require('dns');
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    console.log("DNS servers set to Google/Cloudflare");
} catch (e) {
    console.warn("Failed to set DNS servers");
}

const mongoose = require('mongoose');

const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '..', '.env.local');

// Simple .env parser
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            if (!process.env[key]) process.env[key] = value;
        }
    });
}

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error("Error: MONGODB_URI not found in environment or .env.local");
    process.exit(1);
}

console.log("Attempting Mongoose connection...");

mongoose.set('strictQuery', false);

mongoose.connect(uri)
    .then(() => {
        console.log('Successfully connected to MongoDB!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection failed:', err);
        process.exit(1);
    });
