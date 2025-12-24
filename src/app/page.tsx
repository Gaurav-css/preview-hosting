"use client";

import React, { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Zap, Shield, Clock, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();

  const handleStartUploading = async () => {
    if (user) {
      router.push('/upload');
    } else {
      // Set a flag to redirect after login
      window.localStorage.setItem('redirect_to_upload', 'true');
      try {
        await login();
      } catch (error) {
        console.error("Login trigger failed", error);
      }
    }
  };

  useEffect(() => {
    if (user && window.localStorage.getItem('redirect_to_upload')) {
      window.localStorage.removeItem('redirect_to_upload');
      router.push('/upload');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-50 rounded-full blur-3xl opacity-50" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6">
                <Zap className="w-4 h-4 mr-2" />
                <span>Instant Frontend Previews</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-8">
                Localhost, meet the <span className="text-blue-600">Public Web.</span>
              </h1>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                Upload your HTML, CSS, and JS. Get a secure, shareable link instantly.
                Perfect for feedback, testing, and demos. No CLI needed.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handleStartUploading}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-2xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform hover:scale-105"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Start Uploading
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </button>
                <button
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border border-gray-200 text-lg font-medium rounded-2xl text-gray-700 bg-white hover:bg-gray-50 transition-all"
                >
                  View Examples
                </button>
              </div>
            </div>

            {/* Mockup / Preview Area */}
            <div className="mt-20 relative max-w-5xl mx-auto">
              <div className="rounded-3xl border border-gray-200 bg-white shadow-2xl overflow-hidden aspect-[16/9] flex flex-col">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center space-x-2">
                  <div className="flex space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 max-w-md mx-auto h-6 bg-white rounded-md border border-gray-200 flex items-center px-3">
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-blue-500 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center bg-gray-50/50">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-10 h-10 text-blue-600" />
                    </div>
                    <p className="text-gray-500 font-medium">Your preview appears here instantly</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Secure & Isolated</h3>
                <p className="text-gray-600">
                  Previews are served in a secure sandbox, ensuring they can't access your data or compromise other users.
                </p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Temporary by Default</h3>
                <p className="text-gray-600">
                  Links automatically expire after 24 hours. We handle the cleanup, keeping your workspace fast and efficient.
                </p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Zero Config</h3>
                <p className="text-gray-600">
                  Just drag and drop your folder or zip file. We detect your entry point and serve it immediately.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} PreviewHost. Built for developers who move fast.
          </p>
        </div>
      </footer>
    </div>
  );
}
