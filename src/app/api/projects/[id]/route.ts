
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import { deleteFolderRecursively } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const LOCAL_STORAGE_ROOT = path.join(process.cwd(), 'storage');

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const { uid } = decodedToken;

        await dbConnect();

        const user = await User.findOne({ firebase_uid: uid });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Find the project and ensure it belongs to the user
        const project = await Project.findOne({ _id: id, user_id: user._id });

        if (!project) {
            return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
        }

        // Delete files from Supabase
        await deleteFolderRecursively(project.storage_path);

        // Delete from Local Storage (if enabled/fallback used)
        try {
            const localProjectPath = path.join(LOCAL_STORAGE_ROOT, project.storage_path);
            if (fs.existsSync(localProjectPath)) {
                fs.rmSync(localProjectPath, { recursive: true, force: true });
                console.log(`Deleted local files for project: ${id}`);
            }
        } catch (error) {
            console.error(`Failed to delete local storage for project ${id}:`, error);
        }

        // Delete Database Record
        await Project.deleteOne({ _id: id });

        return NextResponse.json({ success: true, message: 'Project deleted' });

    } catch (error: unknown) {
        console.error("Delete project error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
