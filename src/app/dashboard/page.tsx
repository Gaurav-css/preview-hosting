"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
    Activity,
    AlertCircle,
    Check,
    Clock,
    Copy,
    ExternalLink,
    Layout,
    Loader2,
    LogOut,
    Plus,
    RotateCcw,
    Settings,
    Trash2,
    UploadCloud,
    User as UserIcon,
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';

interface Project {
    _id: string;
    project_name: string;
    preview_url: string;
    expires_at: string;
    status: 'active' | 'expired';
    created_at: string;
    deleted_at?: string | null;
}

const SOON_THRESHOLD_MS = 1000 * 60 * 60 * 6;

export default function Dashboard() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [justDeletedIds, setJustDeletedIds] = useState<string[]>([]);
    const [restoringId, setRestoringId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [filterTarget, setFilterTarget] = useState<'all' | 'active' | 'expired'>('all');

    // Prevent double clicks with synchronous refs
    const actionInProgress = React.useRef(new Set<string>());

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [loading, router, user]);

    useEffect(() => {
        async function fetchProjects() {
            if (!user) {
                setFetching(false);
                return;
            }

            setError(null);

            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/projects?includeDeleted=true', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();

                if (res.ok) {
                    setProjects(data.projects || []);
                    setDeletedProjects(data.deletedProjects || []);
                } else {
                    setError(data.details || data.error || 'Failed to load projects');
                }
            } catch (fetchError) {
                console.error('Failed to fetch projects', fetchError);
                setError('Network error. Please try again.');
            } finally {
                setFetching(false);
            }
        }

        void fetchProjects();
    }, [user]);

    const stats = useMemo(() => {
        const sorted = [...projects].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        const active = sorted.filter((project) => project.status === 'active');
        const expiringSoon = active.filter((project) => {
            const remaining = new Date(project.expires_at).getTime() - Date.now();
            return remaining > 0 && remaining <= SOON_THRESHOLD_MS;
        }).length;

        const filtered = sorted.filter(project => {
            if (filterTarget === 'all') return true;
            if (filterTarget === 'active') return project.status === 'active';
            if (filterTarget === 'expired') return project.status === 'expired';
            return true;
        });

        return {
            sorted,
            filtered,
            activeCount: active.length,
            expiredCount: sorted.length - active.length,
            expiringSoon,
            newest: sorted[0] || null,
            deletedCount: deletedProjects.length,
        };
    }, [deletedProjects.length, projects, filterTarget]);

    const handleDelete = async (id: string) => {
        if (actionInProgress.current.has(id)) return;
        actionInProgress.current.add(id);

        setDeletingId(id);

        // Find project before state changes
        const projectToDelete = projects.find((p) => p._id === id);

        await new Promise((resolve) => setTimeout(resolve, 850));

        if (!user) {
            setDeletingId(null);
            actionInProgress.current.delete(id);
            return;
        }

        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/projects/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();

            if (!res.ok) {
                window.alert(data.error || 'Failed to delete project');
                setDeletingId(null);
                actionInProgress.current.delete(id);
                return;
            }

            setJustDeletedIds((current) => [...current, id]);

            setTimeout(() => {
                const deletedProject = data.project || {
                    ...(projectToDelete || {}),
                    _id: id,
                    deleted_at: new Date().toISOString(),
                };

                setProjects((current) => current.filter((project) => project._id !== id));
                setDeletedProjects((existing) => {
                    // Prevent strict mode duplicates
                    if (existing.some((p) => p._id === id)) return existing;
                    return [deletedProject as Project, ...existing];
                });

                setJustDeletedIds((current) => current.filter((projectId) => projectId !== id));
                setDeletingId(null);
                actionInProgress.current.delete(id);
            }, 450);
        } catch (deleteError) {
            console.error('Delete error', deleteError);
            window.alert('An error occurred while deleting');
            setDeletingId(null);
            actionInProgress.current.delete(id);
        }
    };

    const handleRestore = async (id: string) => {
        if (!user || actionInProgress.current.has(`restore-${id}`)) {
            return;
        }

        actionInProgress.current.add(`restore-${id}`);
        setRestoringId(id);

        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/projects/${id}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'restore' }),
            });
            const data = await res.json();

            if (!res.ok) {
                // If it's already restored (409), just forcefully fix the UI state
                if (res.status === 409 && data.error === 'Project is not in delete history') {
                    setDeletedProjects((current) => current.filter((p) => p._id !== id));
                    // Trigger a fast silent reload of the projects to ensure sync
                    window.dispatchEvent(new Event('focus')); // depending on SWR? We aren't using SWR..
                    // We'll just do a manual state cleanup
                    setRestoringId(null);
                    actionInProgress.current.delete(`restore-${id}`);
                    return;
                }

                window.alert(data.error || 'Failed to restore project');
                return;
            }

            const restoredProject = data.project as Project;
            setDeletedProjects((current) => current.filter((project) => project._id !== id));
            setProjects((current) => {
                // Prevent duplicate insertions
                if (current.some((p) => p._id === id)) return current;
                return [restoredProject, ...current].sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                );
            });
        } catch (restoreError) {
            console.error('Restore error', restoreError);
            window.alert('An error occurred while restoring');
        } finally {
            setRestoringId(null);
            actionInProgress.current.delete(`restore-${id}`);
        }
    };

    const handleCopy = async (id: string, previewUrl: string) => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/p/${previewUrl}`);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 1800);
        } catch (copyError) {
            console.error('Copy failed', copyError);
        }
    };

    if (loading || (fetching && user)) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F5F7FA]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const firstName = user.displayName?.split(' ')[0] || 'Builder';

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F5F7FA]">
                <div className="glass-panel mx-auto max-w-sm p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Dashboard unavailable</h2>
                    <p className="mt-2 text-sm text-gray-500">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="brand-button mt-6 w-full py-2.5"
                    >
                        Retry loading
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#F5F7FA] text-gray-900 overflow-hidden text-sm flex-col md:flex-row">
            {/* MOBILE HEADER */}
            <header className="md:hidden flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 z-20 shadow-sm">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white shadow-sm">
                        <Layout className="h-4 w-4" />
                    </div>
                    <span className="font-semibold tracking-tight text-gray-900">PreviewHost</span>
                </Link>
                <div className="flex items-center gap-4 border border-gray-200 p-1 rounded-full bg-gray-50">
                    <Link href="/upload" className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors bg-white rounded-full shadow-sm" title="New Preview">
                        <Plus className="h-4 w-4" />
                    </Link>
                    <button onClick={() => logout()} className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors" title="Logout">
                        <LogOut className="h-4 w-4" />
                    </button>
                    {user.photoURL && (
                        <img src={user.photoURL} className="h-7 w-7 rounded-full border border-gray-200 object-cover" alt={firstName} />
                    )}
                </div>
            </header>

            {/* LEFT SIDEBAR (Desktop) */}
            <aside className="w-64 bg-white border-r border-[#E5E7EB] flex-col justify-between hidden md:flex shrink-0 z-10">
                <div>
                    <div className="h-16 flex items-center px-6 border-b border-[#E5E7EB]">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 text-white shadow-sm">
                                <Layout className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-semibold text-[15px] tracking-tight text-gray-900">PreviewHost</span>
                        </Link>
                    </div>
                    <nav className="p-4 space-y-1">
                        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg font-medium">
                            <Layout className="h-4 w-4 text-gray-500" /> Dashboard
                        </Link>
                        <Link href="/upload" className="flex items-center gap-3 px-3 py-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-lg font-medium transition-colors">
                            <Plus className="h-4 w-4 text-gray-400" /> New Preview
                        </Link>
                        {/* <Link href="#" className="flex items-center gap-3 px-3 py-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-lg font-medium transition-colors">
                            <Settings className="h-4 w-4 text-gray-400" /> Settings
                        </Link> */}
                    </nav>
                </div>

                <div className="p-4 border-t border-[#E5E7EB] bg-gray-50/50">
                    <div className="flex items-center gap-3 px-2 py-1">
                        {user.photoURL ? (
                            <img src={user.photoURL} className="h-8 w-8 rounded-full border border-gray-200" alt={firstName} />
                        ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
                                <UserIcon className="h-4 w-4 text-gray-500" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{firstName}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <button onClick={() => logout()} className="text-gray-400 hover:text-gray-900 transition-colors p-1" title="Log out">
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto reveal">
                <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8 lg:py-12">
                    {/* Header */}
                    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Preview Stack Control</h1>
                            <p className="text-gray-500 mt-1.5 text-balance">Manage your deployments, monitor live activity, and restore history.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex bg-gray-100/80 p-1 rounded-lg border border-gray-200/60 shadow-inner">
                                <button
                                    onClick={() => setFilterTarget('all')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterTarget === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilterTarget('active')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterTarget === 'active' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'}`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setFilterTarget('expired')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterTarget === 'expired' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'}`}
                                >
                                    Archived
                                </button>
                            </div>
                            <Link href="/upload" className="brand-button inline-flex items-center px-5 py-2.5">
                                <Plus className="h-4 w-4 mr-2 opacity-80" /> New Preview
                            </Link>
                        </div>
                    </header>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
                        <div className="glass-panel p-5 relative overflow-hidden">
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3 font-medium">
                                <div className="h-2 w-2 rounded-full bg-green-400"></div> Live Now
                            </div>
                            <div className="text-3xl font-semibold text-gray-900 tracking-tight">{stats.activeCount}</div>
                        </div>
                        <div className="glass-panel p-5 relative overflow-hidden">
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3 font-medium">
                                <Clock className="h-4 w-4 opacity-70" /> Expiring Soon
                            </div>
                            <div className="text-3xl font-semibold text-gray-900 tracking-tight">{stats.expiringSoon}</div>
                        </div>
                        <div className="glass-panel p-5 relative overflow-hidden">
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3 font-medium">
                                <Activity className="h-4 w-4 opacity-70" /> Total Previews
                            </div>
                            <div className="text-3xl font-semibold text-gray-900 tracking-tight">{stats.sorted.length}</div>
                        </div>
                    </div>

                    {/* Table / List */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 px-1">Inventory</h2>
                        <div className="glass-panel overflow-hidden border-[#E5E7EB]">
                            {stats.filtered.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 mb-4">
                                        <UploadCloud className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No previews found</h3>
                                    <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                                        Upload a zipped build and this dashboard will serve as your live command board.
                                    </p>
                                    <Link href="/upload" className="brand-button-soft inline-flex items-center px-4 py-2 text-sm mt-6">
                                        <Plus className="h-4 w-4 mr-2" /> Upload first preview
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto w-full pb-2">
                                    <table className="w-full text-left border-collapse whitespace-nowrap">
                                        <thead>
                                            <tr className="border-b border-[#E5E7EB] bg-gray-50/50 text-xs text-gray-500 uppercase font-medium tracking-wider">
                                                <th className="px-4 sm:px-6 py-4">Project</th>
                                                <th className="px-4 sm:px-6 py-4">Status</th>
                                                <th className="px-4 sm:px-6 py-4 hidden sm:table-cell">Route</th>
                                                <th className="px-4 sm:px-6 py-4 hidden md:table-cell">Expires</th>
                                                <th className="px-4 sm:px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E5E7EB]">
                                            {stats.filtered.map(project => {
                                                const isActive = project.status === 'active';
                                                const isDeleting = deletingId === project._id;
                                                const isVanishing = justDeletedIds.includes(project._id);

                                                return (
                                                    <tr
                                                        key={project._id}
                                                        className={`group transition-all duration-300 hover:bg-gray-50/80 ${isVanishing ? 'opacity-0 scale-[0.98]' : 'opacity-100'} ${isDeleting ? 'bg-red-50/30' : ''}`}
                                                    >
                                                        <td className="px-4 sm:px-6 py-4">
                                                            <div className="font-medium text-gray-900">{project.project_name}</div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {new Date(project.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                                {isActive ? 'Live' : 'Expired'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                                                            <div className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded inline-flex">
                                                                /p/{project.preview_url}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                                                            {isActive
                                                                ? formatDistanceToNow(new Date(project.expires_at), { addSuffix: true })
                                                                : `Expired ${formatDistanceToNow(new Date(project.expires_at), { addSuffix: true })}`
                                                            }
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                                {isActive && (
                                                                    <>
                                                                        <a
                                                                            href={`/p/${project.preview_url}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="p-2 text-gray-400 hover:text-gray-900 rounded-md hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm transition-all"
                                                                            title="Open preview"
                                                                        >
                                                                            <ExternalLink className="h-4 w-4" />
                                                                        </a>
                                                                        <button
                                                                            onClick={() => handleCopy(project._id, project.preview_url)}
                                                                            className={`p-2 rounded-md border transition-all ${copiedId === project._id ? 'bg-green-50 text-green-600 border-green-200' : 'text-gray-400 hover:text-gray-900 hover:bg-white border-transparent hover:border-gray-200 hover:shadow-sm'}`}
                                                                            title="Copy link"
                                                                        >
                                                                            {copiedId === project._id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDelete(project._id)}
                                                                    disabled={isDeleting}
                                                                    className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 border border-transparent hover:border-red-100 hover:shadow-sm transition-all ml-1"
                                                                    title="Delete preview"
                                                                >
                                                                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin text-red-500" /> : <Trash2 className="h-4 w-4" />}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* RIGHT ACTIVITY PANEL (Desktop) */}
            <aside className="w-80 bg-[#FAFAFA] border-l border-[#E5E7EB] flex-col hidden xl:flex shrink-0 transform-gpu translate-x-0">
                <div className="h-16 flex items-center px-6 border-b border-[#E5E7EB] bg-white sticky top-0 z-10">
                    <h2 className="font-semibold text-sm text-gray-900">Activity & History</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <RotateCcw className="h-4 w-4 text-gray-400" />
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Deleted Recently</h3>
                        </div>
                        <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">{deletedProjects.length}</span>
                    </div>

                    {deletedProjects.length === 0 ? (
                        <div className="text-center p-6 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                            <p className="text-sm text-gray-500">No recent deletions.</p>
                            <p className="text-xs text-gray-400 mt-1">Removed items stay here until they officially expire.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {deletedProjects.map(project => {
                                const isRestoring = restoringId === project._id;
                                const deletedAt = project.deleted_at ? new Date(project.deleted_at) : null;
                                const canRestore = project.status === 'active' && new Date(project.expires_at).getTime() > Date.now();

                                return (
                                    <article key={project._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="font-medium text-gray-900 truncate pr-2 h-5" title={project.project_name}>{project.project_name}</span>
                                            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full uppercase shrink-0">Removed</span>
                                        </div>
                                        <div className="text-xs text-gray-500 space-y-2 mb-4 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="text-gray-400">Route</span>
                                                <span className="font-mono truncate bg-white px-1 py-0.5 rounded border border-gray-100">/p/{project.preview_url}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">Deleted</span>
                                                <span>{deletedAt ? formatDistanceToNow(deletedAt, { addSuffix: true }) : 'recently'}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRestore(project._id)}
                                            disabled={!canRestore || isRestoring}
                                            className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${canRestore
                                                    ? 'bg-gray-900 text-white hover:bg-black shadow-sm'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                }`}
                                        >
                                            {isRestoring ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="mr-2 h-3.5 w-3.5 opacity-80" />}
                                            {isRestoring ? 'Restoring...' : 'Restore Preview'}
                                        </button>
                                        {!canRestore && (
                                            <p className="text-[10px] text-center text-gray-400 mt-2">Preview has expired completely.</p>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}
