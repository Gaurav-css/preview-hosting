
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import { supabase, SUPABASE_BUCKET_NAME } from '@/lib/supabase';
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

        const sanitizedPath = pathArray.join('/');
        let filePath = `${project.storage_path}/${sanitizedPath}`;

        console.log(`Preview API: Fetching ${filePath} from Supabase`);

        // Check availability logic
        let finalKey = filePath;
        let found = await checkExists(finalKey);

        if (!found) {
            // Try .html
            if (await checkExists(filePath + '.html')) {
                finalKey = filePath + '.html';
                found = true;
            }
            // Try index.html
            else if (await checkExists(filePath + '/index.html')) {
                finalKey = filePath + '/index.html';
                found = true;
            }
        }

        if (!found) {
            return new NextResponse('File not found', { status: 404 });
        }

        return await serveFile(finalKey);

    } catch (error) {
        console.error("Preview error:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

async function checkExists(key: string): Promise<boolean> {
    try {
        // Just try to download a small chunk to check existence
        const { data, error } = await supabase.storage
            .from(SUPABASE_BUCKET_NAME)
            .download(key);

        return !error;
    } catch {
        return false;
    }
}

async function serveFile(key: string) {
    try {
        const { data, error } = await supabase.storage
            .from(SUPABASE_BUCKET_NAME)
            .download(key);

        if (error || !data) {
            console.error("Supabase download error:", error);
            return new NextResponse('Empty file or Not Found', { status: 404 });
        }

        const buffer = Buffer.from(await data.arrayBuffer());
        const mimeType = mime.getType(key) || 'application/octet-stream';

        return new NextResponse(buffer, {
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
