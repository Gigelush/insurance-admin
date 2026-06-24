"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileDown, XCircle, AlertTriangle } from "lucide-react";
import jsPDF from "jspdf";
import { Claim, Policy } from "@/types";

interface ClaimRejectionTabProps {
    claim: Claim;
    policy?: Policy | null;
    onReject?: (reason: string) => void;
    readOnly?: boolean;
}

const REJECTION_REASONS = [
    "Evenimentul nu este acoperit de polița de asigurare",
    "Polița de asigurare nu era activă la data evenimentului",
    "Documentația depusă este incompletă",
    "Dauna nu se încadrează în termenii și condițiile poliței",
    "Depășirea termenului de avizare",
    "Lipsa dovezilor privind producerea evenimentului",
    "Altul (specificați mai jos)",
];

function strip(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ț/g, "t").replace(/Ț/g, "T")
        .replace(/ș/g, "s").replace(/Ș/g, "S");
}

export function ClaimRejectionTab({ claim, policy, onReject, readOnly = false }: ClaimRejectionTabProps) {
    const [selectedReason, setSelectedReason] = useState(REJECTION_REASONS[0]);
    const [additionalDetails, setAdditionalDetails] = useState("");
    const [nrInregistrare, setNrInregistrare] = useState("");

    const isRejected = claim?.status === 'Respins';

    // Pre-filled data from claim + policy
    const seriePolita = policy?.id || claim?.policyId || "—";
    const nrDosar = claim?.id || "—";
    const numeAsigurat = claim?.holderName || policy?.holder || "—";
    const dataEveniment = claim?.date || "—";
    const cnp = policy?.cnp || "—";

    const today = new Date().toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    const fullReason = useMemo(() => {
        if (selectedReason === "Altul (specificați mai jos)" && additionalDetails) {
            return additionalDetails;
        }
        if (additionalDetails && selectedReason !== "Altul (specificați mai jos)") {
            return `${selectedReason}. ${additionalDetails}`;
        }
        return selectedReason;
    }, [selectedReason, additionalDetails]);

    const rejectionLetter = useMemo(() => {
        return `${nrInregistrare ? `Numar inregistrare: ${nrInregistrare}\n\n` : ''}Draga ${numeAsigurat},

Urmare a notificarii societatii NN Asigurari S.A. in data de ${today} cu privire la producerea unui eveniment prin polita de asigurare locuinta NN nr. ${seriePolita}, te informam ca am deschis dosarul de dauna cu numarul ${nrDosar}.

Potrivit informatiilor si documentelor primite, intelegem ca in data de ${dataEveniment} a avut loc evenimentul asigurat.

${fullReason}

Oricand vei dori sa ne suni sau sa ne scrii direct, iti raspundem cu placere la numarul de telefon ori la adresa de email mentionate mai jos.

NN Asigurari S.A.

Prin,

Director General Adjunct                                    Specialist evaluare daune`;
    }, [fullReason, seriePolita, nrDosar, numeAsigurat, dataEveniment, today, nrInregistrare]);

    const handleGeneratePDF = async () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const rightMargin = pageWidth - margin;
        const maxLineWidth = pageWidth - margin * 2;

        // --- Logo (top-left) ---
        try {
            const response = await fetch('/nn-logo.png');
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
            doc.addImage(base64, 'PNG', margin, 10, 35, 18);
        } catch (e) {
            console.warn('Could not load NN logo for PDF', e);
        }

        // --- Header: Nr inregistrare (top-right) ---
        if (nrInregistrare) {
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(strip(`Numar inregistrare: ${nrInregistrare}`), rightMargin, 25, { align: "right" });
        }

        // --- Greeting (bold, larger) ---
        let y = 40;
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(230, 120, 0); // Orange color like NN
        doc.text(strip(`Draga ${numeAsigurat},`), margin, y);
        doc.setTextColor(0, 0, 0); // Reset to black
        y += 12;

        // --- Body paragraph 1: Notification ---
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const p1 = doc.splitTextToSize(
            strip(`Urmare a notificarii societatii NN Asigurari S.A. in data de ${today} cu privire la producerea unui eveniment prin polita de asigurare locuinta NN nr. ${seriePolita}, te informam ca am deschis dosarul de dauna cu numarul ${nrDosar}.`),
            maxLineWidth
        );
        doc.text(p1, margin, y);
        y += p1.length * 5 + 6;

        // --- Body paragraph 2: Event understanding ---
        const p2 = doc.splitTextToSize(
            strip(`Potrivit informatiilor si documentelor primite, intelegem ca in data de ${dataEveniment} a avut loc evenimentul asigurat.`),
            maxLineWidth
        );
        doc.text(p2, margin, y);
        y += p2.length * 5 + 6;

        // --- Rejection reason paragraph ---
        const reasonLines = doc.splitTextToSize(strip(fullReason), maxLineWidth);
        doc.text(reasonLines, margin, y);
        y += reasonLines.length * 5 + 10;

        // --- Contact paragraph ---
        const contactP = doc.splitTextToSize(
            strip("Oricand vei dori sa ne suni sau sa ne scrii direct, iti raspundem cu placere la numarul de telefon ori la adresa de email mentionate mai jos."),
            maxLineWidth
        );
        doc.text(contactP, margin, y);
        y += contactP.length * 5 + 10;

        // --- Signature block (full image: company name, Prin, names, titles, handwritten signatures) ---
        try {
            const sigResponse = await fetch('/nn-signatures.png');
            const sigBlob = await sigResponse.blob();
            const sigBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(sigBlob);
            });
            // Image aspect ratio ~1024x310 → scale to fit maxLineWidth
            const imgWidth = maxLineWidth;
            const imgHeight = imgWidth * (310 / 1024);
            doc.addImage(sigBase64, 'PNG', margin, y, imgWidth, imgHeight);
            y += imgHeight + 5;
        } catch (e) {
            console.warn('Could not load signatures for PDF', e);
            // Fallback: text-only
            doc.setFont("helvetica", "normal");
            doc.text("NN Asigurari S.A.", margin, y); y += 8;
            doc.text("Prin,", margin, y); y += 10;
            doc.setFont("helvetica", "bold");
            doc.text("Mihai Nedelea", margin, y);
            doc.text("Stanca Gheorghe", rightMargin, y, { align: "right" }); y += 5;
            doc.setFont("helvetica", "normal");
            doc.text("Director General Adjunct", margin, y);
            doc.text("Specialist evaluare daune", rightMargin, y, { align: "right" }); y += 20;
        }

        // --- Footer ---
        const footerY = pageHeight - 30;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.line(margin, footerY - 3, rightMargin, footerY - 3);

        // Line 1: Company name bold
        doc.setFont("helvetica", "bold");
        doc.text(strip("NN Asigurari S.A."), margin, footerY);
        doc.setFont("helvetica", "normal");

        // Line 2: Address
        doc.text(strip("Str. Costache Negri nr. 1-5, etaj 3 Sector 5, 050552 Bucuresti, Romania"), margin, footerY + 4);

        // Line 3: www + phone + email
        doc.setTextColor(0, 100, 200);
        doc.text("www.nn.ro", margin, footerY + 8);
        doc.setTextColor(100, 100, 100);
        doc.text("T: +40 21 9464", margin + 35, footerY + 8);
        doc.setTextColor(0, 100, 200);
        doc.text("E: AsigurareLocuinta@nn.ro", rightMargin, footerY + 8, { align: "right" });
        doc.setTextColor(100, 100, 100);

        // Line 4: Registration details
        doc.text(strip("Registrul Comertului: J2020009649400; Cod Unic de Inregistrare: 42898560; Societate autorizata de Autoritatea de Supraveghere Financiara"), margin, footerY + 12);

        // Line 5: ASF code + capital
        doc.text(strip(", cod: RA-068/24.09.2020; Capital social subscris si varsat integral 67.406.395 lei"), margin, footerY + 16);

        doc.save(`Respingere_Dosar_${strip(nrDosar)}.pdf`);
    };

    const handleReject = () => {
        if (!onReject) return;
        const contractorReserve = parseFloat(claim?.reserve?.contractor || '0');
        const confirmMsg = contractorReserve > 0
            ? `Sigur doriți să RESPINGEȚI acest dosar?\n\n• Statusul va deveni "Respins"\n• Rezervele asigurat (Materiale, Manoperă, Altele, Legal) vor fi ANULATE\n• Rezerva Contractor (${contractorReserve} RON) va fi PĂSTRATĂ — puteți face referat de plată pentru Contractor\n\nAceastă acțiune nu poate fi anulată.`
            : `Sigur doriți să RESPINGEȚI acest dosar?\n\n• Statusul va deveni "Respins"\n• Toate rezervele asigurat vor fi ANULATE\n\nAceastă acțiune nu poate fi anulată.`;

        if (!confirm(confirmMsg)) return;
        onReject(fullReason);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-500" />
                        Adresă de Respingere
                        {isRejected && (
                            <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full ml-2 font-bold">
                                DOSAR RESPINS
                            </span>
                        )}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleGeneratePDF}
                            variant="outline"
                            className="border-red-200 text-red-700 hover:bg-red-50 flex items-center gap-2"
                        >
                            <FileDown className="w-4 h-4" /> Generează PDF
                        </Button>
                        {!isRejected && onReject && (
                            <Button
                                onClick={handleReject}
                                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                                disabled={readOnly}
                            >
                                <AlertTriangle className="w-4 h-4" /> Respinge Dosarul
                            </Button>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Info banner when rejected */}
                {isRejected && parseFloat(claim?.reserve?.contractor || '0') > 0 && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-800 p-4 rounded text-sm">
                        <p className="font-bold">Dosarul a fost respins</p>
                        <p>Rezerva Contractor ({claim?.reserve?.contractor} RON) este încă activă. Puteți accesa tab-ul <strong>REFERAT PLATA</strong> pentru a întocmi referat de plată Contractor.</p>
                    </div>
                )}

                {/* Pre-filled read-only fields */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500 font-semibold">Serie Poliță</Label>
                        <div className="bg-gray-50 border rounded-md px-3 py-2 text-sm font-medium text-gray-800">
                            {seriePolita}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500 font-semibold">Nr. Dosar Daună</Label>
                        <div className="bg-gray-50 border rounded-md px-3 py-2 text-sm font-medium text-gray-800">
                            {nrDosar}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500 font-semibold">Nume Asigurat</Label>
                        <div className="bg-gray-50 border rounded-md px-3 py-2 text-sm font-medium text-gray-800">
                            {numeAsigurat}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500 font-semibold">Data Eveniment</Label>
                        <div className="bg-gray-50 border rounded-md px-3 py-2 text-sm font-medium text-gray-800">
                            {dataEveniment}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500 font-semibold">Nr. Înregistrare</Label>
                        <input
                            type="text"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Completați nr. înregistrare..."
                            value={nrInregistrare}
                            onChange={(e) => setNrInregistrare(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500 font-semibold">CNP Asigurat</Label>
                        <div className="bg-gray-50 border rounded-md px-3 py-2 text-sm font-medium text-gray-800">
                            {cnp}
                        </div>
                    </div>
                </div>

                {/* Rejection reason */}
                <div className="space-y-2">
                    <Label className="font-semibold">Motiv Respingere</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={selectedReason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        disabled={isRejected}
                    >
                        {REJECTION_REASONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>

                {/* Additional details */}
                <div className="space-y-2">
                    <Label className="font-semibold">
                        {selectedReason === "Altul (specificați mai jos)"
                            ? "Specificați motivul respingerii"
                            : "Detalii Suplimentare (opțional)"}
                    </Label>
                    <Textarea
                        placeholder="Adăugați detalii sau observații suplimentare..."
                        value={additionalDetails}
                        onChange={(e) => setAdditionalDetails(e.target.value)}
                        rows={3}
                        disabled={isRejected}
                    />
                </div>

                {/* Letter preview */}
                <div className="space-y-2">
                    <Label className="font-semibold text-gray-600">Previzualizare Adresă de Respingere</Label>
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-lg p-6 text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed max-h-[400px] overflow-y-auto">
                        {rejectionLetter}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
