"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, KeyRound, Loader2, Mail, ShieldCheck, Sparkles, User as UserIcon } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { normalizeEmail, validatePassword } from '@/lib/auth-shared';

type AuthTab = 'login' | 'signup';

export default function AuthPage() {
    const { user, loading, login, signup } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<AuthTab>('login');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [verificationToken, setVerificationToken] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && user) {
            const redirectTarget = window.localStorage.getItem('redirect_to_upload') ? '/upload' : '/dashboard';
            if (redirectTarget === '/upload') {
                window.localStorage.removeItem('redirect_to_upload');
            }

            router.replace(redirectTarget);
        }
    }, [loading, router, user]);

    const resetSignupFlow = () => {
        setOtp('');
        setOtpSent(false);
        setOtpVerified(false);
        setVerificationToken('');
    };

    const handleSendOtp = async () => {
        const email = normalizeEmail(signupEmail);
        const passwordError = validatePassword(signupPassword);

        if (!signupName.trim()) {
            setError('Name is required.');
            return;
        }

        if (!email) {
            setError('Email is required.');
            return;
        }

        if (passwordError) {
            setError(passwordError);
            return;
        }

        setSendingOtp(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json().catch(() => ({ error: 'Failed to send OTP.' }));

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send OTP.');
            }

            setOtpSent(true);
            setOtpVerified(false);
            setVerificationToken('');
            setSuccessMessage('Verification code sent. Check your inbox.');
        } catch (sendError) {
            setError(sendError instanceof Error ? sendError.message : 'Failed to send OTP.');
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        const email = normalizeEmail(signupEmail);

        if (!otp.trim()) {
            setError('Enter the OTP code from your email.');
            return;
        }

        setVerifyingOtp(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp }),
            });

            const data = await response.json().catch(() => ({ error: 'Failed to verify OTP.' }));

            if (!response.ok) {
                throw new Error(data.error || 'Failed to verify OTP.');
            }

            setOtpVerified(true);
            setVerificationToken(data.verificationToken);
            setSuccessMessage('Email verified. Finish creating your account.');
        } catch (verifyError) {
            setError(verifyError instanceof Error ? verifyError.message : 'Failed to verify OTP.');
        } finally {
            setVerifyingOtp(false);
        }
    };

    const handleCreateAccount = async () => {
        const email = normalizeEmail(signupEmail);
        const passwordError = validatePassword(signupPassword);

        if (!verificationToken || !otpVerified) {
            setError('Verify your OTP before creating an account.');
            return;
        }

        if (passwordError) {
            setError(passwordError);
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            await signup(email, signupPassword, signupName.trim(), verificationToken);
        } catch (signupError) {
            setError(signupError instanceof Error ? signupError.message : 'Failed to create account.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            await login(normalizeEmail(loginEmail), loginPassword);
        } catch (loginError) {
            setError(loginError instanceof Error ? loginError.message : 'Login failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] text-gray-900">
            <Navbar />

            <main className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.18),_transparent_34%),linear-gradient(160deg,_#f8fafc_0%,_#eef2ff_45%,_#fff7ed_100%)] px-4 py-10 sm:px-6 lg:px-8">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-16 top-20 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />
                    <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-slate-300/30 blur-3xl" />
                    <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-white/40 blur-3xl" />
                </div>

                <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                    {/*  */}

                    <section className="reveal rounded-[32px] border border-white bg-white/90 p-6 shadow-[0_20px_70px_rgba(148,163,184,0.15)] backdrop-blur-xl sm:p-10" style={{ '--delay': '120ms' } as React.CSSProperties}>
                        <div className="flex rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('login');
                                    setError(null);
                                    setSuccessMessage(null);
                                }}
                                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${activeTab === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                            >
                                Log in
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('signup');
                                    setError(null);
                                    setSuccessMessage(null);
                                }}
                                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${activeTab === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                            >
                                Sign up
                            </button>
                        </div>

                        {error && (
                            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" />
                                {successMessage}
                            </div>
                        )}

                        {activeTab === 'login' ? (
                            <form onSubmit={handleLogin} className="mt-6 space-y-5">
                                <label className="block">
                                    <span className="mb-2 block text-sm font-medium text-gray-700">Email</span>
                                    <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-4">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={loginEmail}
                                            onChange={(event) => setLoginEmail(event.target.value)}
                                            className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                        />
                                    </div>
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-medium text-gray-700">Password</span>
                                    <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-4">
                                        <KeyRound className="h-4 w-4 text-gray-400" />
                                        <input
                                            type="password"
                                            value={loginPassword}
                                            onChange={(event) => setLoginPassword(event.target.value)}
                                            className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
                                            placeholder="Enter your password"
                                            autoComplete="current-password"
                                        />
                                    </div>
                                </label>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
                                >
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log in'}
                                </button>
                            </form>
                        ) : (
                            <div className="mt-6 space-y-5">
                                <label className="block">
                                    <span className="mb-2 block text-sm font-medium text-gray-700">Name</span>
                                    <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-4">
                                        <UserIcon className="h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={signupName}
                                            onChange={(event) => setSignupName(event.target.value)}
                                            className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
                                            placeholder="Your name"
                                            autoComplete="name"
                                        />
                                    </div>
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-medium text-gray-700">Email</span>
                                    <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-4">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={signupEmail}
                                            onChange={(event) => {
                                                setSignupEmail(event.target.value);
                                                resetSignupFlow();
                                            }}
                                            className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                        />
                                    </div>
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-medium text-gray-700">Password</span>
                                    <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-4">
                                        <KeyRound className="h-4 w-4 text-gray-400" />
                                        <input
                                            type="password"
                                            value={signupPassword}
                                            onChange={(event) => {
                                                setSignupPassword(event.target.value);
                                                resetSignupFlow();
                                            }}
                                            className="w-full bg-transparent px-3 py-3.5 text-sm outline-none"
                                            placeholder="At least 8 chars, 1 uppercase, 1 number"
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </label>



                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={sendingOtp}
                                    className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-3.5 px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-60"
                                >
                                    {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send verification code'}
                                </button>

                                <div className={`overflow-hidden rounded-2xl border transition-all ${otpSent ? 'max-h-80 border-slate-200 bg-slate-50/80 p-5 opacity-100' : 'max-h-0 border-transparent p-0 opacity-0'}`}>
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        Enter the code from your inbox
                                    </div>
                                    <div className="mt-4 flex gap-3">
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm tracking-[0.3em] outline-none transition-all focus:border-slate-400 focus:ring-4 focus:ring-slate-400/10"
                                            placeholder="123456"
                                            inputMode="numeric"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleVerifyOtp}
                                            disabled={verifyingOtp || otpVerified}
                                            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                                        >
                                            {verifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : otpVerified ? 'Verified' : 'Verify'}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCreateAccount}
                                    disabled={submitting || !otpVerified}
                                    className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            Create account
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        <p className="mt-6 text-center text-sm text-gray-500">
                            Preview links remain temporary by design. <Link href="/" className="font-medium text-gray-700 underline-offset-4 hover:underline">Back to home</Link>
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
