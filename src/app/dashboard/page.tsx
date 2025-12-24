"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import { Plus, Clock, ExternalLink, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';


interface Project {
    _id: string;
    project_name: string;
    preview_url: string;
    expires_at: string;
    status: 'active' | 'expired';
    created_at: string;
}

export default function Dashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        async function fetchProjects() {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/projects', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    setProjects(data.projects);
                }
            } catch (error) {
                console.error("Failed to fetch projects", error);
            } finally {
                setFetching(false);
            }
        }

        if (user) {
            fetchProjects();
        }
    }, [user]);


    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this preview?')) return;
        if (!user) return;

        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/projects/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setProjects(projects.filter(p => p._id !== id));
            } else {
                alert('Failed to delete project');
            }
        } catch (error) {
            console.error("Delete error", error);
            alert('An error occurred while deleting');
        }
    };

    if (loading || (fetching && user)) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            </div>
        );
    }

    if (!user) return null; // Will redirect

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Your Previews</h1>
                        <p className="text-gray-500 mt-1">Manage all your active deployments</p>
                    </div>
                    <Link
                        href="/upload"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        New Preview
                    </Link>
                </div>

                {projects.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Plus className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No active previews</h3>
                        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                            You haven't uploaded any projects yet. Upload a zip file or folder to get started.
                        </p>
                        <Link
                            href="/upload"
                            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            Upload Project
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <div
                                key={project._id}
                                className={`bg-white rounded-2xl border ${project.status === 'expired' ? 'border-gray-200 opacity-75' : 'border-gray-200 shadow-sm hover:shadow-md'} transition-all overflow-hidden`}
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-bold text-gray-900 truncate flex-1 mr-2" title={project.project_name}>
                                            {project.project_name}
                                        </h3>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {project.status === 'active' ? 'Live' : 'Expired'}
                                        </span>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Clock className="w-4 h-4 mr-2" />
                                            {project.status === 'active' ? (
                                                <span>Expires {formatDistanceToNow(new Date(project.expires_at), { addSuffix: true })}</span>
                                            ) : (
                                                <span>Expired {formatDistanceToNow(new Date(project.expires_at), { addSuffix: true })}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        {project.status === 'active' ? (
                                            <a
                                                href={`/p/${project.preview_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                View Live
                                            </a>
                                        ) : (
                                            <button
                                                disabled
                                                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-400 bg-gray-50 cursor-not-allowed"
                                            >
                                                Preview Unavailable
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(project._id)}
                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors border border-gray-200 rounded-lg hover:bg-red-50"
                                            title="Delete Preview"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
