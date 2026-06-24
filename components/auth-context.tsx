"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/lib/auth";

export interface AuthUser {
    username: string;
    displayName: string;
    role: Role;
}

interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    login: (username: string, pin: string) => Promise<{ error?: string }>;
    logout: () => Promise<void>;
    /** Returns true if current user can access the given section */
    can: (action: 'access' | 'write', section: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const WRITE_PERMS: Record<Role, string[]> = {
    basic_user:  ['collaborators'],           // can add/edit collaborators
    power_user:  ['avizari', 'claims', 'regres', 'collaborators'],
    super_user:  ['*'],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Hydrate user from session on mount
    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.ok ? r.json() : { user: null })
            .then(data => setUser(data.user ?? null))
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(async (username: string, pin: string): Promise<{ error?: string }> => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, pin }),
        });
        const data = await res.json();
        if (!res.ok) return { error: data.error ?? 'Eroare la autentificare.' };
        setUser(data);
        return {};
    }, []);

    const logout = useCallback(async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        router.push('/login');
    }, [router]);

    const can = useCallback((action: 'access' | 'write', section: string): boolean => {
        if (!user) return false;
        if (user.role === 'super_user') return true;

        if (action === 'access') {
            // basic_user can access avizari and collaborators
            // power_user can access avizari, claims, regres
            const accessMap: Record<Role, string[]> = {
                basic_user:  ['avizari', 'collaborators'],
                power_user:  ['avizari', 'claims', 'regres', 'users'],
                super_user:  ['*'],
            };
            const allowed = accessMap[user.role] ?? [];
            return allowed.includes(section) || allowed.includes('*');
        }

        if (action === 'write') {
            const allowed = WRITE_PERMS[user.role] ?? [];
            return allowed.includes(section) || allowed.includes('*');
        }

        return false;
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, can }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
