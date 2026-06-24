import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Claim, Policy, UserProfile, Request, Collaborator, Message, Avizare } from "@/types";
import { SEED_DATA } from "@/lib/mock-data";
import { createLogger } from "@/lib/logger";

const log = createLogger('DB');

// In production (Railway), DB_PATH env var points to the persistent volume.
// In development, it defaults to the project root.
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'database.db');
const JSON_PATH = path.join(process.cwd(), 'db.json');


// ─────────────────────────────────────────────
// Database initialization & schema
// ─────────────────────────────────────────────

let _db: Database.Database | null = null;

function getDb(): Database.Database {
    if (_db) return _db;

    _db = new Database(DB_PATH);

    // Enable WAL mode for better concurrent read performance
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');

    // Create tables if they don't exist
    _db.exec(`
        CREATE TABLE IF NOT EXISTS policies (
            id TEXT PRIMARY KEY,
            holder TEXT NOT NULL,
            type TEXT NOT NULL,
            address TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Active',
            expiry TEXT NOT NULL,
            cnp TEXT,
            phone TEXT,
            email TEXT,
            startDate TEXT,
            insuredLocations TEXT,
            details TEXT
        );

        CREATE TABLE IF NOT EXISTS claims (
            id TEXT PRIMARY KEY,
            policyId TEXT NOT NULL,
            holderName TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'Deschis',
            submittedAt TEXT NOT NULL,
            type TEXT,
            hasRegress INTEGER DEFAULT 0,
            location TEXT,
            cause TEXT,
            witnesses TEXT,
            email TEXT,
            files TEXT,
            history TEXT,
            payments TEXT,
            reserve TEXT,
            regress TEXT,
            details TEXT
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claimId TEXT NOT NULL,
            text TEXT NOT NULL,
            sender TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            read INTEGER DEFAULT 0,
            attachment TEXT
        );

        CREATE TABLE IF NOT EXISTS requests (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            address TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pending',
            coverage REAL,
            details TEXT
        );

        CREATE TABLE IF NOT EXISTS collaborators (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            companyName TEXT,
            type TEXT,
            specialty TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,
            region TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            createdAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS avizari (
            id TEXT PRIMARY KEY,
            policyId TEXT NOT NULL,
            holderName TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT,
            description TEXT,
            status TEXT DEFAULT 'Nou',
            createdAt TEXT NOT NULL,
            dataAvizare TEXT,
            claimId TEXT
        );

        CREATE TABLE IF NOT EXISTS user_profile (
            id INTEGER PRIMARY KEY DEFAULT 1,
            name TEXT,
            avatar TEXT,
            address TEXT,
            cnp TEXT,
            phone TEXT,
            city TEXT,
            county TEXT
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_claims_policyId ON claims(policyId);
        CREATE INDEX IF NOT EXISTS idx_messages_claimId ON messages(claimId);
    `);

    // Migrate from db.json if this is the first run
    migrateFromJson(_db);

    // Seed with default data if tables are empty
    seedIfEmpty(_db);

    return _db;
}

// ─────────────────────────────────────────────
// Migration from db.json
// ─────────────────────────────────────────────

