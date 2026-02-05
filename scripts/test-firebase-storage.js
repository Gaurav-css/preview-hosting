
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Read .env.local to get config manually since we are in a script
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const projectIdMatch = envContent.match(/NEXT_PUBLIC_FIREBASE_PROJECT_ID="(.*?)"/);
const clientEmailMatch = envContent.match(/FIREBASE_CLIENT_EMAIL="(.*?)"/);
const privateKeyMatch = envContent.match(/FIREBASE_PRIVATE_KEY="(.*?)"/);
const bucketMatch = envContent.match(/NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="(.*?)"/);

if (!projectIdMatch || !clientEmailMatch || !privateKeyMatch || !bucketMatch) {
    console.error("Missing Firebase config in .env.local");
    process.exit(1);
}

const config = {
    credential: admin.credential.cert({
        projectId: projectIdMatch[1],
        clientEmail: clientEmailMatch[1],
        privateKey: privateKeyMatch[1].replace(/\\n/g, '\n'),
    }),
    storageBucket: bucketMatch[1]
};

console.log(`Initializing Firebase with bucket: ${config.storageBucket}`);

try {
    admin.initializeApp(config);
    const bucket = admin.storage().bucket();
    
    const testFile = bucket.file('test-upload.txt');
    console.log("Attempting upload...");
    
    testFile.save("Hello from GitHub Copilot", {
        metadata: { contentType: 'text/plain' }
    }).then(() => {
        console.log("Upload successful!");
        // Make public?
        return testFile.makePublic();
    }).then(() => {
        const publicUrl = `https://storage.googleapis.com/${config.storageBucket}/test-upload.txt`;
        console.log("Public URL:", publicUrl);
        process.exit(0);
    }).catch(err => {
        console.error("Upload failed:", err);
        process.exit(1);
    });

} catch (error) {
    console.error("Init Error:", error);
}
