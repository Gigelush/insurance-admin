"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, FileSpreadsheet } from "lucide-react";
import * as XPS from "xlsx";

export default function ReportsPage() {
    const [claims, setClaims] = useState<any[]>([]);
    const [filteredClaims, setFilteredClaims] = useState<any[]>([]);

    // Filters
    const [filters, setFilters] = useState({
        holderName: "",
        cnp: "",
        policyId: "",
        claimId: "",
        startDate: "",
        endDate: ""
    });

    useEffect(() => {
        Promise.all([
            fetch('/api/claims').then(res => res.json()),
            fetch('/api/policies').then(res => res.json())
        ])
            .then(([claimsData, policiesData]) => {
                const enrichedClaims = claimsData.map((claim: any) => {
                    const policy = policiesData.find((p: any) => p.id === claim.policyId);
                    return { ...claim, policyDetails: policy };
                });
                setClaims(enrichedClaims);
                setFilteredClaims(enrichedClaims);
            })
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        let result = claims;
        if (filters.holderName) result = result.filter(c => c.holderName?.toLowerCase().includes(filters.holderName.toLowerCase()));
        if (filters.policyId) result = result.filter(c => c.policyId?.toLowerCase().includes(filters.policyId.toLowerCase()));
        if (filters.claimId) result = result.filter(c => c.id?.toString().toLowerCase().includes(filters.claimId.toLowerCase()));
        if (filters.cnp) result = result.filter(c => c.cnp?.includes(filters.cnp) || c.details?.cnp?.includes(filters.cnp));
        if (filters.startDate) result = result.filter(c => new Date(c.submittedAt) >= new Date(filters.startDate));
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            result = result.filter(c => new Date(c.submittedAt) <= end);
        }
        setFilteredClaims(result);
    }, [filters, claims]);

    const handleFilterChange = (key: string, value: string) => setFilters(prev => ({ ...prev, [key]: value }));

    const exportToExcel = () => {
        const dataToExport = filteredClaims.map(c => {
            const totalPaid = c.payments?.reduce((acc: number, p: any) => acc + parseFloat(p.amount || 0), 0) || 0;
            const baseObj: any = {
                "ID Dosar": c.id,
                "Status": c.status,
                "Data Depunerii": new Date(c.submittedAt).toLocaleDateString(),
                "Titular": c.holderName,
                "CNP/CUI": c.policyDetails?.cnp || c.details?.cnp || c.cnp || "-",
                "Telefon": c.policyDetails?.phone || c.phone || c.details?.phone || "-",
                "Email": c.policyDetails?.email || c.email || c.details?.email || "-",
                "Adresa": c.policyDetails?.address || c.details?.address || c.address || "-",
                "Nr. Poliță": c.policyId,
                "Data Eveniment": c.date || "-",
                "Ora Eveniment": c.time || "-",
                "Descriere Incident": c.description || "-",
                "Rezerva Materiale (RON)": c.reserve?.materials || "0",
                "Rezerva Contractor (RON)": c.reserve?.contractor || "0",
                "Rezerva Expert (RON)": c.reserve?.other || "0",
                "Rezerva Legal (RON)": c.reserve?.legal || "0",
                "Rezerva Totală (RON)": c.reserve?.total || "0",
                "Total Plătit (RON)": totalPaid,
            };
            if (c.payments?.length > 0) {
                c.payments.forEach((p: any, idx: number) => {
                    const prefix = `Plata ${idx + 1}`;
                    baseObj[`${prefix} - Suma (RON)`] = p.amount;
                    baseObj[`${prefix} - Dată Plată Estimată`] = p.date;
                    baseObj[`${prefix} - Data Cerere Despăgubire`] = p.claimDate || '-';
                    baseObj[`${prefix} - Data Înregistrare`] = p.registrationDate || '-';
                    baseObj[`${prefix} - Beneficiar`] = p.beneficiaryName || '-';
                    baseObj[`${prefix} - CNP/CUI`] = p.cnp || '-';
                    baseObj[`${prefix} - Banca`] = p.bank || '-';
                    baseObj[`${prefix} - IBAN`] = p.iban || '-';
                    baseObj[`${prefix} - Detalii`] = p.details || '-';
                });
            }
            return baseObj;
        });
        const worksheet = XPS.utils.json_to_sheet(dataToExport);
        const workbook = XPS.utils.book_new();
        XPS.utils.book_append_sheet(workbook, worksheet, "Rapoarte");
        XPS.writeFile(workbook, `raport_complet_dosare_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <FileSpreadsheet className="w-8 h-8 text-green-600" />
                        Rapoarte & Export
                    </h1>
                    <p className="text-gray-500">Generează rapoarte detaliate și exportă în Excel.</p>
                </div>
                <Button className="bg-green-600 hover:bg-green-700 gap-2" onClick={exportToExcel}>
                    <Download className="w-4 h-4" /> Exportă Excel
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5" /> Filtre Căutare</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Nume Asigurat</Label>
                            <Input placeholder="Caută după nume..." value={filters.holderName} onChange={(e) => handleFilterChange("holderName", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>CNP / CUI</Label>
                            <Input placeholder="Caută după CNP..." value={filters.cnp} onChange={(e) => handleFilterChange("cnp", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Număr Poliță</Label>
                            <Input placeholder="Serie poliță..." value={filters.policyId} onChange={(e) => handleFilterChange("policyId", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Număr Dosar</Label>
                            <Input placeholder="#ID..." value={filters.claimId} onChange={(e) => handleFilterChange("claimId", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>De la Data</Label>
                            <Input type="date" value={filters.startDate} onChange={(e) => handleFilterChange("startDate", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Până la Data</Label>
                            <Input type="date" value={filters.endDate} onChange={(e) => handleFilterChange("endDate", e.target.value)} />
                        </div>
                        <div className="flex items-end col-span-2">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setFilters({ holderName: "", cnp: "", policyId: "", claimId: "", startDate: "", endDate: "" })}
                            >
                                Resetează Filtre
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Rezultate ({filteredClaims.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID Dosar</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Titular</TableHead>
                                <TableHead>CNP</TableHead>
                                <TableHead>Poliță</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClaims.length > 0 ? (
                                filteredClaims.map((claim) => (
                                    <TableRow key={claim.id}>
                                        <TableCell className="font-medium">#{claim.id}</TableCell>
                                        <TableCell>{new Date(claim.submittedAt).toLocaleDateString()}</TableCell>
                                        <TableCell>{claim.holderName}</TableCell>
                                        <TableCell>{claim.cnp || claim.details?.cnp || "-"}</TableCell>
                                        <TableCell>{claim.policyId}</TableCell>
                                        <TableCell><Badge variant="outline">{claim.status}</Badge></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        Nu există rezultate pentru filtrele selectate.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
