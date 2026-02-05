
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import { supabase, SUPABASE_BUCKET_NAME } from '@/lib/supabase';
import mime from 'mime';
import fs from 'fs';
import path from 'path';

const LOCAL_STORAGE_ROOT = path.join(process.cwd(), 'storage');

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

        console.log(`Preview API: Request for ${filePath}`);

        // 1. Try Local Storage Check
        // Normalize slashes for Windows compatibility
        const normalizedFilePath = filePath.split('/').join(path.sep);
        
        async function smartCheck(key: string): Promise<{ exists: boolean; local: boolean }> {
             // Ensure key matches OS separators
             const normalizedKey = key.split('/').join(path.sep);
             const localKeyPath = path.join(LOCAL_STORAGE_ROOT, normalizedKey);
             
             console.log(`Checking local path: ${localKeyPath}`);
             
             try {
                 if (fs.existsSync(localKeyPath) && fs.statSync(localKeyPath).isFile()) {
                     console.log("-> Found locally!");
                     return { exists: true, local: true };
                 }
             } catch (e) {
                 console.error("Local check error:", e);
             }
             
             console.log("-> Not found locally, checking Supabase...");
             return { exists: await checkSupabase(key), local: false };
        }

        let finalKey = filePath;
        let check = await smartCheck(finalKey);

        if (!check.exists) {
            console.log("Direct check failed, trying fallback extensions...");
            // Try .html
            const checkHtml = await smartCheck(filePath + '.html');
            if (checkHtml.exists) {
                finalKey = filePath + '.html';
                check = checkHtml;
            } else {
                // Try index.html
                const checkIndex = await smartCheck(filePath + '/index.html');
                if (checkIndex.exists) {
                     finalKey = filePath + '/index.html';
                     check = checkIndex;
                }
            }
        }

        if (!check.exists) {
            return new NextResponse('File not found', { status: 404 });
        }

        if (check.local) {
             console.log("Serving from Local Storage:", finalKey);
             // Re-normalize for the final read
             const normalizedFinalKey = finalKey.split('/').join(path.sep);
             const fullLocalPath = path.join(LOCAL_STORAGE_ROOT, normalizedFinalKey);
             
             const fileBuffer = fs.readFileSync(fullLocalPath);
             const mimeType = mime.getType(finalKey) || 'application/octet-stream';
             return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': mimeType,
                    'Cache-Control': 'public, max-age=3600'
                }
            });
        } else {
             console.log("Serving from Supabase:", finalKey);
             return await serveSupabaseFile(finalKey);
        }

    } catch (error) {
        console.error("Preview error:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

async function checkSupabase(key: string): Promise<boolean> {
    try {
        const { data, error } = await supabase.storage
            .from(SUPABASE_BUCKET_NAME)
            .download(key);
        return !error;
    } catch {
        return false;
    }
}

async function serveSupabaseFile(key: string) {
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
