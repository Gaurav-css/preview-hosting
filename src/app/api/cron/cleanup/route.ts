
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import fs from 'fs';

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
                if (fs.existsSync(project.storage_path)) {
                    fs.rmSync(project.storage_path, { recursive: true, force: true });
                }
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
