
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req: NextRequest) {
    try {
        const { idToken } = await req.json();

        if (!idToken) {
            console.error("Login API: Missing ID token");
            return NextResponse.json({ error: 'Missing ID token' }, { status: 400 });
        }

        console.log("Login API: Verifying token...");
        // Verify the ID token
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const { uid, email, name, picture } = decodedToken;
        console.log("Login API: Token verified for UID:", uid);

        if (!email) {
            console.error("Login API: No email in token");
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        console.log("Login API: Connecting to DB...");
        await dbConnect();
        console.log("Login API: DB Connected. Finding user...");

        // Find or create user
        let user = await User.findOne({ firebase_uid: uid });

        if (!user) {
            console.log("Login API: User not found, creating new user...");
            user = await User.create({
                firebase_uid: uid,
                email,
                name: name || email.split('@')[0],
                avatar_url: picture,
            });
            console.log("Login API: User created:", user._id);
        } else {
            console.log("Login API: User found:", user._id);
        }

        return NextResponse.json({ user, status: 'success' });
    } catch (error: any) {
        console.error('CRITICAL ERROR in auth API:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
