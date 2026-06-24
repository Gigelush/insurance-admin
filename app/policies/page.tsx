"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CheckCircle, XCircle, AlertCircle, Search, Calendar, ShieldAlert } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Policy, Request } from "@/types";
import { PolicyEditDialog } from "@/components/policies/PolicyEditDialog";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isPolicyExpired(policy: Policy): boolean {
    if (!policy.expiry) return false;
    const expiry = new Date(policy.expiry);
    expiry.setHours(23, 59, 59, 999); // expires at end of day
    return expiry < new Date();
}

function daysUntilExpiry(policy: Policy): number {
    if (!policy.expiry) return Infinity;
    const expiry = new Date(policy.expiry);
    const today = new Date();
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getEffectiveStatus(policy: Policy): Policy["status"] {
    if (isPolicyExpired(policy)) return "Expired";
    return policy.status;
}

function StatusBadge({ policy }: { policy: Policy }) {
    const status = getEffectiveStatus(policy);
    const days = daysUntilExpiry(policy);

    if (status === "Expired") {
        return (
            <div className="flex flex-col gap-1">
                <Badge variant="destructive" className="w-fit">Expirat</Badge>
                <span className="text-xs text-red-500">din {policy.expiry}</span>
            </div>
        );
    }
    if (status === "Pending") {
        return <Badge variant="secondary" className="w-fit">Pending</Badge>;
    }
    if (days <= 30) {
        return (
            <div className="flex flex-col gap-1">
                <Badge variant="success" className="w-fit">Activ</Badge>
                <span className="text-xs text-amber-600 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Expiră în {days}z
                </span>
            </div>
        );
    }
    return <Badge variant="success" className="w-fit">Activ</Badge>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PoliciesPage() {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [requests, setRequests] = useState<Request[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");

    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState<any>(null);

    const [isPolicyDialogOpen, setIsPolicyDialogOpen] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

    const fetchData = async () => {
        try {
            const [polRes, reqRes] = await Promise.all([
                fetch('/api/policies'),
                fetch('/api/requests')
            ]);
            setPolicies(await polRes.json());
            setRequests(await reqRes.json());
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleApprove = async (id: string) => {
        await fetch(`/api/requests/${encodeURIComponent(id)}/approve`, { method: 'POST' });
        fetchData();
    };

    const handleReject = async (id: string) => {
        await fetch(`/api/requests/${encodeURIComponent(id)}`, { method: 'DELETE' });
        fetchData();
    };

    const handleView = (req: any) => { setSelectedRequest(req); setEditData(req); setEditMode(false); };

    const handleSaveChanges = async () => {
        await fetch(`/api/requests/${encodeURIComponent(selectedRequest.id)}/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editData)
        });
        setEditMode(false);
        setSelectedRequest(editData);
        fetchData();
    };

    const handleDialogApprove = async () => { await handleApprove(selectedRequest.id); setSelectedRequest(null); };
    const handleDialogReject = async () => { await handleReject(selectedRequest.id); setSelectedRequest(null); };
    const handlePolicyView = (policy: Policy) => { setSelectedPolicy(policy); setIsPolicyDialogOpen(true); };
    const handlePolicyEdit = (policy: Policy) => { setSelectedPolicy(policy); setIsPolicyDialogOpen(true); };

    // Stats
    const expiredCount = policies.filter(isPolicyExpired).length;
    const activeCount = policies.filter(p => !isPolicyExpired(p) && p.status === "Active").length;
    const expiringCount = policies.filter(p => { const d = daysUntilExpiry(p); return d > 0 && d <= 30; }).length;

    const filteredPolicies = policies.filter((policy: Policy) => {
        const matchesSearch =
            policy.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (policy.cnp && policy.cnp.includes(searchQuery)) ||
            (policy.holder && policy.holder.toLowerCase().includes(searchQuery.toLowerCase()));

        const effectiveStatus = getEffectiveStatus(policy);
        const matchesFilter =
            statusFilter === "all" ||
            (statusFilter === "active" && effectiveStatus === "Active") ||
            (statusFilter === "expired" && effectiveStatus === "Expired");

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Policies</h1>
                <Link href="/policies/new">
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md">
                        + New Policy
                    </Button>
                </Link>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4 flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <div>
                            <p className="text-2xl font-bold">{activeCount}</p>
                            <p className="text-sm text-gray-500">Polițe active</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="p-4 flex items-center gap-3">
                        <AlertCircle className="w-8 h-8 text-amber-500" />
                        <div>
                            <p className="text-2xl font-bold">{expiringCount}</p>
                            <p className="text-sm text-gray-500">Expiră în 30 zile</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4 flex items-center gap-3">
                        <XCircle className="w-8 h-8 text-red-500" />
                        <div>
                            <p className="text-2xl font-bold">{expiredCount}</p>
                            <p className="text-sm text-gray-500">Polițe expirate</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Requests */}
            {requests.length > 0 && (
                <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-700">
                            <AlertCircle className="w-5 h-5" />
                            Cereri Pending ({requests.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Titular</TableHead>
                                    <TableHead>Tip</TableHead>
                                    <TableHead>Adresă</TableHead>
                                    <TableHead>Valoare solicitată</TableHead>
                                    <TableHead className="text-right">Acțiuni</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((req: Request) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.name}</TableCell>
                                        <TableCell>{req.type}</TableCell>
                                        <TableCell>{req.address}</TableCell>
                                        <TableCell>{req.coverage} RON</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" variant="outline" onClick={() => handleView(req)}>
                                                        Detalii
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>
                                                            {editMode ? "Editează Cerere" : "Detalii Cerere"}
                                                        </DialogTitle>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <Label>Titular</Label>
                                                                {editMode
                                                                    ? <Input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                                                                    : <div className="font-medium">{selectedRequest?.name}</div>}
                                                            </div>
                                                            <div>
                                                                <Label>Tip</Label>
                                                                {editMode
                                                                    ? <Input value={editData.type} onChange={e => setEditData({ ...editData, type: e.target.value })} />
                                                                    : <div className="font-medium">{selectedRequest?.type}</div>}
                                                            </div>
                                                            <div>
                                                                <Label>Adresă</Label>
                                                                {editMode
                                                                    ? <Input value={editData.address} onChange={e => setEditData({ ...editData, address: e.target.value })} />
                                                                    : <div className="font-medium">{selectedRequest?.address}</div>}
                                                            </div>
                                                            <div>
                                                                <Label>Valoare acoperire</Label>
                                                                {editMode
                                                                    ? <Input type="number" value={editData.coverage} onChange={e => setEditData({ ...editData, coverage: Number(e.target.value) })} />
                                                                    : <div className="font-medium text-green-600">{selectedRequest?.coverage} RON</div>}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Label>Detalii / Riscuri</Label>
                                                            {editMode
                                                                ? <Input value={editData.details} onChange={e => setEditData({ ...editData, details: e.target.value })} />
                                                                : <div className="p-3 bg-gray-50 rounded-md text-sm">{selectedRequest?.details || "Fără detalii suplimentare."}</div>}
                                                        </div>
                                                    </div>
                                                    <DialogFooter className="gap-2 sm:gap-0">
                                                        {editMode ? (
                                                            <>
                                                                <Button variant="ghost" onClick={() => setEditMode(false)}>Anulează</Button>
                                                                <Button onClick={handleSaveChanges}>Salvează</Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="flex-1 flex gap-2">
                                                                    <Button variant="destructive" onClick={handleDialogReject}>Respinge</Button>
                                                                    <Button variant="outline" onClick={() => setEditMode(true)}>Editează</Button>
                                                                </div>
                                                                <Button className="bg-green-600 hover:bg-green-700" onClick={handleDialogApprove}>
                                                                    Aprobă
                                                                </Button>
                                                            </>
                                                        )}
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Policies Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                    <CardTitle>Toate Polițele</CardTitle>
                    <div className="flex items-center gap-3">
                        {/* Status filter tabs */}
                        <div className="flex rounded-lg border overflow-hidden text-sm">
                            {(["all", "active", "expired"] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setStatusFilter(f)}
                                    className={`px-3 py-1.5 transition-colors ${
                                        statusFilter === f
                                            ? "bg-orange-500 text-white font-semibold"
                                            : "bg-white text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    {f === "all" ? `Toate (${policies.length})` : f === "active" ? `Active (${activeCount})` : `Expirate (${expiredCount})`}
                                </button>
                            ))}
                        </div>
                        {/* Search */}
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                className="pl-9"
                                placeholder="Caută după Nr. Poliță, CNP sau Nume..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Titular</TableHead>
                                <TableHead>Tip</TableHead>
                                <TableHead>Adresă</TableHead>
                                <TableHead>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" /> Valabilitate
                                    </span>
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Acțiuni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPolicies.map((policy: Policy) => {
                                const expired = isPolicyExpired(policy);
                                return (
                                    <TableRow key={policy.id} className={expired ? "bg-red-50/40 opacity-80" : ""}>
                                        <TableCell className="font-medium font-mono text-xs">{policy.id}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className={expired ? "text-gray-400" : ""}>{policy.holder}</span>
                                                {policy.cnp && <span className="text-xs text-gray-400">CNP: {policy.cnp}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className={expired ? "text-gray-400" : ""}>{policy.type}</TableCell>
                                        <TableCell className={`text-sm max-w-xs truncate ${expired ? "text-gray-400" : ""}`}>{policy.address}</TableCell>
                                        <TableCell>
                                            <span className={`text-sm font-medium ${
                                                expired ? "text-red-500" :
                                                daysUntilExpiry(policy) <= 30 ? "text-amber-600" :
                                                "text-gray-700"
                                            }`}>
                                                {policy.expiry || "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge policy={policy} />
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-blue-600 hover:text-blue-800"
                                                onClick={() => handlePolicyView(policy)}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handlePolicyEdit(policy)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={async () => {
                                                    if (confirm('Ești sigur că vrei să ștergi această poliță?')) {
                                                        await fetch(`/api/policies/${encodeURIComponent(policy.id)}`, { method: 'DELETE' });
                                                        fetchData();
                                                    }
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filteredPolicies.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-gray-500">
                                        Nicio poliță găsită.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <PolicyEditDialog
                isOpen={isPolicyDialogOpen}
                onOpenChange={setIsPolicyDialogOpen}
                policy={selectedPolicy}
                onSaved={fetchData}
            />
        </div>
    );
}
