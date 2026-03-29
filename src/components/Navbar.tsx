"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Layout, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar = () => {
    const { user, login, logout } = useAuth();
    const accountLabel = user?.displayName || user?.email || 'Dashboard';

    return (
        <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 shadow-sm">
                        <Layout className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold tracking-tight text-gray-900">PreviewHost</p>
                        <p className="text-[11px] uppercase tracking-widest text-gray-500 font-medium">Control Room</p>
                    </div>
                </Link>

                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <Link
                                href="/dashboard"
                                className="rounded-full border border-gray-200 bg-white px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900 flex items-center shadow-sm"
                            >
                                <span className="sm:inline hidden">Dashboard</span>
                                <span className="sm:hidden inline">Dash</span>
                            </Link>
                            <div className="hidden items-center gap-3 rounded-full border border-gray-200 bg-gray-50 px-2 py-1.5 sm:flex">
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName || 'User avatar'}
                                        className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                                    />
                                ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white">
                                        <UserIcon className="h-4 w-4 text-gray-400" />
                                    </div>
                                )}
                                <div className="max-w-[10rem] leading-tight pr-2">
                                    <p className="truncate text-sm font-medium text-gray-900">{accountLabel}</p>
                                    <p className="text-xs text-gray-500">Signed in</p>
                                </div>
                            </div>
                            <button
                                onClick={() => logout()}
                                className="brand-button-soft flex sm:inline-flex items-center justify-center rounded-full w-9 h-9 sm:w-auto sm:px-4 sm:py-2 text-sm font-medium"
                                title="Logout"
                            >
                                <LogOut className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => login()}
                            className="brand-button inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold"
                        >
                            Login with Google
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};
