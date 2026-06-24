"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Eye, Trash2, FolderOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Claim } from "@/types";

import { ReopenClaimDialog } from "@/components/claims/ReopenClaimDialog";

export default function ClaimsPage() {
    const [claims, setClaims] = React.useState<Claim[]>([]);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [reopenDialogState, setReopenDialogState] = React.useState<{ isOpen: boolean, claim: Claim | null }>({ isOpen: false, claim: null });
    const router = useRouter();

    const fetchClaims = () => {
        fetch('/api/claims').then(res => res.json()).then(data => {
            // Filter out REGRES claims
            const mainClaims = data.filter((c: Claim) => !c.id.endsWith('-REGRES'));
            setClaims(mainClaims);
        });
    };

    React.useEffect(() => {
        fetchClaims();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent row click
        if (!confirm("Sigur dorești să ștergi acest dosar? Această acțiune este ireversibilă.")) return;

        try {
            const res = await fetch(`/api/claims/${encodeURIComponent(id)}`, { method: 'DELETE' });
            if (res.ok) {
                fetchClaims();
            } else {
                alert("Eroare la ștergere.");
            }
        } catch (err) {
            console.error(err);
            alert("Eroare de conexiune.");
        }
    };

    const handleReopenConfirm = async (reason: string, details: string) => {
        const claim = reopenDialogState.claim;
        if (!claim) return;

        const newHistoryItem = {
            date: new Date().toISOString(),
            event: 'Redeschidere Dosar',
            details: `Motiv: ${reason}. ${details ? `Detalii: ${details}` : ''}`,
            user: 'Admin'
        };

        const updatedClaim = {
            ...claim,
            status: 'Redeschis', // Change status to allow editing
            history: [newHistoryItem, ...(claim.history || [])]
        };

        try {
            const res = await fetch(`/api/claims/${encodeURIComponent(claim.id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedClaim)
            });

            if (res.ok) {
                setReopenDialogState({ isOpen: false, claim: null });
                router.push(`/claims/${encodeURIComponent(claim.id)}`);
            } else {
                alert("Eroare la actualizarea dosarului.");
            }
        } catch (err) {
            console.error(err);
            alert("Eroare de conexiune.");
        }
    };

    const handleClaimClick = (claim: Claim) => {
        if (claim.status === 'Finalizat') {
            setReopenDialogState({ isOpen: true, claim: claim });
        } else {
            router.push(`/claims/${encodeURIComponent(claim.id)}`);
        }
    };

    const totalClaims = claims.length;
    const resolvedClaims = claims.filter((c: Claim) => c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Finalizat').length;
    const openClaims = totalClaims - resolvedClaims;

    const filteredClaims = claims.filter((claim: Claim) =>
        claim.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (claim.holderName && claim.holderName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (claim.policyId && claim.policyId.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dosare Daună</h1>
                    <p className="text-gray-500">Gestionează toate dosarele de daună aici.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/claims/new">
                        <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md">+ Dosar Nou</Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                {/* We can keep some claim-specific stats here if relevant */}
                <Card>
                    <CardHeader className="pb-2"><span className="text-sm font-medium text-gray-500">Dosare Totale</span></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{totalClaims}</div></CardContent>
                </Card>
                <Card className="border-blue-500 bg-blue-50/50">
                    <CardHeader className="pb-2"><span className="text-sm font-medium text-gray-500">Deschise</span></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{openClaims}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><span className="text-sm font-medium text-gray-500">Rezolvate</span></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{resolvedClaims}</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Lista Dosare</CardTitle>
                    <div className="flex gap-2 w-1/3">
                        <div className="relative w-full">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                className="pl-9"
                                placeholder="Caută dosar..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Titular</TableHead>
                                <TableHead>Serie Poliță</TableHead>
                                <TableHead>Tip</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Estimare</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Acțiuni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClaims.map((claim: Claim) => (
                                <TableRow
                                    key={claim.id}
                                    onDoubleClick={() => handleClaimClick(claim)}
                                    className="cursor-pointer hover:bg-gray-100 transition-colors"
                                >
                                    <TableCell className="font-medium">#{claim.id}</TableCell>
                                    <TableCell>
                                        <span className="font-semibold px-2">{claim.holderName || "Necunoscut"}</span>
                                    </TableCell>
                                    <TableCell className="text-xs">{claim.policyId}</TableCell>
                                    <TableCell>{claim.type || "Daună"}</TableCell>
                                    <TableCell>{new Date(claim.submittedAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        {(() => {
                                            if (['Finalizat', 'Resolved', 'Closed'].includes(claim.status)) {
                                                let totalPaid = 0;
                                                if (claim.payments && Array.isArray(claim.payments)) {
                                                    totalPaid = claim.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                                                } else if (claim.payment) {
                                                    totalPaid = parseFloat(claim.payment.amount) || 0;
                                                }
                                                return <span className="text-green-600 font-bold">{totalPaid.toFixed(2)} RON</span>;
                                            } else {
                                                if (claim.reserve && claim.reserve.total) {
                                                    return <span className="text-blue-600 font-medium">{claim.reserve.total} RON (Rezerva)</span>;
                                                }
                                                return <span className="text-gray-400">-</span>;
                                            }
                                        })()}
                                    </TableCell>
                                    <TableCell><Badge variant="warning">{claim.status}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                title="Vezi Detalii"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Direct navigation to view, bypassing "Reopen" check
                                                    router.push(`/claims/${encodeURIComponent(claim.id)}`);
                                                }}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={(e) => handleDelete(e, claim.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            {claim.status === 'Finalizat' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                                    title="Deschide Dosar Finalizat"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleClaimClick(claim);
                                                    }}
                                                >
                                                    <FolderOpen className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredClaims.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-gray-500">
                                        Nu s-au găsit dosare.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <ReopenClaimDialog
                isOpen={reopenDialogState.isOpen}
                onClose={() => setReopenDialogState({ isOpen: false, claim: null })}
                onConfirm={handleReopenConfirm}
            />
        </div>
    );
}
