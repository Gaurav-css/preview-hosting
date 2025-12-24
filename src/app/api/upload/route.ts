
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

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
                return NextResponse.json({ error: 'Zip contains forbidden files (node_modules, .env, .git)' }, { status: 400 });
            }
        }

        // Generate unique preview ID
        const previewUrl = randomBytes(4).toString('hex'); // 8 chars
        const storagePath = path.join(process.cwd(), 'storage', previewUrl);
        console.log("Upload API: Storage path:", storagePath);

        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
        }

        // Extract
        console.log("Upload API: Extracting...");
        zip.extractAllTo(storagePath, true);

        // Determine Entry Point
        let entryPoint = 'index.html';

        if (fs.existsSync(path.join(storagePath, 'index.html'))) {
            entryPoint = 'index.html';
        } else {
            // Find first HTML file
            const files = fs.readdirSync(storagePath);
            const htmlFile = files.find(f => f.toLowerCase().endsWith('.html'));
            if (htmlFile) {
                entryPoint = htmlFile;
            } else {
                // Check one level deep (e.g. if everything is in a folder)
                const folder = files.find(f => fs.statSync(path.join(storagePath, f)).isDirectory());
                if (folder) {
                    const folderPath = path.join(storagePath, folder);
                    const subFiles = fs.readdirSync(folderPath);
                    if (subFiles.includes('index.html')) {
                        entryPoint = path.join(folder, 'index.html').replace(/\\/g, '/');
                    } else {
                        const subHtml = subFiles.find(f => f.toLowerCase().endsWith('.html'));
                        if (subHtml) {
                            entryPoint = path.join(folder, subHtml).replace(/\\/g, '/');
                        }
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
            storage_path: storagePath,
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
