"use client";

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { AlertCircle, CheckCircle, File, Loader2, Upload, X } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';

export default function UploadPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) {
            return;
        }

        const selectedFile = acceptedFiles[0];
        const isZipFile =
            selectedFile.type === 'application/zip' ||
            selectedFile.type === 'application/x-zip-compressed' ||
            selectedFile.name.endsWith('.zip');

        if (!isZipFile) {
            setError('Please upload a .zip file only.');
            return;
        }

        setFile(selectedFile);
        setError(null);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: {
            'application/zip': ['.zip'],
        },
    });

    const handleUpload = async () => {
        if (!file || !user) {
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Upload failed');
            }

            // Let's redirect to dashboard
            router.push('/dashboard');
        } catch (uploadError) {
            console.error(uploadError);
            setError(uploadError instanceof Error ? uploadError.message : 'An error occurred during upload.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] text-gray-900">
            <Navbar />

            <div className="relative isolate overflow-hidden">
                <main className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
                    <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
                        <section className="glass-panel reveal p-8 sm:p-10 shadow-sm">
                            <div className="brand-badge inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200">
                                <Upload className="h-3.5 w-3.5" />
                                New deployment
                            </div>
                            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                                Upload a zipped static site and publish it fast.
                            </h1>
                            <p className="mt-4 max-w-2xl text-base leading-8 text-gray-500">
                                Drop in your build output, keep the entry point clean, and this workspace handles the shareable preview URL.
                            </p>

                            {!file ? (
                                <div
                                    {...getRootProps()}
                                    className={`mt-10 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all cursor-pointer sm:px-10 ${
                                        isDragActive
                                            ? 'border-blue-400 bg-blue-50'
                                            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                                    }`}
                                >
                                    <input {...getInputProps()} />
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
                                        <Upload className={`h-8 w-8 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                                    </div>
                                    <p className="mt-6 text-xl font-semibold tracking-tight text-gray-900">
                                        {isDragActive ? 'Drop the zip file here' : 'Drag and drop your zip file'}
                                    </p>
                                    <p className="mt-2 text-sm text-gray-500">or click to browse from disk</p>
                                    <div className="mt-6 inline-flex items-center rounded-full bg-white border border-gray-200 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-500 shadow-sm">
                                        .zip only • max 50MB
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm">
                                                <File className="h-6 w-6 text-gray-700" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold tracking-tight text-gray-900">{file.name}</p>
                                                <p className="text-sm font-medium text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                            className="brand-button-soft inline-flex h-10 items-center justify-center px-4 text-sm bg-white"
                                            disabled={uploading}
                                        >
                                            <X className="mr-2 h-4 w-4 text-gray-400" />
                                            Remove
                                        </button>
                                    </div>

                                    {error && (
                                        <div className="mb-6 flex items-center rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                            <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-4 border-t border-gray-200">
                                        <button
                                            onClick={handleUpload}
                                            disabled={uploading}
                                            className={`brand-button inline-flex items-center px-6 py-3 text-sm sm:text-base ${
                                                uploading ? 'cursor-not-allowed opacity-70' : ''
                                            }`}
                                        >
                                            {uploading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    Deploy preview
                                                    <Upload className="ml-2 h-5 w-5 opacity-80" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>

                        <aside className="glass-panel reveal p-8 sm:p-10 shadow-sm" style={{ '--delay': '120ms' } as React.CSSProperties}>
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Release notes</p>
                            <h2 className="mt-3 text-xl font-bold tracking-tight text-gray-900">What makes a clean upload</h2>
                            <div className="mt-8 space-y-3">
                                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <p className="text-sm font-medium text-gray-700">Include `index.html` at the project root</p>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <p className="text-sm font-medium text-gray-700">Bundle all linked assets into the zip</p>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <p className="text-sm font-medium text-gray-700">Expect the link to rotate out after 24 hours</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Temporary hosting</p>
                                <p className="mt-2 text-sm leading-6 text-gray-600">
                                    This tool is optimized for demos, client feedback, and fast internal reviews. It is not a permanent hosting layer.
                                </p>
                            </div>
                        </aside>
                    </div>
                </main>
            </div>
        </div>
    );
}
