"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, ArrowRight, Loader2, Shield, Sparkles, Upload, Zap } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { BrowserWindow } from '@/components/BrowserWindow';
import { useAuth } from '@/lib/auth-context';

interface Project {
  created_at: string;
  preview_url: string;
  entry_point?: string;
}

export default function LandingPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  const [latestProject, setLatestProject] = React.useState<Project | null>(null);

  const handleStartUploading = async () => {
    if (user) {
      router.push('/upload');
      return;
    }

    window.localStorage.setItem('redirect_to_upload', 'true');

    try {
      await login();
    } catch (error) {
      console.error('Login trigger failed', error);
    }
  };

  useEffect(() => {
    if (user && window.localStorage.getItem('redirect_to_upload')) {
      window.localStorage.removeItem('redirect_to_upload');
      router.push('/upload');
    }
  }, [router, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    async function fetchLatestProject() {
      const currentUser = user;
      if (!currentUser) {
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        const res = await fetch('/api/projects', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        if (data.projects && data.projects.length > 0) {
          const sorted = data.projects.sort(
            (a: Project, b: Project) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          );
          setLatestProject(sorted[0]);
        }
      } catch (error) {
        console.error('Failed to fetch projects', error);
      }
    }

    void fetchLatestProject();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-gray-900">
      <Navbar />

      <main className="relative isolate overflow-hidden">
        <section className="relative px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pt-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="reveal">
                <div className="brand-badge inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-gray-600 bg-white border border-gray-200">
                  <Sparkles className="h-3.5 w-3.5 text-gray-500" />
                  Preview hosting rebuilt
                </div>
                <h1 className="mt-8 max-w-3xl text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
                  Ship a frontend preview that looks ready before the client even clicks it.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
                  Upload your static site, get a secure public URL instantly, and manage active links from a cleaner, sharper dashboard built for demos and feedback loops.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleStartUploading}
                    className="brand-button inline-flex items-center justify-center px-7 py-3.5 text-base shadow-md"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Start uploading
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </button>
                  <Link
                    href={user ? '/dashboard' : '#features'}
                    className="brand-button-soft inline-flex items-center justify-center px-7 py-3.5 text-base shadow-sm"
                  >
                    {user ? 'Open dashboard' : 'See what changes'}
                  </Link>
                </div>
                <div className="mt-12 grid gap-4 sm:grid-cols-3">
                  <div className="glass-panel p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Instant share</p>
                    <p className="mt-2 text-sm leading-6 text-gray-600 font-medium">Turn a local zip into a public link in one step.</p>
                  </div>
                  <div className="glass-panel p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Crisp Interface</p>
                    <p className="mt-2 text-sm leading-6 text-gray-600 font-medium">The product now leans into a modern clean palette.</p>
                  </div>
                  <div className="glass-panel p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">24-hour lifecycle</p>
                    <p className="mt-2 text-sm leading-6 text-gray-600 font-medium">Temporary by design, keeping environments clean.</p>
                  </div>
                </div>
              </div>

              <div className="reveal hidden lg:block" style={{ '--delay': '120ms' } as React.CSSProperties}>
                <div className="relative">
                  <BrowserWindow
                    className="relative z-10 h-[70vh] min-h-[30rem] shadow-2xl rounded-xl overflow-hidden border border-gray-200 bg-white"
                    url={latestProject ? `/p/${latestProject.preview_url}` : '/demo-project'}
                    fullscreenUrl={latestProject ? `/api/preview/${latestProject.preview_url}/${latestProject.entry_point || 'index.html'}` : undefined}
                  >
                    {latestProject ? (
                      <iframe
                        src={`/api/preview/${latestProject.preview_url}/${latestProject.entry_point || 'index.html'}`}
                        className="h-full w-full border-0 bg-white"
                        sandbox="allow-scripts allow-forms allow-popups allow-modals"
                        title="Latest Project Preview"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gray-50/50 p-8 text-center border-t border-gray-100">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-200 mb-6">
                          <Upload className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold tracking-tight text-gray-900">Your latest preview appears here</h3>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                          Upload a zip file and this browser window becomes the first thing you can hand to a teammate or client.
                        </p>
                      </div>
                    )}
                  </BrowserWindow>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="relative px-4 pb-24 pt-10 sm:px-6 lg:px-8 border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 reveal text-center" style={{ '--delay': '160ms' } as React.CSSProperties}>
              <p className="text-xs uppercase tracking-widest font-semibold text-gray-400">Why it works</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Purpose-built for review links, not generic hosting.
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="glass-panel reveal p-8 hover:shadow-md transition-shadow" style={{ '--delay': '220ms' } as React.CSSProperties}>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white mb-6 shadow-sm">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-gray-900">Secure by default</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Previews are isolated and intended for safe external review without exposing the rest of your environment.
                </p>
              </div>
              <div className="glass-panel reveal p-8 hover:shadow-md transition-shadow" style={{ '--delay': '300ms' } as React.CSSProperties}>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white mb-6 shadow-sm">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-gray-900">Short-lived and clean</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Links self-expire after 24 hours, which keeps the environment lean and makes the dashboard easier to trust.
                </p>
              </div>
              <div className="glass-panel reveal p-8 hover:shadow-md transition-shadow" style={{ '--delay': '380ms' } as React.CSSProperties}>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white mb-6 shadow-sm">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-gray-900">Zero-config delivery</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Package your static files, upload once, and share the result immediately without a CLI workflow.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 font-medium sm:px-6 lg:px-8">
        &copy; {new Date().getFullYear()} PreviewHost. Temporary links for fast-moving teams.
      </footer>
    </div>
  );
}
