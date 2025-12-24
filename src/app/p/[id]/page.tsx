
import React from 'react';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Clock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { BrowserWindow } from '@/components/BrowserWindow';

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    await dbConnect();
    const project = await Project.findOne({ preview_url: id });

    if (!project) {
        notFound();
    }

    const isExpired = project.status === 'expired' || new Date() > new Date(project.expires_at);

    if (isExpired) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-12 max-w-lg w-full text-center shadow-sm border border-gray-200">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Preview Expired</h1>
                    <p className="text-gray-500 mb-8">
                        This deployment has expired and is no longer available.
                        Temporary previews are automatically deleted after 24 hours.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                        Create New Preview
                    </Link>
                </div>
                <div className="mt-8">
                    <Link href="/" className="flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                        <Zap className="w-4 h-4 mr-2" />
                        Powered by PreviewHost
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-100 p-4 sm:p-6 md:p-8">
            <header className="flex items-center justify-between mb-6 px-2">
                <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                    <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-gray-900 text-lg tracking-tight">PreviewHost</span>
                </Link>

                <div className="flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200 text-xs font-medium text-gray-500">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
                    Expires {formatDistanceToNow(new Date(project.expires_at), { addSuffix: true })}
                </div>
            </header>

            <div className="flex-1 min-h-0 relative">
                <BrowserWindow
                    url={`https://preview-hosting.vercel.app/p/${id}`}
                    className="h-full w-full shadow-2xl"
                >
                    <iframe
                        src={`/api/preview/${id}/${project.entry_point || 'index.html'}`}
                        className="w-full h-full border-0 bg-white"
                        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
                        title="User Preview"
                    />
                </BrowserWindow>
            </div>
        </div>
    );
}
