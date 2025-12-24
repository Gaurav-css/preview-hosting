
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import { adminStorage } from '@/lib/firebase-admin';
import mime from 'mime';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; path: string[] }> }
) {
    try {
        const { id, path: pathArray } = await params;

        await dbConnect();

        const project = await Project.findOne({ preview_url: id });

        if (!project) {
            return new NextResponse('Project not found', { status: 404 });
        }

        if (project.status === 'expired' || new Date() > new Date(project.expires_at)) {
            return new NextResponse('Project Expired', { status: 410 });
        }

        const bucket = adminStorage.bucket();
        const sanitizedPath = pathArray.join('/');
        let filePath = `${project.storage_path}/${sanitizedPath}`;

        console.log(`Preview API: Fetching ${filePath}`);

        const file = bucket.file(filePath);
        let [exists] = await file.exists();

        if (!exists) {
            // Try adding .html if missing
            filePath = `${project.storage_path}/${sanitizedPath}.html`;
            const fileWithExt = bucket.file(filePath);
            [exists] = await fileWithExt.exists();

            if (exists) {
                return serveFile(fileWithExt);
            }

            // Try index.html if it's a "directory" (implied)
            filePath = `${project.storage_path}/${sanitizedPath}/index.html`;
            const indexFile = bucket.file(filePath);
            [exists] = await indexFile.exists();

            if (exists) {
                return serveFile(indexFile);
            }

            return new NextResponse('File not found', { status: 404 });
        }

        return serveFile(file);

    } catch (error) {
        console.error("Preview error:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

async function serveFile(file: any) {
    try {
        const [metadata] = await file.getMetadata();
        const mimeType = metadata.contentType || mime.getType(file.name) || 'application/octet-stream';
        const fileBuffer = await file.download();

        return new NextResponse(fileBuffer[0], {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (err) {
        console.error("Error serving file:", err);
        return new NextResponse('Error reading file', { status: 500 });
    }
}
