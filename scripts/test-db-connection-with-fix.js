
const dns = require('dns');
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    console.log("DNS servers set to Google/Cloudflare");
} catch (e) {
    console.warn("Failed to set DNS servers");
}

const mongoose = require('mongoose');

// Manually pulling URI for testing since we are in a script
const uri = "mongodb+srv://gky895522_db_user:RK7i79aHpsaAJoXj@cluster0.ljywxjn.mongodb.net/?appName=Cluster0";

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
