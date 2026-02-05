
import mongoose from 'mongoose';
import dns from 'dns';

// Fix for ECONNREFUSED on some networks/Windows setups
// Forces usage of Google/Cloudflare DNS for SRV lookups (required for mongodb+srv)
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
    console.warn("Failed to set custom DNS servers:", e);
}

// Workaround for some Node.js versions / Networks preferring IPv6
// which can cause connection issues with MongoDB Atlas SRV records
try {
    if (dns.setDefaultResultOrder) {
        dns.setDefaultResultOrder('ipv4first');
    }
} catch (e) {
    // Ignore if not supported in this environment
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        'Please define the MONGODB_URI environment variable inside .env.local'
    );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface GlobalMongoose {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: GlobalMongoose;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

// FORCE DNS UPDATE (Moved inside dbConnect for lazy execution but before connection)
// This ensures it runs when the function is actually called, which might help in some Next.js environments.
try {
    const servers = dns.getServers();
    // Only update if not already set to Google (prevent constant resetting if not needed)
    if (!servers.includes('8.8.8.8')) {
           dns.setServers(['8.8.8.8', '1.1.1.1']);
           console.log("Updated DNS servers to use Google/Cloudflare for MongoDB Atlas"); 
    }
} catch (e) {
    console.error("Failed to update DNS servers:", e);
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
