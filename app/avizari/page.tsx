"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Trash2, FileUp, CheckCircle2, X, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Avizare } from "@/types";
import { useAuth } from "@/components/auth-context";

export default function AvizariPage() {
    const [avizari, setAvizari] = React.useState<Avizare[]>([]);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [convertingId, setConvertingId] = React.useState<string | null>(null);
    const [toast, setToast] = React.useState<{ claimId: string; avizareId: string } | null>(null);
    const toastTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const { can } = useAuth();
    const canDelete = can('write', 'avizari');      // basic_user: false
    const canConvert = can('write', 'avizari');     // basic_user: false

    const showToast = (claimId: string, avizareId: string) => {
        setToast({ claimId, avizareId });
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), 8000);
    };
    const router = useRouter();

    const fetchAvizari = () => {
        fetch('/api/avizari').then(res => res.json()).then(data => {
            setAvizari(data);
        });
    };

    React.useEffect(() => {
        fetchAvizari();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Sigur dorești să ștergi această avizare? Această acțiune este ireversibilă.")) return;

        try {
            const res = await fetch(`/api/avizari/${encodeURIComponent(id)}`, { method: 'DELETE' });
            if (res.ok) {
                fetchAvizari();
            } else {
                alert("Eroare la ștergere.");
            }
        } catch (err) {
            console.error(err);
            alert("Eroare de conexiune.");
        }
    };

    const handleConvertToDosar = async (e: React.MouseEvent, avizare: Avizare) => {
        e.stopPropagation();
        if (avizare.claimId) return; // Extra client-side guard
        if (!confirm(`Dorești să transformi avizarea #${avizare.id} într-un dosar de daună?`)) return;

        setConvertingId(avizare.id);

        try {
            const res = await fetch(`/api/avizari/${encodeURIComponent(avizare.id)}/convert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (res.status === 409) {
                const data = await res.json();
                alert(`Această avizare a fost deja transformată în dosarul #${data.claimId}.`);
                setConvertingId(null);
                fetchAvizari();
                return;
            }

            if (!res.ok) {
                alert("Eroare la crearea dosarului.");
                setConvertingId(null);
                return;
            }

            const { claim } = await res.json();

            setConvertingId(null);
            fetchAvizari();

            // Show success toast with the created dosar ID
            showToast(claim.id, avizare.id);
        } catch (err) {
            console.error(err);
            alert("Eroare de conexiune.");
            setConvertingId(null);
        }
    };

    const handleExportPDF = async (e: React.MouseEvent, avizare: Avizare) => {
        e.stopPropagation();
        if (!avizare.claimId) return;

        // Fetch policy data for phone & address
        let policyData: any = null;
        try {
            const res = await fetch(`/api/policies/${encodeURIComponent(avizare.policyId)}`);
            if (res.ok) policyData = await res.json();
        } catch { /* ignore */ }

        const phone = policyData?.phone || policyData?.details?.phone || '—';
        const insuredAddr = policyData?.insuredLocations?.length > 0
            ? policyData.insuredLocations.join('; ')
            : policyData?.address || policyData?.details?.localitate || '—';
        const validity = policyData?.startDate && policyData?.expiry
            ? `${policyData.startDate} — ${policyData.expiry}` : '—';

        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();

        // jsPDF's default font doesn't handle Romanian diacritics well (causes letter-spacing issues)
        const strip = (str: string) =>
            str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/ț/gi, 't').replace(/ș/gi, 's')
                .replace(/Ț/g, 'T').replace(/Ș/g, 'S');

        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 20;

        // Title with dosar number
        doc.setFontSize(20);
        doc.setTextColor(232, 117, 26);
        const titleText = `Fisa Avizare Dauna  #${avizare.claimId}`;
        doc.text(titleText, 14, y);
        y += 3;
        doc.setDrawColor(232, 117, 26);
        doc.setLineWidth(0.8);
        doc.line(14, y, pageWidth - 14, y);
        y += 10;

        // Subtitle
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(`Avizare #${avizare.id}`, 14, y);
        y += 12;

        // Table rows
        const rows = [
            ['Serie Polita', avizare.policyId],
            ['Nume Asigurat', strip(avizare.holderName || '—')],
            ['Telefon Asigurat', phone],
            ['Adresa Locatie Asigurata', strip(insuredAddr)],
            ['Valabilitate Polita', validity],
            ['Ora Evenimentului', avizare.time || '—'],
            ['Data Evenimentului', avizare.date || '—'],
            ['Descriere Eveniment', strip(avizare.description || '—')],
        ];

        const labelWidth = 60;
        const valueWidth = pageWidth - 14 - 14 - labelWidth;
        const cellPadding = 4;
        const fontSize = 10;

        doc.setFontSize(fontSize);

        for (const [label, value] of rows) {
            // Calculate row height based on value text wrapping
            doc.setFont('helvetica', 'normal');
            const valueLines = doc.splitTextToSize(value, valueWidth - cellPadding * 2);
            const labelLines = doc.splitTextToSize(label, labelWidth - cellPadding * 2);
            const lineHeight = 5;
            const rowHeight = Math.max(labelLines.length, valueLines.length) * lineHeight + cellPadding * 2;

            // Check if we need a new page
            if (y + rowHeight > 270) {
                doc.addPage();
                y = 20;
            }

            // Label cell (gray background)
            doc.setFillColor(245, 245, 245);
            doc.rect(14, y, labelWidth, rowHeight, 'F');
            doc.setDrawColor(200, 200, 200);
            doc.rect(14, y, labelWidth, rowHeight, 'S');
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(68, 68, 68);
            doc.text(labelLines, 14 + cellPadding, y + cellPadding + 3.5);

            // Value cell
            doc.rect(14 + labelWidth, y, valueWidth, rowHeight, 'S');
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 30, 30);
            doc.text(valueLines, 14 + labelWidth + cellPadding, y + cellPadding + 3.5);

            y += rowHeight;
        }

        // Footer message
        y += 15;
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFillColor(240, 247, 255);
        doc.rect(14, y, pageWidth - 28, 16, 'F');
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(1.5);
        doc.line(14, y, 14, y + 16);
        doc.setLineWidth(0.2);
        doc.setFontSize(11);
        doc.setTextColor(30, 64, 175);
        doc.text('Buna ziua, Va rog sa preluati acest caz. Va multumesc.', 20, y + 10);

        // Download
        doc.save(`Fisa_Avizare_${avizare.id}.pdf`);
    };

    const totalAvizari = avizari.length;
    const newAvizari = avizari.filter((a) => a.status === 'Nou').length;
    const inProgressAvizari = avizari.filter((a) => a.status === 'In Lucru').length;
    const completedAvizari = avizari.filter((a) => a.status === 'Finalizat').length;

    const filteredAvizari = avizari.filter((a) =>
        a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.holderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.policyId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8">
            {/* Success Toast */}
            {toast && (
                <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[400px]">
                        <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-bold text-sm">Dosar creat cu succes!</p>
                            <p className="text-green-100 text-xs mt-0.5">
                                Avizarea #{toast.avizareId} a fost transformată în dosarul <strong>#{toast.claimId}</strong>
                            </p>
                        </div>
                        <Link
                            href={`/claims/${encodeURIComponent(toast.claimId)}`}
                            className="bg-white text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-50 transition-colors flex items-center gap-1 whitespace-nowrap"
                        >
                            Deschide Dosar <ExternalLink className="w-3 h-3" />
                        </Link>
                        <button onClick={() => setToast(null)} className="text-green-200 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Avizări</h1>
                    <p className="text-gray-500">Gestionează toate avizările de daună aici.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/avizari/new">
                        <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md">+ Avizare Nouă</Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2"><span className="text-sm font-medium text-gray-500">Total Avizări</span></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{totalAvizari}</div></CardContent>
                </Card>
                <Card className="border-yellow-500 bg-yellow-50/50">
                    <CardHeader className="pb-2"><span className="text-sm font-medium text-gray-500">Noi</span></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-yellow-600">{newAvizari}</div></CardContent>
                </Card>
                <Card className="border-blue-500 bg-blue-50/50">
                    <CardHeader className="pb-2"><span className="text-sm font-medium text-gray-500">În Lucru</span></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-blue-600">{inProgressAvizari}</div></CardContent>
                </Card>
                <Card className="border-green-500 bg-green-50/50">
                    <CardHeader className="pb-2"><span className="text-sm font-medium text-gray-500">Finalizate</span></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-600">{completedAvizari}</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Lista Avizări</CardTitle>
                    <div className="flex gap-2 w-1/3">
                        <div className="relative w-full">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                className="pl-9"
                                placeholder="Caută avizare..."
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
                                <TableHead>Data Eveniment</TableHead>
                                <TableHead>Ora</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Dosar</TableHead>
                                <TableHead>Data Avizare</TableHead>
                                <TableHead className="text-right">Acțiuni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAvizari.map((avizare) => (
                                <TableRow
                                    key={avizare.id}
                                    className="cursor-pointer hover:bg-gray-100 transition-colors"
                                >
                                    <TableCell className="font-medium">#{avizare.id}</TableCell>
                                    <TableCell>
                                        <span className="font-semibold px-2">{avizare.holderName || "Necunoscut"}</span>
                                    </TableCell>
                                    <TableCell className="text-xs">{avizare.policyId}</TableCell>
                                    <TableCell>{avizare.date}</TableCell>
                                    <TableCell>{avizare.time || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            avizare.status === 'Nou' ? 'default' :
                                                avizare.status === 'In Lucru' ? 'warning' :
                                                    'success' as any
                                        }>
                                            {avizare.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {avizare.claimId ? (
                                            <Link
                                                href={`/claims/${encodeURIComponent(avizare.claimId)}`}
                                                className="text-blue-600 hover:underline text-xs font-medium"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                #{avizare.claimId}
                                            </Link>
                                        ) : (
                                            <span className="text-gray-400 text-xs">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{new Date(avizare.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            {!avizare.claimId && canConvert && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                                    title="Transformă în Dosar"
                                                    disabled={convertingId === avizare.id}
                                                    onClick={(e) => handleConvertToDosar(e, avizare)}
                                                >
                                                    <FileUp className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {avizare.claimId && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                    title="Exportă Fișă PDF"
                                                    onClick={(e) => handleExportPDF(e, avizare)}
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={(e) => handleDelete(e, avizare.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>

                                </TableRow>
                            ))}
                            {filteredAvizari.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24 text-gray-500">
                                        Nu s-au găsit avizări.
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
