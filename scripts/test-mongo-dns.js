
const dns = require('dns');

console.log("Testing Shard 00-00...");
const shard0 = 'cluster0-shard-00-00.ljywxjn.mongodb.net';

dns.lookup(shard0, (err, address) => {
    if (err) console.error("Shard 00 lookup failed:", err.code);
    else console.log(`Shard 00 found at ${address}! This suggests we can use the standard connection string.`);
});

