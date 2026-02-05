"use client";

import React, { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { BrowserWindow } from '@/components/BrowserWindow';
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

  const [latestProject, setLatestProject] = React.useState<any>(null);

  useEffect(() => {
    if (!user) {
      setLatestProject(null);
      return;
    }

    async function fetchLatestProject() {
      if (!user) return;
      try {
        const token = await user!.getIdToken();
        const res = await fetch('/api/projects', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          // Assuming API returns projects sorted by creation date, or we sort them here
          if (data.projects && data.projects.length > 0) {
            // Sor by created_at desc just in case
            const sorted = data.projects.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setLatestProject(sorted[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch projects", error);
      }
    }

    fetchLatestProject();
  }, [user]);

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
            <div className="mt-10 relative max-w-[95%] mx-auto px-2 sm:px-4">
              <div className="relative">
                {/* Decorative background blur behind the window */}
                <div className="absolute inset-0 bg-blue-100 blur-3xl opacity-20 transform scale-110" />

                <BrowserWindow
                  className="relative z-10 h-[80vh] transition-all duration-500 shadow-2xl"
                  url={latestProject ? `https://preview-hosting.vercel.app/p/${latestProject.preview_url}` : "https://preview-hosting.vercel.app/demo-project"}
                  fullscreenUrl={latestProject ? `/api/preview/${latestProject.preview_url}/${latestProject.entry_point || 'index.html'}` : undefined}
                >
                  {latestProject ? (
                    <iframe
                      src={`/api/preview/${latestProject.preview_url}/${latestProject.entry_point || 'index.html'}`}
                      className="w-full h-full border-0 bg-white"
                      sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
                      title="Latest Project Preview"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50 p-8">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <Zap className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Deploy?</h3>
                        <p className="text-gray-500 font-medium">Drag & drop your project zip file to see it live here.</p>
                      </div>
                    </div>
                  )}
                </BrowserWindow>
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
