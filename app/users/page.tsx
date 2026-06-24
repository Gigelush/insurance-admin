"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, FolderOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function RegressFilesPage() {
    const [claims, setClaims] = React.useState([]);
    const [searchQuery, setSearchQuery] = React.useState("");
    const router = useRouter();

    const fetchClaims = () => {
        fetch('/api/claims').then(res => res.json()).then(data => {
            // Filter only REGRES claims
            const regressClaims = data.filter((c: any) => c.id.endsWith('-REGRES'));
            setClaims(regressClaims);
        });
    };

    React.useEffect(() => {
        fetchClaims();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Sigur dorești să ștergi acest dosar de regres?")) return;

        try {
            const res = await fetch(`/api/claims/${id}`, { method: 'DELETE' });
            if (res.ok) fetchClaims();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredClaims = claims.filter((claim: any) =>
        claim.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (claim.holderName && claim.holderName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dosare Regres</h1>
                    <p className="text-gray-500">Gestionează dosarele de regres generate.</p>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Listă Dosare Regres</CardTitle>
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
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Titular</TableHead>
                                <TableHead>Data Generării</TableHead>
                                <TableHead>Recuperat</TableHead>
                                <TableHead>Ramas</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Acțiuni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClaims.map((claim: any) => {
                                const recovered = claim.regress?.recoveredPayments?.reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0) || 0;
                                const total = parseFloat(claim.regress?.amount || '0');
                                const remaining = Math.max(0, total - recovered);

                                return (
                                    <TableRow
                                        key={claim.id}
                                        onDoubleClick={() => router.push(`/claims/${claim.id}`)}
                                        className="cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <TableCell className="font-medium">#{claim.id}</TableCell>
                                        <TableCell>{claim.holderName}</TableCell>
                                        <TableCell>{new Date(claim.submittedAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-semibold text-green-700">{recovered.toFixed(2)} RON</TableCell>
                                        <TableCell className="font-semibold text-red-600">{remaining.toFixed(2)} RON</TableCell>
                                        <TableCell><Badge variant="outline">{claim.status}</Badge></TableCell>
                                        <TableCell className="text-right flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={(e: React.MouseEvent) => handleDelete(e, claim.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/claims/${claim.id}`);
                                                }}
                                            >
                                                <FolderOpen className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filteredClaims.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                                        Nu există dosare de regres.
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
