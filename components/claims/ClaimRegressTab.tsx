import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { History, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import { Claim } from "@/types";

interface ClaimRegressTabProps {
    claim: Claim;
    onManage: () => void;
    onUpdate?: () => void;
    onRefresh?: () => void;
    readOnly?: boolean;
}

export function ClaimRegressTab({ claim, onManage, onUpdate, onRefresh, readOnly = false }: ClaimRegressTabProps) {

    // if (!claim?.hasRegress && !claim?.regress) return null; // Allow rendering to show "Initiate" button if tab is active


    const isRegressFile = claim.id?.endsWith("-REGRES") || claim.type === "Dosar Regres";

    const updateStatus = async (newStatus: string) => {
        if (claim.status === newStatus) return;

        const updatedClaim = {
            ...claim,
            status: newStatus,
            history: [
                ...(claim.history || []),
                {
                    date: new Date().toISOString(),
                    event: 'Schimbare Status',
                    details: `Status schimbat automat în "${newStatus}"`,
                    user: 'Admin' // Should be dynamic user
                }
            ]
        };

        try {
            const res = await fetch(`/api/claims/${encodeURIComponent(claim.id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedClaim)
            });
            if (res.ok) {
                if (onRefresh) onRefresh();
            }
        } catch (e) {
            console.error("Failed to update status", e);
        }
    };

    const handleGeneratePDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(234, 88, 12); // Orange-600
        doc.text("NN Asigurari", 20, 20);

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text("SOLICITARE DE PLATA / RECUPERARE PREJUDICIU", 20, 40);

        // Reference & Details
        doc.setFontSize(10);
        doc.text(`Data: ${new Date().toLocaleDateString('ro-RO')}`, 150, 50);

        // Claim Details Section
        doc.setDrawColor(200);
        doc.line(20, 55, 190, 55);

        doc.setFont("helvetica", "bold");
        doc.text("Detalii Dosar:", 20, 65);
        doc.setFont("helvetica", "normal");

        doc.text(`Nr. Dosar Dauna: ${claim.id}`, 30, 75);
        doc.text(`Nume Asigurat: ${claim.holderName || '-'}`, 30, 80);
        doc.text(`Serie Polita: ${claim.policyId || '-'}`, 30, 85);

        // Handle multiline description
        doc.text(`Descriere Eveniment:`, 30, 90);
        const descLines = doc.splitTextToSize(claim.description || '-', 150);
        doc.text(descLines, 30, 95);

        const afterDescY = 95 + (descLines.length * 5);

        doc.line(20, afterDescY + 5, 190, afterDescY + 5);

        // To Section
        let yPos = afterDescY + 15;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Catre:", 20, yPos);
        doc.setFont("helvetica", "normal");
        yPos += 10;

        const r = claim.regress!;
        if (r.type === 'company') {
            doc.text(`Companie: ${r.companyName || '-'}`, 30, yPos);
            doc.text(`Email: ${r.companyEmail || '-'}`, 30, yPos + 5);
            doc.text(`Dosar Dauna: ${r.fileNo || '-'}`, 30, yPos + 10);
            yPos += 20;
        } else {
            doc.text(`Destinatar: ${r.name || 'Necunoscut'}`, 30, yPos);
            doc.text(`Adresa: ${r.address || '-'}`, 30, yPos + 5);
            if (r.apartment) {
                doc.text(`Apartament: ${r.apartment}`, 30, yPos + 10);
                yPos += 15;
            } else {
                yPos += 10;
            }
            doc.text(`Telefon: ${r.phone || '-'}`, 30, yPos);
            yPos += 10;
        }

        // Body Text
        yPos += 10;
        const bodyText = `Buna ziua,\n\nAceasta este o adresa de recuperare prejudiciul inaintat pe cale amiabila catre dvs.\nNe dorim ca acest prejudiciu sa fie recuperat pe cale amiabila.\n\nIn cazul in care nu veti da curs solicitarii noastre, vom fi nevoiti sa va actionam pe cale juridica.\n\nVa multumim,\nEchipa NN`;

        doc.setFontSize(11);
        doc.text(bodyText, 20, yPos, { maxWidth: 170 });

        // Update yPos for next section based on approx body text height
        yPos += 60;

        // Financial Details
        // yPos is already updated from previous sections
        doc.setDrawColor(200);
        doc.line(20, yPos, 190, yPos);
        yPos += 10;

        doc.setFont("helvetica", "bold");
        doc.text("Detalii Prejudiciu:", 20, yPos);
        yPos += 10;

        doc.setFont("helvetica", "normal");
        doc.text(`Suma de Recuperat: ${r.amount} RON`, 30, yPos);
        yPos += 7;
        doc.text(`Status Curent: ${r.status}`, 30, yPos);

        if (r.notes) {
            yPos += 10;
            doc.text(`Note: ${r.notes}`, 30, yPos);
        }

        doc.save(`${claim.id}_Solicitare_Recuperare.pdf`);

        // Update Status to "In Lucru" if currently "Deschis"
        if (claim.status === 'Deschis') {
            updateStatus('In Lucru');
        }
    };

    const handleUploadPaymentProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const reader = new FileReader();

        reader.onload = async (event) => {
            const fileData = {
                name: file.name,
                type: file.type,
                content: event.target?.result,
                category: 'payment_proof',
                uploadedAt: new Date().toISOString()
            };

            try {
                await fetch(`/api/claims/${encodeURIComponent(claim.id)}/files`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fileData)
                });
                if (onRefresh) onRefresh();
            } catch (err) {
                console.error("Upload failed", err);
                alert("Eroare la încărcare.");
            }
        };

        reader.readAsDataURL(file);
    };

    const handleValidateAndClose = async () => {
        if (!confirm("Ești sigur? Dosarul va fi marcat ca Finalizat.")) return;
        await updateStatus('Finalizat');
    };

    // Filter payment proof files
    const paymentProofs = claim.files?.filter((f: any) => f.category === 'payment_proof') || [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dosar de Regres (Recuperare Prejudiciu)</CardTitle>
            </CardHeader>
            <CardContent>
                {claim.regress ? (
                    <div className="space-y-6">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-orange-700 font-semibold mb-2">
                                <History className="w-5 h-5" /> Dosar Inițiat
                            </div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-700">
                                <div className="col-span-2 border-b border-orange-200 pb-2 mb-2">
                                    <span className="font-bold text-lg">{claim.regress.type === 'company' ? claim.regress.companyName : claim.regress.name}</span>
                                    <Badge variant="outline" className="ml-2 bg-white text-orange-700 border-orange-300">
                                        {claim.regress.type === 'company' ? 'Societate Asigurări' :
                                            claim.regress.type === 'tenant' ? 'Persoană Fizică - Chiriaș' : 'Persoană Fizică - Vecin'}
                                    </Badge>
                                </div>

                                {/* Contact Details */}
                                {claim.regress.type === 'company' ? (
                                    <>
                                        <div><span className="font-medium text-gray-500">Email:</span> {claim.regress.companyEmail}</div>
                                        <div><span className="font-medium text-gray-500">Telefon:</span> {claim.regress.companyPhone}</div>
                                        <div><span className="font-medium text-gray-500">Dosar Daună:</span> {claim.regress.fileNo || '-'}</div>
                                        <div><span className="font-medium text-gray-500">Poliță RCA/PAD:</span> {claim.regress.policyNo || '-'}</div>
                                    </>
                                ) : (
                                    <>
                                        <div><span className="font-medium text-gray-500">Adresă:</span> {claim.regress.address}, {claim.regress.apartment && `Ap. ${claim.regress.apartment}`}</div>
                                        <div><span className="font-medium text-gray-500">Telefon:</span> {claim.regress.phone}</div>
                                        <div className="col-span-2"><span className="font-medium text-gray-500">Email:</span> {claim.regress.email}</div>
                                    </>
                                )}

                                {/* Financials */}
                                <div className="col-span-2 mt-4 pt-4 border-t border-orange-200">
                                    <div className="flex justify-between items-center text-orange-900">
                                        <span className="font-medium">Suma de Recuperat:</span>
                                        <span className="font-bold text-lg">{claim.regress.amount} RON</span>
                                    </div>
                                    <p className="text-xs text-orange-600 mt-1 italic">
                                        * Asociat cu {claim.regress.linkedPayments ? claim.regress.linkedPayments.length : 0} referate de plată
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions Row 1: Manage & Generate PDF */}
                        <div className="flex gap-2">
                            <Button onClick={onManage} variant="outline" className="flex-1" disabled={readOnly || claim.regress.fileCreated}>
                                {readOnly ? "Vizualizează Detalii (Finalizat)" : "Gestionează Dosar Regres"}
                            </Button>
                            {!readOnly && (
                                isRegressFile ? (
                                    <Button onClick={handleGeneratePDF} className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md">
                                        <FileDown className="w-4 h-4 mr-2" /> Creaza Fisa PDF
                                    </Button>
                                ) : (
                                    onUpdate && (
                                        claim.regress.fileCreated ? (
                                            <Button disabled className="flex-1 bg-gray-300 text-gray-600 cursor-not-allowed shadow-none">
                                                S-a creat dosar REGRES
                                            </Button>
                                        ) : (
                                            <Button onClick={onUpdate} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md">
                                                Creaza dosar de REGRES
                                            </Button>
                                        )
                                    )
                                )
                            )}
                        </div>

                        {/* Regress File Specific Workflow */}
                        {isRegressFile && (
                            <div className="border-t pt-4 mt-4 space-y-6">
                                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        Recuperare Prejudiciu
                                    </Badge>
                                </h4>

                                {/* Financial Summary */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-50 p-3 rounded border border-green-200">
                                        <div className="text-xs text-green-600 font-semibold uppercase">Total Recuperat</div>
                                        <div className="text-xl font-bold text-green-800">
                                            {claim.regress.recoveredPayments?.reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0).toFixed(2) || '0.00'} RON
                                        </div>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded border border-red-200">
                                        <div className="text-xs text-red-600 font-semibold uppercase">Rest de Plată</div>
                                        <div className="text-xl font-bold text-red-800">
                                            {Math.max(0, parseFloat(claim.regress.amount) - (claim.regress.recoveredPayments?.reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0) || 0)).toFixed(2)} RON
                                        </div>
                                    </div>
                                </div>

                                {/* Payment History */}
                                {claim.regress.recoveredPayments && claim.regress.recoveredPayments.length > 0 && (
                                    <div className="bg-white border rounded-md overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                                <tr>
                                                    <th className="px-3 py-2">Data</th>
                                                    <th className="px-3 py-2">Detalii</th>
                                                    <th className="px-3 py-2">Suma</th>
                                                    <th className="px-3 py-2">Doc</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {claim.regress.recoveredPayments.map((p: any, idx: number) => (
                                                    <tr key={idx}>
                                                        <td className="px-3 py-2">{new Date(p.date).toLocaleDateString('ro-RO')}</td>
                                                        <td className="px-3 py-2">{p.details}</td>
                                                        <td className="px-3 py-2 font-semibold text-green-700">{p.amount} RON</td>
                                                        <td className="px-3 py-2">
                                                            {p.documentName && <FileDown className="w-4 h-4 text-gray-400" />}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Add New Payment Form - Only if NOT Read Only */}
                                {!readOnly && (
                                    <>
                                        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-4">
                                            <h5 className="font-medium text-sm text-gray-700">Înregistrează Plată / Rată</h5>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="mb-1 block text-xs">Sumă (RON)</Label>
                                                    <input
                                                        type="number"
                                                        id="payment-amount"
                                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                        placeholder="0.00"
                                                        defaultValue={Math.max(0, parseFloat(claim.regress.amount) - (claim.regress.recoveredPayments?.reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0) || 0)).toFixed(2)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="mb-1 block text-xs">Detalii (ex: Rata 1, OP 234)</Label>
                                                    <input
                                                        type="text"
                                                        id="payment-details"
                                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                        placeholder="Detalii plată..."
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="mb-1 block text-xs">Dovada Plată (Opțional)</Label>
                                                <input
                                                    type="file"
                                                    id="payment-file"
                                                    className="block w-full text-xs text-gray-500
                                                        file:mr-4 file:py-1 file:px-3
                                                        file:rounded-full file:border-0
                                                        file:text-xs file:font-semibold
                                                        file:bg-blue-50 file:text-blue-700
                                                        hover:file:bg-blue-100"
                                                    onChange={handleUploadPaymentProof}
                                                />
                                                {paymentProofs.length > 0 && (
                                                    <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                                        <FileDown className="w-3 h-3" />
                                                        Ultimul fișier: {paymentProofs[paymentProofs.length - 1].name}
                                                    </div>
                                                )}
                                            </div>

                                            <Button
                                                onClick={async () => {
                                                    const amountInput = document.getElementById('payment-amount') as HTMLInputElement;
                                                    const detailsInput = document.getElementById('payment-details') as HTMLInputElement;

                                                    if (!amountInput.value || parseFloat(amountInput.value) <= 0) {
                                                        alert("Introduceți o sumă validă.");
                                                        return;
                                                    }

                                                    if (!confirm("Confirmati înregistrarea plății?")) return;

                                                    const amount = parseFloat(amountInput.value);
                                                    const details = detailsInput.value || "Plata Parțială";

                                                    // Calculate new totals
                                                    const currentRecovered = claim.regress?.recoveredPayments?.reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0) || 0;
                                                    const totalRecovered = currentRecovered + amount;
                                                    const totalDebt = parseFloat(claim.regress?.amount || "0");

                                                    // Determine new status
                                                    let newStatus = claim.status;
                                                    let regressStatus = 'in_progress';

                                                    if (totalRecovered >= totalDebt) {
                                                        newStatus = 'Finalizat';
                                                        regressStatus = 'completed';
                                                    } else if (newStatus === 'Deschis' || newStatus === 'In Lucru') {
                                                        // Keep as In Lucru or ensure it is In Lucru
                                                        newStatus = 'In Lucru';
                                                    }

                                                    // Update Claim
                                                    const newPayment = {
                                                        date: new Date().toISOString(),
                                                        amount: amount.toString(),
                                                        details: details,
                                                        documentName: paymentProofs.length > 0 ? paymentProofs[paymentProofs.length - 1].name : undefined
                                                    };

                                                    const updatedClaim = {
                                                        ...claim,
                                                        status: newStatus,
                                                        regress: {
                                                            ...claim.regress,
                                                            status: regressStatus,
                                                            recoveredPayments: [...(claim.regress?.recoveredPayments || []), newPayment]
                                                        } as any,
                                                        history: [
                                                            ...(claim.history || []),
                                                            {
                                                                date: new Date().toISOString(),
                                                                event: totalRecovered >= totalDebt ? 'Recuperare Integrală' : 'Plată Parțială',
                                                                details: `Recuperat: ${amount} RON. Total Recuperat: ${totalRecovered}/${totalDebt}. ${details}`,
                                                                user: 'Admin'
                                                            }
                                                        ]
                                                    };

                                                    try {
                                                        const res = await fetch(`/api/claims/${encodeURIComponent(claim.id)}`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify(updatedClaim)
                                                        });
                                                        if (res.ok) {
                                                            if (onRefresh) onRefresh();
                                                            // Clear inputs
                                                            amountInput.value = "";
                                                            detailsInput.value = "";
                                                            if (newStatus === 'Finalizat') alert("Dosar Finalizat! Suma a fost recuperată integral.");
                                                        }
                                                    } catch (e) {
                                                        console.error(e);
                                                        alert("Eroare la salvare.");
                                                    }

                                                }}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                Înregistrează Plată
                                            </Button>
                                        </div>

                                        {/* Validate & Close Button - only if manual validation needed separately from payments,
                                            but logic above handles finalization. keeping distinct for manual override if needed?
                                            Actually, let's keep it as "Force Close" or similar if debt not fully paid but we want to close.
                                        */}
                                        <Button
                                            onClick={handleValidateAndClose}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
                                            disabled={paymentProofs.length === 0}
                                        >
                                            Validează și Închide Dosar (Manual)
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                        <p className="text-gray-500 mb-4">Nu există dosar de regres inițiat.</p>
                        <Button onClick={onManage} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md" disabled={readOnly}>
                            Inițiază Dosar Regres
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
