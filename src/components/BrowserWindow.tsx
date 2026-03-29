"use client";

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Lock, Maximize2, RotateCw } from 'lucide-react';

interface BrowserWindowProps {
    url?: string;
    fullscreenUrl?: string;
    children: React.ReactNode;
    className?: string;
}

export function BrowserWindow({
    url = 'https://preview-hosting.vercel.app',
    fullscreenUrl,
    children,
    className = '',
}: BrowserWindowProps) {
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const displayUrl = url.startsWith('/') && origin ? `${origin}${url}` : url;

    return (
        <div className={`flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg ${className}`}>
            <div className="flex shrink-0 items-center space-x-4 border-b border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex space-x-2">
                    <div className="h-3 w-3 rounded-full border border-gray-200 bg-[#ff5f56]" />
                    <div className="h-3 w-3 rounded-full border border-gray-200 bg-[#ffbd2e]" />
                    <div className="h-3 w-3 rounded-full border border-gray-200 bg-[#27c93f]" />
                </div>

                <div className="flex space-x-2 text-gray-400">
                    <ChevronLeft className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4" />
                    <RotateCw className="mt-[1px] h-3.5 w-3.5" />
                </div>

                <div className="mx-auto flex-1 max-w-2xl">
                    <div className="group flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[13px] text-gray-700 shadow-sm">
                        <Lock className="mr-2 h-3 w-3 text-gray-400" />
                        <span className="flex-1 truncate font-mono text-[11px] text-gray-500">{displayUrl}</span>
                        {fullscreenUrl && (
                            <a
                                href={fullscreenUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-gray-400 opacity-0 transition hover:text-gray-900 group-hover:opacity-100"
                                title="Open fullscreen"
                            >
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-1">
                    {fullscreenUrl && (
                        <a
                            href={fullscreenUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 rounded-lg px-2 py-1 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900"
                            title="View fullscreen"
                        >
                            <Maximize2 className="h-4 w-4" />
                            <span className="hidden text-xs font-medium sm:inline">Fullscreen</span>
                        </a>
                    )}
                </div>
            </div>

            <div className="relative flex-1 overflow-hidden bg-white">
                <div className="absolute inset-0 h-full w-full">{children}</div>
            </div>
        </div>
    );
}
