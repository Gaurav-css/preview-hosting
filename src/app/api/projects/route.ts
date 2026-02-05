
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const { uid } = decodedToken;

        await dbConnect();

        // Get the user's ObjectId
        const user = await User.findOne({ firebase_uid: uid });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const projects = await Project.find({ user_id: user._id }).sort({ created_at: -1 });

        return NextResponse.json({ projects });
    } catch (error: any) {
        console.error("Error fetching projects:", error);
        
        // Check for specific connectivity errors
        if (error.name === 'MongooseServerSelectionError' || error.message?.includes('ECONNREFUSED')) {
            return NextResponse.json({ 
                error: 'Database Connection Failed', 
                details: 'Could not connect to MongoDB. Please check your network connection and firewall settings.' 
            }, { status: 503 });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
