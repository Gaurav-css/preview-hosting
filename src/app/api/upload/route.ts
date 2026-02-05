
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import AdmZip from 'adm-zip';
import { randomBytes } from 'crypto';
import { supabase, SUPABASE_BUCKET_NAME } from '@/lib/supabase';
import mime from 'mime';
import fs from 'fs';
import path from 'path';

const LOCAL_STORAGE_ROOT = path.join(process.cwd(), 'storage');

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

        // FORCE LOCAL STORAGE if Supabase URL is obviously invalid
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        let useLocalStorage = false;
        
        async function uploadToSupabase() {
             console.log(`Upload API: Uploading to Supabase Bucket: ${SUPABASE_BUCKET_NAME}, Path: ${projectPath}`);
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

                    if (error) throw error;
                });
             await Promise.all(uploadPromises);
        }

        try {
            if (!supabaseUrl || supabaseUrl.includes('supabase.co') && !supabaseUrl.includes('civtpkzrhfimcgxiwewn')) {
                 // Try to use Supabase if it looks "real", otherwise local. 
                 // Actually the user has a broken URL. 
                 // Let's try Supabase and catch the specific error to fallback.
                 await uploadToSupabase();
            } else {
                 await uploadToSupabase();
            }
        } catch (error: any) {
             console.error("Supabase Upload Failed:", error);
             if (error.message && (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND'))) {
                 console.log("Falling back to Local Storage...");
                 useLocalStorage = true;
             } else {
                 throw error; // Rethrow other errors
             }
        }

        if (useLocalStorage) {
             const localProjectDir = path.join(LOCAL_STORAGE_ROOT, projectPath);
             if (!fs.existsSync(localProjectDir)) {
                 fs.mkdirSync(localProjectDir, { recursive: true });
             }

             zipEntries.filter(entry => !entry.isDirectory).forEach((entry) => {
                 const fullPath = path.join(localProjectDir, entry.entryName);
                 const dirName = path.dirname(fullPath);
                 if (!fs.existsSync(dirName)) fs.mkdirSync(dirName, { recursive: true });
                 fs.writeFileSync(fullPath, entry.getData());
                 console.log(`Saved local file: ${entry.entryName}`);
             });
        }
        
        console.log("Upload API: Files stored successfully");


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
