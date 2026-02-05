
const dns = require('dns');

const hostname = 'civtpkzrhfimcgxiwewn.supabase.co';

console.log(`1. Testing Google.com baseline...`);
dns.lookup('google.com', (err, address) => {
   if (err) console.log("Google Lookup Failed:", err.code);
   else console.log("Google Lookup Success:", address);
});

console.log(`2. Testing DNS resolution for ${hostname}`);

dns.lookup(hostname, (err, address) => {
    if (err) {
        console.error("Native Lookup Failed:", err.code);
    } else {
        console.log("Native Lookup Success:", address);
    }
});

try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    console.log("Forcing Google DNS...");
    dns.resolve4(hostname, (err, addresses) => {
        if (err) {
            console.error("Google DNS Resolve Failed:", err.code);
        } else {
            console.log("Google DNS Resolve Success:", addresses);
        }
    });
} catch (e) {
    console.error("Failed to set servers");
}
