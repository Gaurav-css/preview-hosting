
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import { supabase, SUPABASE_BUCKET_NAME } from '@/lib/supabase';

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
        try {
            // 1. List files in the folder (Supabase list might be paginated, check limit?)
            const { data: list, error: listError } = await supabase.storage
                .from(SUPABASE_BUCKET_NAME)
                .list(project.storage_path);

            if (listError) {
                console.error("Error listing files for deletion:", listError);
            } else if (list && list.length > 0) {
                // 2. Delete files
                const filesToDelete = list.map(f => `${project.storage_path}/${f.name}`);
                const { error: deleteError } = await supabase.storage
                    .from(SUPABASE_BUCKET_NAME)
                    .remove(filesToDelete);

                if (deleteError) {
                    console.error("Error deleting files:", deleteError);
                } else {
                    console.log(`Deleted ${filesToDelete.length} files from Supabase`);
                }
            } else {
                // Sometimes list returns empty for folder itself if we don't handle deep folders
                // Supabase storage folders are virtual. We might need recursive delete if it has subfolders.
            }
        } catch (err) {
            console.error(`Failed to delete storage for project ${project.id}:`, err);
        }

        // Delete Database Record
        await Project.deleteOne({ _id: id });

        return NextResponse.json({ success: true, message: 'Project deleted' });

    } catch (error: any) {
        console.error("Delete project error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
