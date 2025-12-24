
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminStorage } from '@/lib/firebase-admin';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';

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

        // Delete files from Firebase Storage
        try {
            const bucket = adminStorage.bucket();
            // Delete all files with the prefix
            await bucket.deleteFiles({
                prefix: project.storage_path
            });
            console.log(`Deleted files in prefix: ${project.storage_path}`);
        } catch (err) {
            console.error(`Failed to delete storage for project ${project.id}:`, err);
            // Continue to delete record even if file deletion fails
        }

        // Delete Database Record
        await Project.deleteOne({ _id: id });

        return NextResponse.json({ success: true, message: 'Project deleted' });

    } catch (error: any) {
        console.error("Delete project error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
