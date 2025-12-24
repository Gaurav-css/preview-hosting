
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import AdmZip from 'adm-zip';
import { randomBytes } from 'crypto';
import { supabase, SUPABASE_BUCKET_NAME } from '@/lib/supabase';
import mime from 'mime';

export async function POST(req: NextRequest) {
    console.log("Upload API: Request received");
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            console.log("Upload API: Unauthorized - missing token");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];
        console.log("Upload API: Verifying token...");
        const decodedToken = await adminAuth.verifyIdToken(token);
        const { uid } = decodedToken;
        console.log("Upload API: Token verified for UID:", uid);

        await dbConnect();
        const user = await User.findOne({ firebase_uid: uid });
        if (!user) {
            console.log("Upload API: User not found in MongoDB");
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        console.log("Upload API: Processing FormData...");
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            console.log("Upload API: No file in form data");
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        console.log("Upload API: File received:", file.name, "Size:", file.size);

        if (!file.name.endsWith('.zip')) {
            return NextResponse.json({ error: 'Only .zip files are allowed' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const zip = new AdmZip(buffer);

        // Security Check: Look for server-side files
        const zipEntries = zip.getEntries();

        for (const entry of zipEntries) {
            if (entry.entryName.includes('node_modules') || entry.entryName.includes('.env') || entry.entryName.includes('.git')) {
                console.log("Upload API: Forbidden file found:", entry.entryName);
                return NextResponse.json({ error: 'Zip contains forbidden files ' }, { status: 400 });
            }
        }

        // Generate unique project ID
        const previewUrl = randomBytes(4).toString('hex'); // 8 chars
        const projectPath = `projects/${previewUrl}`;

        console.log(`Upload API: Uploading to Supabase Bucket: ${SUPABASE_BUCKET_NAME}, Path: ${projectPath}`);

        // Upload files to Supabase Storage
        const uploadPromises = zipEntries
            .filter(entry => !entry.isDirectory)
            .map(async (entry) => {
                const filePath = `${projectPath}/${entry.entryName}`;
                const fileData = entry.getData();
                const contentType = mime.getType(entry.entryName) || 'application/octet-stream';

                const { error } = await supabase.storage
                    .from(SUPABASE_BUCKET_NAME)
                    .upload(filePath, fileData, {
                        contentType: contentType,
                        upsert: true
                    });

                if (error) {
                    console.error(`Error uploading ${entry.entryName}:`, error);
                    throw new Error(`Failed to upload ${entry.entryName}`);
                }
            });

        await Promise.all(uploadPromises);
        console.log("Upload API: All files uploaded to Supabase");


        // Determine Entry Point
        let entryPoint = 'index.html';
        const fileNames = zipEntries.map(e => e.entryName);

        if (fileNames.includes('index.html')) {
            entryPoint = 'index.html';
        } else {
            // Find first HTML file
            const htmlFile = fileNames.find(f => f.toLowerCase().endsWith('.html') && !f.includes('/'));
            if (htmlFile) {
                entryPoint = htmlFile;
            } else {
                // Check one level deep
                const rootFolders = [...new Set(fileNames.filter(f => f.includes('/')).map(f => f.split('/')[0]))];
                for (const folder of rootFolders) {
                    if (fileNames.includes(`${folder}/index.html`)) {
                        entryPoint = `${folder}/index.html`;
                        break;
                    }
                    const subHtml = fileNames.find(f => f.startsWith(folder + '/') && f.toLowerCase().endsWith('.html'));
                    if (subHtml) {
                        entryPoint = subHtml;
                        break;
                    }
                }
            }
        }
        console.log("Upload API: Entry point detected:", entryPoint);

        // Create Project Record
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const project = await Project.create({
            user_id: user._id,
            project_name: file.name.replace('.zip', ''),
            preview_url: previewUrl,
            storage_path: projectPath, // Storing Supabase Path Prefix
            entry_point: entryPoint,
            expires_at: expiresAt,
            status: 'active'
        });
        console.log("Upload API: Project created:", project._id);

        return NextResponse.json({ project, status: 'success' });

    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
    }
}
