/* eslint-disable */

const dns = require('dns');
const mongoose = require('mongoose');

try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch { }

const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '..', '.env.local');

// Simple .env parser to avoid adding dependency for this script
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    });
    console.log("Loaded environment from .env.local");
}

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error("Error: MONGODB_URI not found in environment or .env.local");
    console.error("Please add MONGODB_URI to your .env.local file.");
    process.exit(1);
}

// Extract credentials from the loaded URI
const authMatch = uri.match(/mongodb(?:\+srv)?:\/\/([^:]+):([^@]+)@/);
let username = "REPLACE_ME";
let password = "REPLACE_ME";

if (authMatch) {
    username = authMatch[1];
    password = authMatch[2];
} else {
    console.warn("Could not parse credentials from MONGODB_URI. Script may fail if specific credentials are needed.");
}

async function run() {
    console.log("Resolving SRV...");
    const hostname = 'cluster0.ljywxjn.mongodb.net';
    dns.resolveSrv('_mongodb._tcp.' + hostname, async (err, addresses) => {
        if (err) {
            console.error("DNS Resolution failed:", err);
            return;
        }
        console.log("Found shards:", addresses);

        const firstShard = addresses[0];
        const directUrl = `mongodb://${username}:${password}@${firstShard.name}:${firstShard.port}/?ssl=true&authSource=admin`;

        console.log("Connecting to first shard to get Replica Set name...");

        // Mongoose doesn't support direct convenient single-server commands as easily as the native driver for this specific discovery task without connecting first.
        // We will try to connect using mongoose to the single shard.

        try {
            const conn = await mongoose.createConnection(directUrl).asPromise();
            console.log("Connected!");

            const admin = conn.db.admin();
            const result = await admin.command({ hello: 1 });
            console.log("Replica Set Name:", result.setName);

            const hosts = addresses.map(a => `${a.name}:${a.port}`).join(',');
            const standardUri = `mongodb://${username}:${password}@${hosts}/?ssl=true&replicaSet=${result.setName}&authSource=admin&appName=Cluster0`;

            console.log("\n--- SUGGESTED STANDARD CONNECTION STRING ---");
            console.log(standardUri);
            console.log("---------------------------------------------");
            await conn.close();

        } catch (e) {
            console.error("Connection failed:", e);
        }
    });
}


run();
