
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import fs from 'fs';
import { deleteFolderRecursively } from '@/lib/supabase';

export async function GET() {
    try {
        await dbConnect();

        const now = new Date();
        const expiredProjects = await Project.find({
            status: 'active',
            expires_at: { $lt: now }
        });

        let deletedCount = 0;

        for (const project of expiredProjects) {
            // Delete files
            try {
                // Delete from Local Storage
                if (fs.existsSync(project.storage_path)) {
                    fs.rmSync(project.storage_path, { recursive: true, force: true });
                }

                // Delete from Supabase
                await deleteFolderRecursively(project.storage_path);

            } catch (err) {
                console.error(`Failed to delete storage for project ${project.id}:`, err);
            }

            // Update status
            project.status = 'expired';
            await project.save();
            deletedCount++;
        }

        return NextResponse.json({ success: true, deleted: deletedCount });
    } catch (error) {
        console.error("Cleanup error:", error);
        return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
    }
}
