"use client";

import React, { useCallback, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Upload, File, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export default function UploadPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Only accept one file (zip)
        if (acceptedFiles.length > 0) {
            const selectedFile = acceptedFiles[0];
            if (selectedFile.type === 'application/zip' || selectedFile.type === 'application/x-zip-compressed' || selectedFile.name.endsWith('.zip')) {
                setFile(selectedFile);
                setError(null);
            } else {
                setError("Please upload a .zip file only.");
            }
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: {
            'application/zip': ['.zip']
        }
    });

    const handleUpload = async () => {
        if (!file || !user) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Upload failed');
            }

            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            setError(err.message || "An error occurred during upload.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Upload Project</h1>
                    <p className="text-gray-500 mt-2">Upload a .zip file containing your static website (index.html is required).</p>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
                    {!file ? (
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                        >
                            <input {...getInputProps()} />
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <Upload className="w-8 h-8 text-blue-600" />
                            </div>
                            <p className="text-lg font-medium text-gray-900 mb-1">
                                {isDragActive ? "Drop the zip file here" : "Drag & drop your zip file"}
                            </p>
                            <p className="text-gray-500 text-sm">or click to select file</p>
                            <div className="mt-6 flex items-center text-xs text-gray-400">
                                <span className="bg-gray-100 px-2 py-1 rounded">.ZIP only</span>
                                <span className="mx-2">•</span>
                                <span>Max 50MB</span>
                            </div>
                        </div>
                    ) : (
                        <div className="border border-gray-200 rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <File className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{file.name}</p>
                                        <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    disabled={uploading}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    {error}
                                </div>
                            )}

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all ${uploading ? 'opacity-70 cursor-not-allowed' : ''
                                        }`}
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            Deploy Project
                                            <Upload className="w-5 h-5 ml-2" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center text-sm text-gray-400">
                    <p>Your project will be live for 24 hours.</p>
                </div>
            </main>
        </div>
    );
}
