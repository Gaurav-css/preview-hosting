
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import Project from '@/models/Project';

async function getAuthorizedUser(req: NextRequest) {
    try {
        const user = await getAuthenticatedUser(req);

        if (!user) {
            return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
        }

        return { user };
    } catch (error) {
        console.error("Token verification failed:", error);
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
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

        const project = await Project.findOneAndUpdate(
            { _id: id, user_id: auth.user._id, deleted_at: null },
            { $set: { deleted_at: new Date() } },
            { new: true }
        );

        if (!project) {
            return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
        }

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

        let action;
        try {
            const body = await req.json();
            action = body.action;
        } catch {
            return NextResponse.json({ error: 'Invalid or missing JSON body' }, { status: 400 });
        }

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

        const updatedProject = await Project.findOneAndUpdate(
            { _id: id, user_id: auth.user._id },
            { $set: { deleted_at: null, status: 'active' } },
            { new: true }
        );

        return NextResponse.json({ success: true, message: 'Project restored', project: updatedProject });
    } catch (error: unknown) {
        console.error('Restore project error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
