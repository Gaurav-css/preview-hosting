import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const includeDeleted = req.nextUrl.searchParams.get('includeDeleted') === 'true';
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

        const projects = await Project.find({ user_id: user._id, deleted_at: null }).sort({ created_at: -1 });

        if (!includeDeleted) {
            return NextResponse.json({ projects });
        }

        const deletedProjects = await Project.find({
            user_id: user._id,
            deleted_at: { $ne: null },
        }).sort({ deleted_at: -1 });

        return NextResponse.json({ projects, deletedProjects });
    } catch (error: unknown) {
        console.error("Error fetching projects:", error);
        
        // Check for specific connectivity errors
        const err = error as Error;
        if (err.name === 'MongooseServerSelectionError' || err.message?.includes('ECONNREFUSED')) {
            return NextResponse.json({ 
                error: 'Database Connection Failed', 
                details: 'Could not connect to MongoDB. Please check your network connection and firewall settings.' 
            }, { status: 503 });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
