
import React from 'react';
import { Lock, RotateCw, ChevronLeft, ChevronRight, ExternalLink, Maximize2 } from 'lucide-react';

interface BrowserWindowProps {
    url?: string;
    fullscreenUrl?: string;
    children: React.ReactNode;
    className?: string;
}

export function BrowserWindow({ url = "https://preview-hosting.vercel.app", fullscreenUrl, children, className = "" }: BrowserWindowProps) {
    return (
        <div className={`flex flex-col rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white ${className}`}>
            {/* Browser Toolbar */}
            <div className="bg-[#f3f4f6] border-b border-gray-200 px-4 py-3 flex items-center space-x-4 shrink-0">
                {/* Traffic Lights */}
                <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
                </div>

                {/* Navigation Controls */}
                <div className="flex space-x-2 text-gray-400">
                    <ChevronLeft className="w-4 h-4" />
                    <ChevronRight className="w-4 h-4" />
                    <RotateCw className="w-3.5 h-3.5 mt-[1px]" />
                </div>

                {/* Address Bar */}
                <div className="flex-1 max-w-2xl mx-auto">
                    <div className="bg-white border border-gray-200 rounded-md py-1 px-3 text-sm text-gray-600 flex items-center shadow-sm group">
                        <Lock className="w-3 h-3 text-gray-400 mr-2" />
                        <span className="truncate flex-1 font-mono text-xs">{url}</span>
                        {fullscreenUrl && (
                            <a
                                href={fullscreenUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Open fullscreen"
                            >
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                </div>

                {/* Actions - Fullscreen Button */}
                <div className="flex items-center space-x-1">
                    {fullscreenUrl && (
                        <a
                            href={fullscreenUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-md hover:bg-gray-200/50 flex items-center space-x-1"
                            title="View fullscreen"
                        >
                            <Maximize2 className="w-4 h-4" />
                            <span className="text-xs font-medium hidden sm:inline">Fullscreen</span>
                        </a>
                    )}
                </div>
            </div>


            {/* Content Area */}
            <div className="flex-1 relative bg-white overflow-hidden">
                <div className="absolute inset-0 w-full h-full">
                    {children}
                </div>
            </div>
        </div>
    );
}
