
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import fs from 'fs';
import path from 'path';
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

        // Security: Prevent accessing files outside storage path
        const sanitizedPath = pathArray.join('/');
        if (sanitizedPath.includes('..')) {
            return new NextResponse('Invalid path', { status: 400 });
        }

        const filePath = path.join(project.storage_path, sanitizedPath);

        if (!fs.existsSync(filePath)) {
            // Try adding .html if missing
            if (fs.existsSync(filePath + '.html')) {
                return serveFile(filePath + '.html');
            }
            return new NextResponse('File not found', { status: 404 });
        }

        if (fs.statSync(filePath).isDirectory()) {
            if (fs.existsSync(path.join(filePath, 'index.html'))) {
                return serveFile(path.join(filePath, 'index.html'));
            }
            return new NextResponse('Directory listing forbidden', { status: 403 });
        }

        return serveFile(filePath);

    } catch (error) {
        console.error("Preview error:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

function serveFile(filePath: string) {
    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = mime.getType(filePath) || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
        headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=3600'
        }
    });
}
