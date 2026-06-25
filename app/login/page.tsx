"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { Shield, Eye, EyeOff, Lock, User, AlertCircle, ArrowRight } from "lucide-react";

const ROLES_INFO = [
    { role: 'basic_user',  label: 'Operator',  color: 'from-blue-500 to-blue-600',   username: 'basic' },
    { role: 'power_user',  label: 'Lucrător',  color: 'from-orange-500 to-orange-600', username: 'lucrator' },
    { role: 'super_user',  label: 'Manager',   color: 'from-purple-600 to-purple-700', username: 'manager' },
];

function LoginForm() {
    const { login, user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [username, setUsername] = useState('');
    const [pin, setPin] = useState(['', '', '', '']);
    const [showPin, setShowPin] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [shake, setShake] = useState(false);

    const pinRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
    ];

    // Redirect if already logged in
    useEffect(() => {
        if (!loading && user) {
            const from = searchParams.get('from') || getDefaultPage(user.role);
            router.replace(from);
        }
    }, [user, loading, router, searchParams]);

    function getDefaultPage(role: string) {
        if (role === 'basic_user') return '/avizari';
        if (role === 'power_user') return '/claims';
        return '/';
    }

    function selectRole(u: string) {
        setUsername(u);
        setError('');
        setPin(['', '', '', '']);
        setTimeout(() => pinRefs[0].current?.focus(), 50);
    }

    function handlePinChange(index: number, value: string) {
        if (!/^\d?$/.test(value)) return;
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);
        setError('');
        if (value && index < 3) {
            pinRefs[index + 1].current?.focus();
        }
    }

    function handlePinKeyDown(index: number, e: React.KeyboardEvent) {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            pinRefs[index - 1].current?.focus();
        }
        if (e.key === 'Enter') handleSubmit();
    }

    async function handleSubmit() {
        const pinStr = pin.join('');
        if (!username) { setError('Selectează tipul de utilizator.'); return; }
        if (pinStr.length !== 4) { setError('Introdu PIN-ul de 4 cifre.'); return; }

        setSubmitting(true);
        const { error: err } = await login(username, pinStr);
        setSubmitting(false);

        if (err) {
            setError(err);
            setShake(true);
            setPin(['', '', '', '']);
            pinRefs[0].current?.focus();
            setTimeout(() => setShake(false), 600);
        } else {
            const from = searchParams.get('from') || getDefaultPage(
                ROLES_INFO.find(r => r.username === username)?.role ?? ''
            );
            router.replace(from);
        }
    }

    if (loading) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900 flex items-center justify-center p-4">
            {/* Background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo + Title */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl shadow-2xl flex items-center justify-center">
                            <img src="/logo.png" alt="Logo" className="w-14 h-14 object-contain" onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }} />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1">Build'n Claims</h1>
                    <p className="text-orange-200/70 text-sm">Platformă Administrativă</p>
                </div>

                {/* Card */}
                <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl transition-all duration-200 ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>

                    {/* Step 1: Select user type */}
                    <div className="mb-6">
                        <p className="text-orange-100/60 text-xs uppercase tracking-widest font-semibold mb-3">
                            1. Selectează tipul de utilizator
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {ROLES_INFO.map((r) => (
                                <button
                                    key={r.role}
                                    onClick={() => selectRole(r.username)}
                                    className={`
                                        relative p-3 rounded-xl border-2 text-center transition-all duration-200 cursor-pointer
                                        ${username === r.username
                                            ? `bg-gradient-to-br ${r.color} border-transparent text-white shadow-lg scale-105`
                                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white hover:bg-white/10'
                                        }
                                    `}
                                >
                                    <User className={`w-5 h-5 mx-auto mb-1 ${username === r.username ? 'text-white' : 'text-white/40'}`} />
                                    <div className="text-xs font-semibold">{r.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: PIN */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-orange-100/60 text-xs uppercase tracking-widest font-semibold">
                                2. Introdu PIN-ul (4 cifre)
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowPin(!showPin)}
                                className="text-orange-200/40 hover:text-orange-200/70 transition-colors"
                            >
                                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        <div className="flex gap-3 justify-center">
                            {pin.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={pinRefs[i]}
                                    type={showPin ? 'text' : 'password'}
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    disabled={!username || submitting}
                                    onChange={(e) => handlePinChange(i, e.target.value)}
                                    onKeyDown={(e) => handlePinKeyDown(i, e)}
                                    className={`
                                        w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none
                                        transition-all duration-150 bg-white/10 text-white
                                        ${!username ? 'opacity-30 cursor-not-allowed border-white/10' : ''}
                                        ${digit ? 'border-orange-400 bg-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'border-white/20 hover:border-white/40 focus:border-orange-400'}
                                        disabled:cursor-not-allowed
                                    `}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={!username || pin.join('').length !== 4 || submitting}
                        className="
                            w-full py-3.5 rounded-xl font-semibold text-white
                            bg-gradient-to-r from-orange-500 to-orange-600
                            hover:from-orange-600 hover:to-orange-700
                            disabled:opacity-40 disabled:cursor-not-allowed
                            transition-all duration-200 shadow-lg hover:shadow-orange-500/30 hover:shadow-xl
                            flex items-center justify-center gap-2
                        "
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Lock className="w-4 h-4" />
                                Autentifică-te
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>

                <p className="text-center text-white/20 text-xs mt-6">
                    © {new Date().getFullYear()} Build'n Claims — By G.
                </p>
            </div>

        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}
