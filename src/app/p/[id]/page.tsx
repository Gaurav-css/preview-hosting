import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Sparkles } from 'lucide-react';

import { BrowserWindow } from '@/components/BrowserWindow';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    await dbConnect();
    const project = await Project.findOne({ preview_url: id, deleted_at: null });

    if (!project) {
        notFound();
    }

    const isExpired = project.status === 'expired' || new Date() > new Date(project.expires_at);

    if (isExpired) {
        return (
            <div className="min-h-screen bg-[#F5F7FA] px-4 py-10 text-gray-900 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-xl flex-col items-center justify-center pt-20 text-center">
                    <div className="glass-panel w-full rounded-2xl border border-gray-200 p-10 sm:p-12 shadow-sm bg-white">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 border border-gray-200 shadow-sm">
                            <Clock className="h-8 w-8 text-gray-400" />
                        </div>
                        <h1 className="mt-8 text-3xl font-bold tracking-tight text-gray-900">Preview expired</h1>
                        <p className="mt-4 text-base leading-8 text-gray-600">
                            This deployment has rotated out. Preview links stay live for 24 hours, then the workspace tears them down automatically.
                        </p>
                        <Link
                            href="/"
                            className="brand-button mt-8 inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold sm:text-base shadow-md"
                        >
                            Create a new preview
                        </Link>
                    </div>
                    <Link href="/" className="mt-8 inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Powered by PreviewHost
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#F5F7FA] p-4 text-gray-900 sm:p-6 md:p-8">
            <header className="mb-6 flex items-center justify-between px-2">
                <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 shadow-sm">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold tracking-tight text-gray-900">PreviewHost</p>
                        <p className="text-[11px] uppercase tracking-widest text-gray-500 font-medium">Live preview</p>
                    </div>
                </Link>

                <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-600 shadow-sm">
                    <Clock className="mr-2 h-4 w-4 text-gray-400" />
                    Expires {formatDistanceToNow(new Date(project.expires_at), { addSuffix: true })}
                </div>
            </header>

            <div className="min-h-0 flex-1">
                <BrowserWindow
                    url={`/p/${id}`}
                    fullscreenUrl={`/api/preview/${id}/${project.entry_point || 'index.html'}`}
                    className="h-full w-full shadow-lg rounded-xl overflow-hidden border border-gray-200 bg-white"
                >
                    <iframe
                        src={`/api/preview/${id}/${project.entry_point || 'index.html'}`}
                        className="h-full w-full border-0 bg-white"
                        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
                        title="User Preview"
                    />
                </BrowserWindow>
            </div>
        </div>
    );
}
