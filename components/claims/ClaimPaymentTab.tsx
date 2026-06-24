
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronDown, Banknote, Clock, Download, FileText, Eye } from "lucide-react";

import { Claim, ClaimPayment } from "@/types";

interface ClaimPaymentTabProps {
    claim: Claim;
    onEdit: (index: number) => void;
    onValidate?: (index: number) => void;
    readOnly?: boolean;
}

export function ClaimPaymentTab({ claim, onEdit, onValidate, readOnly = false }: ClaimPaymentTabProps) {
    const payments = claim?.payments || (claim?.payment ? [claim.payment] : []);
    const unvalidatedPayments = payments.map((p: ClaimPayment, idx: number) => ({ ...p, originalIndex: idx }))
        .filter((p: any) => !p.validated);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [viewingProof, setViewingProof] = useState<any>(null);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Referate de Plată Despăgubire</span>
                        {onValidate && unvalidatedPayments.length > 0 && !readOnly && (
                            <div className="relative">
                                <Button
                                    variant="outline"
                                    className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 flex items-center gap-2"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    Validează Referat <ChevronDown className="w-4 h-4" />
                                </Button>
                                {isDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-72 bg-white border rounded-md shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
                                        {unvalidatedPayments.map((p: any) => (
                                            <button
                                                key={p.originalIndex}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
                                                onClick={() => {
                                                    onValidate(p.originalIndex);
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                Validează Referat #{p.originalIndex + 1} - <strong>{p.amount} RON</strong>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {isDropdownOpen && (
                                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                )}
                            </div>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        {payments.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {payments.map((payment: any, idx: number) => (
                                    <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4 relative group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2 text-green-700 font-semibold">
                                                <CheckCircle className="w-5 h-5" /> Referat #{idx + 1}
                                                {payment.validated && (
                                                    <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                                                        VALIDAT
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => onEdit(idx)} disabled={readOnly}>
                                                    {readOnly ? 'Vizualizează' : 'Editează'}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                                            <div className="col-span-2 border-b pb-1 font-semibold text-gray-800">Detalii Beneficiar</div>
                                            <div><span className="font-medium">Nume:</span> {payment.beneficiaryName}</div>
                                            <div><span className="font-medium">CNP:</span> {payment.cnp}</div>
                                            <div><span className="font-medium">Telefon:</span> {payment.phone}</div>
                                            <div><span className="font-medium">Email:</span> {payment.email}</div>
                                            <div className="col-span-2"><span className="font-medium">Adresa:</span> {payment.address}</div>

                                            <div className="col-span-2 border-b pb-1 mt-2 font-semibold text-gray-800">Detalii Plată</div>
                                            <div><span className="font-medium">Suma Aprobată:</span> {payment.amount} RON</div>
                                            <div><span className="font-medium">Dată Plată CONTA:</span> {payment.date}</div>
                                            <div><span className="font-medium">Banca:</span> {payment.bank}</div>
                                            <div><span className="font-medium">IBAN:</span> {payment.iban}</div>

                                            <div><span className="font-medium">Data Cerere:</span> {payment.claimDate}</div>
                                            <div><span className="font-medium">Data Înregistrare:</span> {payment.registrationDate}</div>

                                            <div className="col-span-2 border-t pt-2 mt-2"><span className="font-medium">Detalii / Obs:</span> {payment.details}</div>

                                            {/* Payment status from Financiar */}
                                            {payment.paidAt ? (
                                                <div className="col-span-2 mt-2 space-y-2">
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
                                                        <Banknote className="w-5 h-5 text-blue-600 shrink-0" />
                                                        <div>
                                                            <div className="font-semibold text-blue-700 text-sm">✅ PLĂTIT DE FINANCIAR</div>
                                                            <div className="text-xs text-blue-600">Data plății: {new Date(payment.paidAt).toLocaleDateString('ro-RO')} la ora {new Date(payment.paidAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</div>
                                                        </div>
                                                    </div>
                                                    {/* Payment proof attachment */}
                                                    {payment.paymentProof && (
                                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-green-700">
                                                                    <FileText className="w-4 h-4" />
                                                                    <div>
                                                                        <div className="font-medium text-sm">📎 Dovadă Plată Financiar</div>
                                                                        <div className="text-xs text-green-600">
                                                                            {payment.paymentProof.name}
                                                                            {payment.paymentProof.uploadedAt && (
                                                                                <span className="ml-2 text-green-500">
                                                                                    ({new Date(payment.paymentProof.uploadedAt).toLocaleDateString('ro-RO')})
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {payment.paymentProof.content && payment.paymentProof.type?.startsWith('image/') && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-100"
                                                                            onClick={() => setViewingProof(payment.paymentProof)}
                                                                        >
                                                                            <Eye className="w-3 h-3" /> Vizualizează
                                                                        </Button>
                                                                    )}
                                                                    {payment.paymentProof.content && (
                                                                        <a href={payment.paymentProof.content} download={payment.paymentProof.name}>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-100"
                                                                            >
                                                                                <Download className="w-3 h-3" /> Descarcă
                                                                            </Button>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : payment.validated ? (
                                                <div className="col-span-2 mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                                                    <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                                                    <div>
                                                        <div className="font-semibold text-amber-700 text-sm">În așteptare — trimis la Financiar</div>
                                                        <div className="text-xs text-amber-600">Referatul a fost validat și este în curs de procesare de către departamentul financiar.</div>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8">
                                <p className="text-gray-500 mb-4">Nu există referate de plată.</p>
                            </div>
                        )}

                        {payments.length < 5 && !readOnly && (
                            <Button
                                onClick={() => onEdit(-1)}
                                className="w-full border-dashed border-2 bg-transparent hover:bg-gray-50 text-gray-600"
                                variant="outline"
                            >
                                + Adaugă Referat de Plată ({payments.length}/5)
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Proof Viewer Modal */}
            {
                viewingProof && (
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
                                    <p>Descarcă fișierul pentru vizualizare.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </>
    );
}
