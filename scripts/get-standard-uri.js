
const dns = require('dns');
const mongoose = require('mongoose');

try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const uri = "mongodb+srv://gky895522_db_user:RK7i79aHpsaAJoXj@cluster0.ljywxjn.mongodb.net/?appName=Cluster0";

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
        const directUrl = `mongodb://gky895522_db_user:RK7i79aHpsaAJoXj@${firstShard.name}:${firstShard.port}/?ssl=true&authSource=admin`;
        
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
             const standardUri = `mongodb://gky895522_db_user:RK7i79aHpsaAJoXj@${hosts}/?ssl=true&replicaSet=${result.setName}&authSource=admin&appName=Cluster0`;
            
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
