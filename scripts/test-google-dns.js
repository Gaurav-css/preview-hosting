
const dns = require('dns');

console.log("Current servers:", dns.getServers());

try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    console.log("New servers set:", dns.getServers());
} catch (e) {
    console.error("Failed to set servers:", e.message);
}

console.log("Testing SRV resolution with Google DNS...");

dns.resolveSrv('_mongodb._tcp.cluster0.ljywxjn.mongodb.net', (err, addresses) => {
    if (err) {
        console.error("SRV Lookup Failed even with Google DNS:", err);
    } else {
        console.log("SUCCESS! SRV Record found:", addresses);
    }
});
