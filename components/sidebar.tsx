"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Users, Settings, Shield, BarChart3, Bell, Banknote, LogOut, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-context";
import { ROLE_NAV, Role } from "@/lib/auth";

const ALL_NAV_ITEMS = [
    { href: "/",              label: "Dashboard",       icon: LayoutDashboard },
    { href: "/avizari",       label: "Avizări",         icon: Bell },
    { href: "/claims",        label: "Dosare Daună",    icon: FileText },
    { href: "/users",         label: "Dosare Regres",   icon: Users },
    { href: "/policies",      label: "Polițe",          icon: Shield },
    { href: "/reports",       label: "Rapoarte",        icon: BarChart3 },
    { href: "/financiar",     label: "Financiar",       icon: Banknote },
    { href: "/collaborators", label: "Colaboratori",    icon: Users },
    { href: "/settings",      label: "Setări",          icon: Settings },
];

const ROLE_BADGE: Record<Role, { label: string; color: string }> = {
    basic_user:  { label: 'Operator',  color: 'bg-blue-500/20 text-blue-200' },
    power_user:  { label: 'Lucrător',  color: 'bg-orange-400/20 text-orange-200' },
    super_user:  { label: 'Manager',   color: 'bg-purple-500/20 text-purple-200' },
};

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    // Filter nav items based on role
    const allowedHrefs = user ? ROLE_NAV[user.role] : [];
    const navItems = ALL_NAV_ITEMS.filter(item =>
        allowedHrefs.includes('*') || allowedHrefs.includes(item.href)
    );

    const badge = user ? ROLE_BADGE[user.role] : null;

    return (
        <div className="w-64 bg-gradient-to-b from-orange-500 to-orange-900 min-h-screen text-white flex flex-col shadow-2xl">
            {/* Logo */}
            <div className="p-6 border-b border-orange-400/30 flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain bg-white rounded-md p-0.5" />
                <span className="font-bold text-lg">Build'n Claims</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    let isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                    if (pathname?.toUpperCase().includes('-REGRES')) {
                        if (item.href === '/users') isActive = true;
                        if (item.href === '/claims') isActive = false;
                    } else if (pathname?.startsWith('/claims') && item.href === '/users') {
                        isActive = false;
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium",
                                isActive
                                    ? "bg-white text-orange-600 shadow-md"
                                    : "text-orange-100 hover:text-white hover:bg-orange-600/50"
                            )}
                            style={{ fontSize: '20px' }}
                        >
                            <item.icon className="w-6 h-6" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User info + Logout */}
            <div className="p-4 border-t border-orange-400/30">
                {user && (
                    <div className="mb-2">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                <UserCircle className="w-6 h-6 text-white/80" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold text-white truncate">
                                    {user.displayName}
                                </span>
                                {badge && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full w-fit mt-0.5 ${badge.color}`}>
                                        {badge.label}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-orange-200 hover:bg-red-500/20 hover:text-white transition-colors text-sm font-medium"
                >
                    <LogOut className="w-4 h-4" />
                    Deconectare
                </button>
            </div>
        </div>
    );
}
