"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthUser } from '@/lib/auth-shared';

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string, verificationToken: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    signup: async () => { },
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function hydrateUser() {
            try {
                const response = await fetch('/api/auth/me', {
                    credentials: 'include',
                    cache: 'no-store',
                });

                if (!response.ok) {
                    setUser(null);
                    return;
                }

                const data = await response.json();
                setUser(data.user || null);
            } catch (error) {
                console.error("Session hydrate error", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        void hydrateUser();
    }, []);

    const login = async (email: string, password: string) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json().catch(() => ({ error: 'Login failed.' }));

        if (!response.ok) {
            throw new Error(data.error || 'Login failed.');
        }

        setUser(data.user || null);
    };

    const signup = async (email: string, password: string, name: string, verificationToken: string) => {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name, verificationToken }),
        });

        const data = await response.json().catch(() => ({ error: 'Failed to create account.' }));

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create account.');
        }

        setUser(data.user || null);
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
            setUser(null);
        } catch (error) {
            console.error("Logout Error", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
