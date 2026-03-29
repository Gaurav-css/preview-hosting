
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';

async function getAuthorizedUser(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const { uid } = decodedToken;

    await dbConnect();

    const user = await User.findOne({ firebase_uid: uid });
    if (!user) {
        return { error: NextResponse.json({ error: 'User not found' }, { status: 404 }) };
    }

    return { user };
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const auth = await getAuthorizedUser(req);
        if (auth.error) {
            return auth.error;
        }

        const project = await Project.findOne({ _id: id, user_id: auth.user._id, deleted_at: null });

        if (!project) {
            return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
        }

        project.deleted_at = new Date();
        await project.save();

        return NextResponse.json({ success: true, message: 'Project moved to delete history', project });

    } catch (error: unknown) {
        console.error("Delete project error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const auth = await getAuthorizedUser(req);
        if (auth.error) {
            return auth.error;
        }

        const { action } = await req.json();
        if (action !== 'restore') {
            return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
        }

        const project = await Project.findOne({ _id: id, user_id: auth.user._id });

        if (!project) {
            return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
        }

        if (!project.deleted_at) {
            return NextResponse.json({ error: 'Project is not in delete history' }, { status: 409 });
        }

        if (project.status === 'expired' || new Date() > new Date(project.expires_at)) {
            return NextResponse.json({ error: 'Expired previews cannot be restored' }, { status: 409 });
        }

        project.deleted_at = null;
        project.status = 'active';
        await project.save();

        return NextResponse.json({ success: true, message: 'Project restored', project });
    } catch (error: unknown) {
        console.error('Restore project error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
