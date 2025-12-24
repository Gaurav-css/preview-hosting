"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Layout, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar = () => {
    const { user, login, logout } = useAuth();

    return (
        <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="bg-blue-600 p-1.5 rounded-lg">
                                <Layout className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900 tracking-tight">PreviewHost</span>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                                    <div className="flex items-center space-x-2">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-gray-200" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                <UserIcon className="w-4 h-4 text-gray-500" />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => logout()}
                                        className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={() => login()}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105"
                            >
                                Login with Google
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};
