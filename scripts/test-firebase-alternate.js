
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const projectIdMatch = envContent.match(/NEXT_PUBLIC_FIREBASE_PROJECT_ID="(.*?)"/);
const clientEmailMatch = envContent.match(/FIREBASE_CLIENT_EMAIL="(.*?)"/);
const privateKeyMatch = envContent.match(/FIREBASE_PRIVATE_KEY="(.*?)"/);

// Guessing the default bucket name
const bucketName = `${projectIdMatch[1]}.appspot.com`;

const config = {
    credential: admin.credential.cert({
        projectId: projectIdMatch[1],
        clientEmail: clientEmailMatch[1],
        privateKey: privateKeyMatch[1].replace(/\\n/g, '\n'),
    }),
    storageBucket: bucketName
};

console.log(`Initializing Firebase with bucket: ${config.storageBucket}`);

try {
    admin.initializeApp(config);
    const bucket = admin.storage().bucket();
    
    bucket.getFiles({ maxResults: 1 }).then(() => {
        console.log("Bucket Access Successful! We can use Firebase Storage.");
        process.exit(0);
    }).catch(err => {
        console.error("Bucket Access Failed:", err.message);
        process.exit(1);
    });

} catch (error) {
    console.error("Init Error:", error);
}
