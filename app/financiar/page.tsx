"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Banknote, CheckCircle, Clock, DollarSign, Search, CalendarDays, Upload, FileText, Eye } from "lucide-react";

/* ── rest of imports unchanged ── */
import * as XPS from "xlsx";
import Link from "next/link";

interface FinancialPayment {
    claimId: string;
    policyId: string;
    holderName: string;
    paymentIndex: number;
    payment: any;
}

export default function FinanciarPage() {
    const [claims, setClaims] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [markingPaid, setMarkingPaid] = useState<string | null>(null);
    const [uploadingProof, setUploadingProof] = useState<string | null>(null);
    const [viewingProof, setViewingProof] = useState<{ name: string, content: string, type: string } | null>(null);

    const fetchData = () => {
        fetch('/api/claims').then(res => res.json())
            .then(data => setClaims(data))
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchData(); }, []);

    // Extract all validated payments, EXCLUDING regress claims
    const allPayments: FinancialPayment[] = useMemo(() => {
        const result: FinancialPayment[] = [];
        for (const claim of claims) {
            // Skip regress claims — those are for recovery, not payments
            if (claim.hasRegress || claim.id?.toUpperCase().includes('REGRES')) continue;

            const payments = claim.payments || [];
            payments.forEach((p: any, idx: number) => {
                if (p.validated) {
                    result.push({
                        claimId: claim.id,
                        policyId: claim.policyId,
                        holderName: claim.holderName,
                        paymentIndex: idx,
                        payment: p
                    });
                }
            });
        }
        return result;
    }, [claims]);

    // Apply filters
    const filteredPayments = useMemo(() => {
        let result = allPayments;
        if (statusFilter === 'pending') result = result.filter(fp => !fp.payment.paidAt);
        if (statusFilter === 'paid') result = result.filter(fp => !!fp.payment.paidAt);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(fp =>
                fp.claimId.toLowerCase().includes(q) ||
                fp.payment.beneficiaryName?.toLowerCase().includes(q) ||
                fp.payment.cnp?.includes(q) ||
                fp.payment.iban?.toLowerCase().includes(q) ||
                fp.holderName?.toLowerCase().includes(q)
            );
        }
        return result;
    }, [allPayments, statusFilter, searchQuery]);

    // Summary stats
    const totalPending = allPayments.filter(fp => !fp.payment.paidAt).reduce((sum, fp) => sum + parseFloat(fp.payment.amount || '0'), 0);
    const totalPaid = allPayments.filter(fp => fp.payment.paidAt).reduce((sum, fp) => sum + parseFloat(fp.payment.amount || '0'), 0);
    const pendingCount = allPayments.filter(fp => !fp.payment.paidAt).length;

    const handleMarkPaid = async (fp: FinancialPayment) => {
        const key = `${fp.claimId}-${fp.paymentIndex}`;
        setMarkingPaid(key);
        try {
            const claim = claims.find(c => c.id === fp.claimId);
            if (!claim) return;

            const updatedPayments = [...(claim.payments || [])];
            updatedPayments[fp.paymentIndex] = {
                ...updatedPayments[fp.paymentIndex],
                paidAt: new Date().toISOString()
            };

            const newHistoryItem = {
                date: new Date().toISOString(),
                event: 'Plată Procesată',
                details: `Referat #${fp.paymentIndex + 1} (${fp.payment.amount} RON) marcat ca plătit de Financiar`,
                user: 'Financiar'
            };

            const updatedClaim = {
                ...claim,
                payments: updatedPayments,
                history: [...(claim.history || []), newHistoryItem]
            };

            // Strip base64 file content before PUT
            const { files, ...claimWithoutFiles } = updatedClaim as any;
            const lightFiles = files?.map((f: any) => ({
                name: f.name, type: f.type, category: f.category, fileId: f.fileId, uploadedAt: f.uploadedAt,
            })) || [];

            const res = await fetch(`/api/claims/${encodeURIComponent(fp.claimId)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...claimWithoutFiles, files: lightFiles })
            });

            if (res.ok) fetchData();
            else alert('Eroare la actualizarea plății.');
        } catch (e) {
            console.error(e);
            alert('Eroare de conexiune.');
        } finally {
            setMarkingPaid(null);
        }
    };

    // Upload payment proof for a day's batch of payments
    const handleUploadProof = async (dayPayments: FinancialPayment[], file: File) => {
        const dateKey = dayPayments[0]?.payment?.validatedAt || dayPayments[0]?.payment?.registrationDate || 'unknown';
        setUploadingProof(dateKey);
        try {
            // Convert file to base64
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const proofData = {
                name: file.name,
                type: file.type,
                content: base64,
                uploadedAt: new Date().toISOString()
            };

            // Group payments by claimId to batch updates
            const claimGroups: Record<string, FinancialPayment[]> = {};
            for (const fp of dayPayments) {
                if (!claimGroups[fp.claimId]) claimGroups[fp.claimId] = [];
                claimGroups[fp.claimId].push(fp);
            }

            // Update each claim
            for (const [claimId, fps] of Object.entries(claimGroups)) {
                const claim = claims.find(c => c.id === claimId);
                if (!claim) continue;

                const updatedPayments = [...(claim.payments || [])];
                for (const fp of fps) {
                    updatedPayments[fp.paymentIndex] = {
                        ...updatedPayments[fp.paymentIndex],
                        paymentProof: proofData
                    };
                }

                const updatedClaim = { ...claim, payments: updatedPayments };

                // Strip base64 file content
                const { files, ...claimWithoutFiles } = updatedClaim as any;
                const lightFiles = files?.map((f: any) => ({
                    name: f.name, type: f.type, category: f.category, fileId: f.fileId, uploadedAt: f.uploadedAt,
                })) || [];

                await fetch(`/api/claims/${encodeURIComponent(claimId)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...claimWithoutFiles, files: lightFiles })
                });
            }

            fetchData();
            alert(`Dovada plății "${file.name}" a fost atașată la ${dayPayments.length} referate.`);
        } catch (e) {
            console.error(e);
            alert('Eroare la încărcarea dovezii de plată.');
        } finally {
            setUploadingProof(null);
        }
    };

    const exportFinanciarExcel = () => {
        const dataToExport = filteredPayments.map(fp => ({
            "Nr. Dosar": fp.claimId,
            "Nr. Poliță": fp.policyId,
            "Referat #": fp.paymentIndex + 1,
            "Beneficiar": fp.payment.beneficiaryName || '-',
            "CNP/CUI": fp.payment.cnp || '-',
            "Adresa": fp.payment.address || '-',
            "Telefon": fp.payment.phone || '-',
            "Email": fp.payment.email || '-',
            "Sumă (RON)": fp.payment.amount || '0',
            "Banca": fp.payment.bank || '-',
            "IBAN": fp.payment.iban || '-',
            "Dată Plată Estimată": fp.payment.date || '-',
            "Data Cerere": fp.payment.claimDate || '-',
            "Data Înregistrare": fp.payment.registrationDate || '-',
            "Tip Rezervă": fp.payment.reserveType || '-',
            "Detalii": fp.payment.details || '-',
            "Status": fp.payment.paidAt ? 'Plătit' : 'În așteptare',
            "Data Plății": fp.payment.paidAt ? new Date(fp.payment.paidAt).toLocaleDateString() : '-',
        }));

        const worksheet = XPS.utils.json_to_sheet(dataToExport);
        if (dataToExport.length > 0) {
            worksheet['!cols'] = Object.keys(dataToExport[0]).map(key => ({
                wch: Math.max(key.length + 2, ...dataToExport.map(row => String((row as any)[key] || '').length + 2))
            }));
        }
        const workbook = XPS.utils.book_new();
        XPS.utils.book_append_sheet(workbook, worksheet, "Financiar");
        XPS.writeFile(workbook, `financiar_plati_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Banknote className="w-8 h-8 text-green-600" />
                    Financiar
                </h1>
                <p className="text-gray-500">Gestionează plățile din referatele validate. Dosarele de regres nu sunt incluse.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">De Plătit</p>
                                <p className="text-2xl font-bold text-amber-700">{totalPending.toLocaleString('ro-RO')} RON</p>
                                <p className="text-xs text-gray-400 mt-1">{pendingCount} referate în așteptare</p>
                            </div>
                            <Clock className="w-10 h-10 text-amber-400 opacity-60" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Plătit</p>
                                <p className="text-2xl font-bold text-green-700">{totalPaid.toLocaleString('ro-RO')} RON</p>
                                <p className="text-xs text-gray-400 mt-1">{allPayments.filter(fp => fp.payment.paidAt).length} referate procesate</p>
                            </div>
                            <CheckCircle className="w-10 h-10 text-green-400 opacity-60" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total General</p>
                                <p className="text-2xl font-bold text-blue-700">{(totalPending + totalPaid).toLocaleString('ro-RO')} RON</p>
                                <p className="text-xs text-gray-400 mt-1">{allPayments.length} referate validate total</p>
                            </div>
                            <DollarSign className="w-10 h-10 text-blue-400 opacity-60" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Export */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        className="pl-9"
                        placeholder="Caută după beneficiar, dosar, CNP, IBAN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${statusFilter === 'all' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setStatusFilter('all')}
                    >
                        Toate ({allPayments.length})
                    </button>
                    <button
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${statusFilter === 'pending' ? 'bg-amber-100 shadow text-amber-800' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setStatusFilter('pending')}
                    >
                        În așteptare ({pendingCount})
                    </button>
                    <button
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${statusFilter === 'paid' ? 'bg-green-100 shadow text-green-800' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setStatusFilter('paid')}
                    >
                        Plătite ({allPayments.filter(fp => fp.payment.paidAt).length})
                    </button>
                </div>
                <Button className="bg-green-600 hover:bg-green-700 gap-2 ml-auto" onClick={exportFinanciarExcel} disabled={filteredPayments.length === 0}>
                    <Download className="w-4 h-4" /> Export Excel Financiar
                </Button>
            </div>

            {/* Grouped by Validation Day */}
            {filteredPayments.length > 0 ? (
                (() => {
                    // Group by validation date
                    const groups: Record<string, FinancialPayment[]> = {};
                    for (const fp of filteredPayments) {
                        const dateStr = fp.payment.validatedAt
                            ? new Date(fp.payment.validatedAt).toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                            : fp.payment.registrationDate
                                ? new Date(fp.payment.registrationDate).toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                : 'Fără dată validare';
                        if (!groups[dateStr]) groups[dateStr] = [];
                        groups[dateStr].push(fp);
                    }

                    // Sort groups by date (newest first)
                    const sortedKeys = Object.keys(groups).sort((a, b) => {
                        if (a === 'Fără dată validare') return 1;
                        if (b === 'Fără dată validare') return -1;
                        const fpA = groups[a][0];
                        const fpB = groups[b][0];
                        const dateA = fpA.payment.validatedAt || fpA.payment.registrationDate || '';
                        const dateB = fpB.payment.validatedAt || fpB.payment.registrationDate || '';
                        return dateB.localeCompare(dateA);
                    });

                    return sortedKeys.map(dateLabel => {
                        const dayPayments = groups[dateLabel];
                        const dayTotal = dayPayments.reduce((s, fp) => s + parseFloat(fp.payment.amount || '0'), 0);
                        const dayPaid = dayPayments.filter(fp => fp.payment.paidAt).length;

                        return (
                            <div key={dateLabel} className="space-y-0">
                                {/* Day Header */}
                                <div className="flex items-center justify-between bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-t-lg px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <CalendarDays className="w-5 h-5 opacity-80" />
                                        <span className="font-semibold capitalize">{dateLabel}</span>
                                        <Badge className="bg-white/20 text-white hover:bg-white/20 text-xs">
                                            {dayPayments.length} {dayPayments.length === 1 ? 'referat' : 'referate'}
                                        </Badge>
                                        {dayPaid > 0 && (
                                            <Badge className="bg-green-500/30 text-green-200 hover:bg-green-500/30 text-xs gap-1">
                                                <CheckCircle className="w-3 h-3" /> {dayPaid} plătite
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-lg">{dayTotal.toLocaleString('ro-RO')} RON</span>
                                        {/* Upload proof button */}
                                        <label className="cursor-pointer">
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".xlsx,.xls,.csv,.jpg,.jpeg,.png,.pdf"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleUploadProof(dayPayments, file);
                                                    e.target.value = '';
                                                }}
                                            />
                                            <span className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
                                                <Upload className="w-3.5 h-3.5" />
                                                {uploadingProof ? 'Se încarcă...' : 'Încarcă Dovadă Plată'}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                {/* Show uploaded proof if exists for any payment in this day */}
                                {(() => {
                                    const proof = dayPayments.find(fp => fp.payment.paymentProof)?.payment.paymentProof;
                                    if (!proof) return null;
                                    return (
                                        <div className="bg-green-50 border border-green-200 rounded-none px-5 py-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-green-700">
                                                <FileText className="w-4 h-4" />
                                                <span className="text-sm font-medium">Dovadă plată: {proof.name}</span>
                                                <span className="text-xs text-green-500">
                                                    ({new Date(proof.uploadedAt).toLocaleDateString('ro-RO')})
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                {proof.content && proof.type?.startsWith('image/') && (
                                                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                                                        onClick={() => setViewingProof(proof)}>
                                                        <Eye className="w-3 h-3" /> Vizualizează
                                                    </Button>
                                                )}
                                                {proof.content && (
                                                    <a href={proof.content} download={proof.name}>
                                                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                                                            <Download className="w-3 h-3" /> Descarcă
                                                        </Button>
                                                    </a>
                                                )}
                                                {/* Re-upload button */}
                                                <label className="cursor-pointer">
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept=".xlsx,.xls,.csv,.jpg,.jpeg,.png,.pdf"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleUploadProof(dayPayments, file);
                                                            e.target.value = '';
                                                        }}
                                                    />
                                                    <span className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 cursor-pointer">
                                                        <Upload className="w-3 h-3" /> Reîncarcă
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    );
                                })()}
                                {/* Day Table */}
                                <Card className="rounded-t-none border-t-0">
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50">
                                                    <TableHead className="font-semibold">Nr. Dosar</TableHead>
                                                    <TableHead className="font-semibold">Referat</TableHead>
                                                    <TableHead className="font-semibold">Beneficiar</TableHead>
                                                    <TableHead className="font-semibold">CNP/CUI</TableHead>
                                                    <TableHead className="font-semibold text-right">Sumă (RON)</TableHead>
                                                    <TableHead className="font-semibold">Banca</TableHead>
                                                    <TableHead className="font-semibold">IBAN</TableHead>
                                                    <TableHead className="font-semibold">Status</TableHead>
                                                    <TableHead className="font-semibold text-center">Acțiuni</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {dayPayments.map((fp) => {
                                                    const key = `${fp.claimId}-${fp.paymentIndex}`;
                                                    const isPaid = !!fp.payment.paidAt;
                                                    return (
                                                        <TableRow key={key} className={isPaid ? 'bg-green-50/50' : ''}>
                                                            <TableCell>
                                                                <Link href={`/claims/${fp.claimId}`} className="text-blue-600 hover:underline font-medium">
                                                                    #{fp.claimId}
                                                                </Link>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="text-sm text-gray-600">#{fp.paymentIndex + 1}</span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div>
                                                                    <div className="font-medium text-sm">{fp.payment.beneficiaryName || '-'}</div>
                                                                    <div className="text-xs text-gray-400">{fp.payment.email || ''}</div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="font-mono text-sm">{fp.payment.cnp || '-'}</TableCell>
                                                            <TableCell className="text-right font-semibold text-sm">{parseFloat(fp.payment.amount || '0').toLocaleString('ro-RO')} RON</TableCell>
                                                            <TableCell className="text-sm">{fp.payment.bank || '-'}</TableCell>
                                                            <TableCell className="font-mono text-xs">{fp.payment.iban || '-'}</TableCell>
                                                            <TableCell>
                                                                {isPaid ? (
                                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                                                                        <CheckCircle className="w-3 h-3" /> Plătit
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1">
                                                                        <Clock className="w-3 h-3" /> În așteptare
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                {!isPaid ? (
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-green-600 hover:bg-green-700 text-xs gap-1"
                                                                        onClick={() => handleMarkPaid(fp)}
                                                                        disabled={markingPaid === key}
                                                                    >
                                                                        <Banknote className="w-3.5 h-3.5" />
                                                                        {markingPaid === key ? 'Se procesează...' : 'Marchează Plătit'}
                                                                    </Button>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">
                                                                        {new Date(fp.payment.paidAt).toLocaleDateString('ro-RO')}
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    });
                })()
            ) : (
                <Card>
                    <CardContent className="py-12">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                            <Banknote className="w-10 h-10 opacity-30" />
                            <p className="font-medium">Nu există referate validate</p>
                            <p className="text-sm">Referatele validate din dosare (fără regres) vor apărea aici automat.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Proof Viewer Modal */}
            {viewingProof && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setViewingProof(null)}>
                    <div className="bg-white rounded-lg shadow-2xl max-w-3xl max-h-[80vh] overflow-auto p-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-sm">{viewingProof.name}</span>
                            <div className="flex gap-2">
                                <a href={viewingProof.content} download={viewingProof.name}>
                                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                                        <Download className="w-3 h-3" /> Descarcă
                                    </Button>
                                </a>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setViewingProof(null)}>✕</Button>
                            </div>
                        </div>
                        {viewingProof.type?.startsWith('image/') ? (
                            <img src={viewingProof.content} alt={viewingProof.name} className="max-w-full rounded" />
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
                                <p>Previzualizarea nu este disponibilă pentru acest tip de fișier.</p>
                                <p className="text-sm">Descarcă fișierul pentru a-l vizualiza.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
