import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const includeDeleted = req.nextUrl.searchParams.get('includeDeleted') === 'true';

        const user = await getAuthenticatedUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

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
