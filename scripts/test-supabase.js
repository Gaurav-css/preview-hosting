
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
    console.log('--- Testing Supabase Connection ---');

    // 1. Read .env.local
    const envPath = path.join(__dirname, '..', '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('❌ .env.local file not found!');
        return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?$/m);
    const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=["']?(.*?)["']?$/m);

    const url = urlMatch ? urlMatch[1].trim() : null;
    const key = keyMatch ? keyMatch[1].trim() : null;

    if (!url) {
        console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
        return;
    }
    if (!key) {
        console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local');
        return;
    }

    console.log(`URL detected: "${url}"`);

    // Check for common URL errors
    if (!url.startsWith('https://')) {
        console.error('❌ URL must start with https://');
    }
    if (url.endsWith('/')) {
        console.warn('⚠️ URL should typically not end with a slash, but it might work.');
    }
    if (url.includes('your-project-url')) {
        console.error('❌ You have not replaced the placeholder "your-project-url"!');
        return;
    }

    // 2. Try to connect
    console.log('Attempting to list buckets...');
    try {
        const supabase = createClient(url, key);
        const { data, error } = await supabase.storage.listBuckets();

        if (error) {
            console.error('❌ Supabase API Error:', error.message);
            if (error.message.includes('fetch failed')) {
                console.error('   (This often means a network/SSL issue or invalid URL)');
            }
        } else {
            console.log('✅ Connection Successful!');
            console.log('Buckets found:', data.map(b => b.name));
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err);
    }
}

testConnection();
