/**
 * Auth configuration — users, roles, permissions.
 * PINs are 4-digit strings stored here for simplicity.
 *
 * ROLES:
 *  basic_user  — Call center / operațiuni
 *  power_user  — Lucrători dosare
 *  super_user  — Manager (acces complet)
 */

export type Role = 'basic_user' | 'power_user' | 'super_user';

export interface AppUser {
    username: string;
    pin: string;
    role: Role;
    displayName: string;
}

/** Hardcoded user registry. Change PINs here as needed. */
export const USERS: AppUser[] = [
    { username: 'basic',  pin: '1111', role: 'basic_user',  displayName: 'Operator Call Center' },
    { username: 'lucrator', pin: '2222', role: 'power_user',  displayName: 'Lucrător Dosare' },
    { username: 'manager',  pin: '9999', role: 'super_user',  displayName: 'Manager' },
];

/** Session cookie name */
export const SESSION_COOKIE = 'auth_session';

/** Allowed routes per role — prefix matching */
export const ROLE_ROUTES: Record<Role, string[]> = {
    basic_user: ['/avizari', '/collaborators'],
    power_user: ['/avizari', '/claims', '/users'],
    super_user: ['*'], // all routes
};

/** Nav items each role can see */
export const ROLE_NAV: Record<Role, string[]> = {
    basic_user:  ['/avizari', '/collaborators'],
    power_user:  ['/avizari', '/claims', '/users'],
    super_user:  ['/', '/avizari', '/claims', '/users', '/policies', '/reports', '/financiar', '/collaborators', '/settings'],
};

/**
 * Returns true if the given role can access the given pathname.
 */
export function canAccess(role: Role, pathname: string): boolean {
    if (role === 'super_user') return true;
    const allowed = ROLE_ROUTES[role];
    return allowed.some(prefix => pathname.startsWith(prefix));
}

/**
 * Returns true if the given role can perform a write action
 * in the given section.
 */
export function canWrite(role: Role, section: 'avizari' | 'collaborators' | 'claims' | 'regres' | 'all'): boolean {
    if (role === 'super_user') return true;
    if (role === 'power_user') {
        return ['avizari', 'claims', 'regres'].includes(section);
    }
    if (role === 'basic_user') {
        // basic_user can create avizari but NOT edit/delete them
        return ['collaborators'].includes(section);
    }
    return false;
}