function migrateFromJson(db: Database.Database): void {
    // Check if migration already done
    const alreadyMigrated = db.prepare("SELECT COUNT(*) as count FROM settings WHERE key = 'migrated_from_json'").get() as { count: number };
    if (alreadyMigrated.count > 0) return;

    if (!fs.existsSync(JSON_PATH)) {
        log.info('No db.json found, skipping migration.');
        return;
    }

    log.info('Starting migration from db.json to SQLite...');

    try {
        const raw = fs.readFileSync(JSON_PATH, 'utf-8');
        const data = JSON.parse(raw);

        const migrate = db.transaction(() => {
            // Migrate policies
            const insertPolicy = db.prepare(`
                INSERT OR IGNORE INTO policies (id, holder, type, address, status, expiry, cnp, phone, email, startDate, insuredLocations, details)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            for (const p of (data.policies || [])) {
                insertPolicy.run(
                    p.id, p.holder, p.type, p.address,
                    p.status || 'Active', p.expiry,
                    p.cnp || null, p.phone || null, p.email || null,
                    p.startDate || null,
                    p.insuredLocations ? JSON.stringify(p.insuredLocations) : null,
                    p.details ? JSON.stringify(p.details) : null
                );
            }
            log.info(`Migrated ${(data.policies || []).length} policies.`);

            // Migrate claims
            const insertClaim = db.prepare(`
                INSERT OR IGNORE INTO claims (id, policyId, holderName, date, time, description, status, submittedAt, type, hasRegress, location, cause, witnesses, email, files, history, payments, reserve, regress, details)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            for (const c of (data.claims || [])) {
                // Handle legacy payment → payments migration
                let payments = c.payments;
                if (!payments && c.payment) payments = [c.payment];

                insertClaim.run(
                    c.id, c.policyId, c.holderName, c.date,
                    c.time || null, c.description || null,
                    c.status || 'Deschis', c.submittedAt || new Date().toISOString(),
                    c.type || null, c.hasRegress ? 1 : 0,
                    c.location || null, c.cause || null,
                    c.witnesses || null, c.email || null,
                    c.files ? JSON.stringify(c.files) : null,
                    c.history ? JSON.stringify(c.history) : null,
                    payments ? JSON.stringify(payments) : null,
                    c.reserve ? JSON.stringify(c.reserve) : null,
                    c.regress ? JSON.stringify(c.regress) : null,
                    c.details ? JSON.stringify(c.details) : null
                );
            }
            log.info(`Migrated ${(data.claims || []).length} claims.`);

            // Migrate messages
            const insertMsg = db.prepare(`
                INSERT OR IGNORE INTO messages (claimId, text, sender, timestamp, read, attachment)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            const messages = Array.isArray(data.messages) ? data.messages :
                Object.entries(data.messages || {}).flatMap(([cid, msgs]) =>
                    (msgs as any[]).map(m => ({ ...m, claimId: cid }))
                );
            for (const m of messages) {
                insertMsg.run(
                    m.claimId, m.text, m.sender,
                    m.timestamp || new Date().toISOString(),
                    m.read ? 1 : 0,
                    m.attachment ? JSON.stringify(m.attachment) : null
                );
            }
            log.info(`Migrated ${messages.length} messages.`);

            // Migrate requests
            const insertReq = db.prepare(`
                INSERT OR IGNORE INTO requests (id, name, type, address, timestamp, status, coverage, details)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            for (const r of (data.requests || [])) {
                insertReq.run(
                    r.id, r.name, r.type, r.address,
                    r.timestamp || new Date().toISOString(),
                    r.status || 'Pending',
                    r.coverage || null, r.details || null
                );
            }
            log.info(`Migrated ${(data.requests || []).length} requests.`);

            // Migrate collaborators
            const insertCollab = db.prepare(`
                INSERT OR IGNORE INTO collaborators (id, name, companyName, type, specialty, phone, email, region, status, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            for (const c of (data.collaborators || [])) {
                insertCollab.run(
                    c.id, c.name, c.companyName || null, c.type || null,
                    c.specialty, c.phone, c.email, c.region,
                    c.status || 'active', c.createdAt || new Date().toISOString()
                );
            }
            log.info(`Migrated ${(data.collaborators || []).length} collaborators.`);

            // Migrate avizari
            const insertAviz = db.prepare(`
                INSERT OR IGNORE INTO avizari (id, policyId, holderName, date, time, description, status, createdAt, dataAvizare, claimId)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            for (const a of (data.avizari || [])) {
                insertAviz.run(
                    a.id, a.policyId, a.holderName, a.date,
                    a.time || null, a.description || null,
                    a.status || 'Nou', a.createdAt || new Date().toISOString(),
                    a.dataAvizare || null, a.claimId || null
                );
            }
            log.info(`Migrated ${(data.avizari || []).length} avizari.`);

            // Migrate user profile
            if (data.userProfile) {
                const up = data.userProfile;
                db.prepare(`
                    INSERT OR REPLACE INTO user_profile (id, name, avatar, address, cnp, phone, city, county)
                    VALUES (1, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    up.name || null, up.avatar || null, up.address || null,
                    up.cnp || null, up.phone || null, up.city || null, up.county || null
                );
                log.info('Migrated user profile.');
            }

            // Migrate settings
            if (data.settings) {
                const insertSetting = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
                for (const [k, v] of Object.entries(data.settings)) {
                    insertSetting.run(k, typeof v === 'string' ? v : JSON.stringify(v));
                }
                log.info(`Migrated ${Object.keys(data.settings).length} settings.`);
            }

            // Mark migration as done
            db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('migrated_from_json', 'true')`).run();
        });

        migrate();

        // Rename db.json to db.json.migrated as backup
        fs.renameSync(JSON_PATH, JSON_PATH + '.migrated');
        log.info('Migration complete! db.json renamed to db.json.migrated (backup).');

    } catch (e) {
        log.error('Migration failed: ' + (e as Error).message);
    }
}

// ─────────────────────────────────────────────
// Seed default data if empty
// ─────────────────────────────────────────────

function seedIfEmpty(db: Database.Database): void {
    const policyCount = (db.prepare('SELECT COUNT(*) as count FROM policies').get() as { count: number }).count;
    if (policyCount > 0) return;

    log.info('Seeding database with default data...');
    const insert = db.prepare(`
        INSERT OR IGNORE INTO policies (id, holder, type, address, status, expiry)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const p of SEED_DATA.policies) {
        insert.run(p.id, p.holder, p.type, p.address, p.status, p.expiry);
    }

    // Default settings
    const defaultSettings = {
        companyName: "Build'n Claims",
        defaultReserveMaterials: "3000",
        defaultReserveContractor: "500",
        notificationsEnabled: "true",
        autoBackup: "true",
        geminiApiKey: "",
        policyConditions: ""
    };
    const insertSetting = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`);
    for (const [k, v] of Object.entries(defaultSettings)) {
        insertSetting.run(k, v);
    }
}

// ─────────────────────────────────────────────
// Helper: deserialize a claim row from SQLite
// ─────────────────────────────────────────────

function rowToClaim(row: any): Claim {
    if (!row) return row;
    return {
        ...row,
        hasRegress: row.hasRegress === 1,
        files: row.files ? JSON.parse(row.files) : undefined,
        history: row.history ? JSON.parse(row.history) : undefined,
        payments: row.payments ? JSON.parse(row.payments) : undefined,
        reserve: row.reserve ? JSON.parse(row.reserve) : undefined,
        regress: row.regress ? JSON.parse(row.regress) : undefined,
        details: row.details ? JSON.parse(row.details) : undefined,
    };
}

function rowToPolicy(row: any): Policy {
    if (!row) return row;
    return {
        ...row,
        insuredLocations: row.insuredLocations ? JSON.parse(row.insuredLocations) : undefined,
        details: row.details ? JSON.parse(row.details) : undefined,
    };
}

function rowToMessage(row: any): Message {
    if (!row) return row;
    return {
        ...row,
        id: String(row.id),
        read: row.read === 1,
        attachment: row.attachment ? JSON.parse(row.attachment) : undefined,
    };
}

// ─────────────────────────────────────────────
// Policies
// ─────────────────────────────────────────────

/**
 * Scans all policies and updates status to 'Expired' in the DB
 * for any policy whose expiry date is in the past.
 * Called automatically on every getPolicies() read — zero extra cost.
 */
function syncPolicyStatuses(db: Database.Database): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // compare at start of today
    const todayStr = today.toISOString().split('T')[0]; // "YYYY-MM-DD"

    // Bulk update: set Expired for all policies whose expiry < today AND status != 'Expired'
    const result = db.prepare(`
        UPDATE policies
        SET status = 'Expired'
        WHERE status != 'Expired'
          AND status != 'Pending'
          AND expiry IS NOT NULL
          AND expiry != ''
          AND expiry < ?
    `).run(todayStr);

    if (result.changes > 0) {
        log.info(`syncPolicyStatuses: marked ${result.changes} polic${result.changes === 1 ? 'y' : 'ies'} as Expired.`);
    }
}

export function getPolicies(): Policy[] {
    const db = getDb();
    syncPolicyStatuses(db); // auto-sync expiry before every read
    const rows = db.prepare('SELECT * FROM policies').all();
    return rows.map(rowToPolicy);
}

export function addPolicy(policy: Policy): Policy {
    const db = getDb();
    db.prepare(`
        INSERT INTO policies (id, holder, type, address, status, expiry, cnp, phone, email, startDate, insuredLocations, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        policy.id, policy.holder, policy.type, policy.address,
        policy.status || 'Active', policy.expiry,
        policy.cnp || null, policy.phone || null, policy.email || null,
        policy.startDate || null,
        policy.insuredLocations ? JSON.stringify(policy.insuredLocations) : null,
        policy.details ? JSON.stringify(policy.details) : null
    );
    return policy;
}

export function updatePolicy(policyId: string, updates: Partial<Policy>): Policy | null {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM policies WHERE id = ?').get(policyId) as any;
    if (!existing) return null;

    const merged = { ...rowToPolicy(existing), ...updates };
    db.prepare(`
        UPDATE policies SET holder=?, type=?, address=?, status=?, expiry=?, cnp=?, phone=?, email=?, startDate=?, insuredLocations=?, details=?
        WHERE id=?
    `).run(
        merged.holder, merged.type, merged.address, merged.status, merged.expiry,
        merged.cnp || null, merged.phone || null, merged.email || null, merged.startDate || null,
        merged.insuredLocations ? JSON.stringify(merged.insuredLocations) : null,
        merged.details ? JSON.stringify(merged.details) : null,
        policyId
    );
    return merged;
}

export function deletePolicy(policyId: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM policies WHERE id = ?').run(policyId);
    return result.changes > 0;
}

// ─────────────────────────────────────────────
// Claims
// ─────────────────────────────────────────────

export function getClaims(): Claim[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM claims').all();
    return rows.map(rowToClaim);
}

export function createClaim(claim: Claim): Claim {
    const db = getDb();
    db.prepare(`
        INSERT INTO claims (id, policyId, holderName, date, time, description, status, submittedAt, type, hasRegress, location, cause, witnesses, email, files, history, payments, reserve, regress, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        claim.id, claim.policyId, claim.holderName, claim.date,
        claim.time || null, claim.description || null,
        claim.status || 'Deschis', claim.submittedAt,
        claim.type || null, claim.hasRegress ? 1 : 0,
        claim.location || null, claim.cause || null,
        claim.witnesses || null, claim.email || null,
        claim.files ? JSON.stringify(claim.files) : null,
        claim.history ? JSON.stringify(claim.history) : null,
        claim.payments ? JSON.stringify(claim.payments) : null,
        claim.reserve ? JSON.stringify(claim.reserve) : null,
        claim.regress ? JSON.stringify(claim.regress) : null,
        claim.details ? JSON.stringify(claim.details) : null
    );
    return claim;
}

export function updateClaim(claimId: string, updates: Partial<Claim>): Claim | null {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM claims WHERE id = ?').get(claimId) as any;
    if (!existing) return null;

    const existingClaim = rowToClaim(existing);

    // Preserve existing file content when update has stripped files (no base64 content)
    if (updates.files && existingClaim.files) {
        updates.files = updates.files.map((newFile: any) => {
            if (!newFile.content && newFile.fileId) {
                const existing = existingClaim.files?.find((f: any) => f.fileId === newFile.fileId);
                if (existing) return { ...existing, ...newFile, content: existing.content };
            }
            return newFile;
        });
    }

    const merged = { ...existingClaim, ...updates };

    db.prepare(`
        UPDATE claims SET policyId=?, holderName=?, date=?, time=?, description=?, status=?, submittedAt=?, type=?, hasRegress=?, location=?, cause=?, witnesses=?, email=?, files=?, history=?, payments=?, reserve=?, regress=?, details=?
        WHERE id=?
    `).run(
        merged.policyId, merged.holderName, merged.date,
        merged.time || null, merged.description || null,
        merged.status, merged.submittedAt,
        merged.type || null, merged.hasRegress ? 1 : 0,
        merged.location || null, merged.cause || null,
        merged.witnesses || null, merged.email || null,
        merged.files ? JSON.stringify(merged.files) : null,
        merged.history ? JSON.stringify(merged.history) : null,
        merged.payments ? JSON.stringify(merged.payments) : null,
        merged.reserve ? JSON.stringify(merged.reserve) : null,
        merged.regress ? JSON.stringify(merged.regress) : null,
        merged.details ? JSON.stringify(merged.details) : null,
        claimId
    );
    return merged;
}

export function deleteClaim(claimId: string): boolean {
    const db = getDb();
    const targetId = claimId.trim();
    log.info(`Deleting claim '${targetId}'`);
    const result = db.prepare('DELETE FROM claims WHERE id = ?').run(targetId);
    if (result.changes === 0) {
        log.warn(`Claim '${targetId}' NOT FOUND in database.`);
        return false;
    }
    log.info(`Deleted claim '${targetId}'.`);
    return true;
}

// ─────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────

export function getMessages(claimId: string): Message[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM messages WHERE claimId = ? ORDER BY id ASC').all(claimId);
    return rows.map(rowToMessage);
}

export function getAllMessages(): Message[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM messages ORDER BY id ASC').all();
    return rows.map(rowToMessage);
}

export function addMessage(claimId: string, message: any): Message {
    const db = getDb();
    const result = db.prepare(`
        INSERT INTO messages (claimId, text, sender, timestamp, read, attachment)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        claimId,
        message.text,
        message.sender,
        message.timestamp || new Date().toISOString(),
        0, // new messages are unread
        message.attachment ? JSON.stringify(message.attachment) : null
    );

    const row = db.prepare('SELECT * FROM messages WHERE rowid = ?').get(result.lastInsertRowid);
    return rowToMessage(row);
}

export function markMessagesRead(claimId: string, role: "user" | "agent") {
    const db = getDb();
    // If I am the user, I want to mark 'agent' messages as read
    // If I am the agent, I want to mark 'user' messages as read
    const senderToMark = role === 'user' ? 'agent' : 'user';
    db.prepare(`UPDATE messages SET read = 1 WHERE claimId = ? AND sender = ?`).run(claimId, senderToMark);
}

// ─────────────────────────────────────────────
// User Profile
// ─────────────────────────────────────────────

export function getUserProfile(): UserProfile {
    const db = getDb();
    let row = db.prepare('SELECT * FROM user_profile WHERE id = 1').get() as any;
    if (!row) {
        const seed = SEED_DATA.userProfile;
        db.prepare(`
            INSERT INTO user_profile (id, name, avatar, address, cnp, phone)
            VALUES (1, ?, ?, ?, ?, ?)
        `).run(seed.name, seed.avatar || null, seed.address || '', seed.cnp || '', seed.phone || '');
        row = db.prepare('SELECT * FROM user_profile WHERE id = 1').get() as any;
    }
    return row as UserProfile;
}

export function updateUserProfile(profile: Partial<UserProfile>): UserProfile {
    const db = getDb();
    const existing = getUserProfile();
    const merged = { ...existing, ...profile };
    db.prepare(`
        UPDATE user_profile SET name=?, avatar=?, address=?, cnp=?, phone=?, city=?, county=?
        WHERE id=1
    `).run(
        merged.name || null, merged.avatar || null,
        merged.address || null, merged.cnp || null, merged.phone || null,
        (merged as any).city || null, (merged as any).county || null
    );
    return merged;
}

// ─────────────────────────────────────────────
// Requests
// ─────────────────────────────────────────────

export function getRequests(): Request[] {
    const db = getDb();
    return db.prepare('SELECT * FROM requests ORDER BY timestamp DESC').all() as Request[];
}

export function addRequest(req: any): Request {
    const db = getDb();
    const newReq: Request = {
        ...req,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        status: 'Pending'
    };
    db.prepare(`
        INSERT INTO requests (id, name, type, address, timestamp, status, coverage, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        newReq.id, newReq.name, newReq.type, newReq.address,
        newReq.timestamp, newReq.status,
        newReq.coverage || null, newReq.details || null
    );
    return newReq;
}

export function approveRequest(requestId: string): Policy | null {
    const db = getDb();
    const req = db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId) as any;
    if (!req) return null;

    // Generate unique policy ID
    const existingIds = new Set((db.prepare('SELECT id FROM policies').all() as any[]).map(p => p.id));
    let newPolicyId: string;
    do {
        newPolicyId = `NN-LOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    } while (existingIds.has(newPolicyId));

    const newPolicy: Policy = {
        id: newPolicyId,
        holder: req.name,
        type: req.type || "Home Insurance",
        address: req.address,
        status: "Active",
        expiry: "2027-01-01",
        cnp: ""
    };

    const txn = db.transaction(() => {
        db.prepare(`
            INSERT INTO policies (id, holder, type, address, status, expiry, cnp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(newPolicy.id, newPolicy.holder, newPolicy.type, newPolicy.address, newPolicy.status, newPolicy.expiry, '');
        db.prepare('DELETE FROM requests WHERE id = ?').run(requestId);
    });
    txn();

    return newPolicy;
}

export function removeRequest(requestId: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM requests WHERE id = ?').run(requestId);
    return result.changes > 0;
}

export function updateRequest(requestId: string, updates: Partial<Request>): Request | null {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId) as any;
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    db.prepare(`
        UPDATE requests SET name=?, type=?, address=?, status=?, coverage=?, details=?
        WHERE id=?
    `).run(
        merged.name, merged.type, merged.address, merged.status,
        merged.coverage || null, merged.details || null, requestId
    );
    return merged as Request;
}

// ─────────────────────────────────────────────
// Collaborators
// ─────────────────────────────────────────────

export function getCollaborators(): Collaborator[] {
    const db = getDb();
    return db.prepare('SELECT * FROM collaborators').all() as Collaborator[];
}

export function addCollaborator(collab: any): Collaborator {
    const db = getDb();
    const newCollab: Collaborator = {
        ...collab,
        id: `COL-${Date.now()}`,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    db.prepare(`
        INSERT INTO collaborators (id, name, companyName, type, specialty, phone, email, region, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        newCollab.id, newCollab.name, newCollab.companyName || null, newCollab.type || null,
        newCollab.specialty, newCollab.phone, newCollab.email, newCollab.region,
        newCollab.status, newCollab.createdAt
    );
    return newCollab;
}

export function updateCollaborator(id: string, updates: Partial<Collaborator>): Collaborator | null {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM collaborators WHERE id = ?').get(id) as any;
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    db.prepare(`
        UPDATE collaborators SET name=?, companyName=?, type=?, specialty=?, phone=?, email=?, region=?, status=?
        WHERE id=?
    `).run(
        merged.name, merged.companyName || null, merged.type || null,
        merged.specialty, merged.phone, merged.email, merged.region,
        merged.status, id
    );
    return merged as Collaborator;
}

export function deleteCollaborator(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM collaborators WHERE id = ?').run(id);
    return result.changes > 0;
}

// ─────────────────────────────────────────────
// Avizări
// ─────────────────────────────────────────────

export function getAvizari(): Avizare[] {
    const db = getDb();
    return db.prepare('SELECT * FROM avizari ORDER BY createdAt DESC').all() as Avizare[];
}

export function createAvizare(avizare: Avizare): Avizare {
    const db = getDb();
    db.prepare(`
        INSERT INTO avizari (id, policyId, holderName, date, time, description, status, createdAt, dataAvizare, claimId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        avizare.id, avizare.policyId, avizare.holderName, avizare.date,
        avizare.time || null, avizare.description || null,
        avizare.status || 'Nou', avizare.createdAt,
        avizare.dataAvizare || null, avizare.claimId || null
    );
    return avizare;
}

export function updateAvizare(id: string, updates: Partial<Avizare>): Avizare | null {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM avizari WHERE id = ?').get(id) as any;
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    db.prepare(`
        UPDATE avizari SET policyId=?, holderName=?, date=?, time=?, description=?, status=?, dataAvizare=?, claimId=?
        WHERE id=?
    `).run(
        merged.policyId, merged.holderName, merged.date,
        merged.time || null, merged.description || null,
        merged.status, merged.dataAvizare || null, merged.claimId || null,
        id
    );
    return merged as Avizare;
}

export function deleteAvizare(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM avizari WHERE id = ?').run(id);
    return result.changes > 0;
}

// ─────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────

const DEFAULT_SETTINGS: Record<string, any> = {
    companyName: "Build'n Claims",
    defaultReserveMaterials: "3000",
    defaultReserveContractor: "500",
    notificationsEnabled: true,
    autoBackup: true,
    geminiApiKey: "",
    policyConditions: null
};

export function getSystemSettings(): any {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];

    const settings: any = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
        if (row.key === 'migrated_from_json') continue;
        try {
            settings[row.key] = JSON.parse(row.value);
        } catch {
            settings[row.key] = row.value;
        }
    }
    return settings;
}

export function updateSystemSettings(updates: any): any {
    const db = getDb();
    const insertOrUpdate = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);

    const txn = db.transaction(() => {
        for (const [k, v] of Object.entries(updates)) {
            insertOrUpdate.run(k, typeof v === 'string' ? v : JSON.stringify(v));
        }
    });
    txn();

    return getSystemSettings();
}
