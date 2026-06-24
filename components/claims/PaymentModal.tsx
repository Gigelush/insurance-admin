"use client";

import { DraggableModal } from "@/components/ui/draggable-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { ClaimPayment, Policy, ClaimReserve, Collaborator } from "@/types";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    tempPayment: ClaimPayment;
    setTempPayment: (payment: ClaimPayment) => void;
    policyData?: Policy | null;
    lockedAmount?: string;
    reserveData?: ClaimReserve;
    collaborators?: Collaborator[];
    onSave: () => void;
}

export function PaymentModal({
    isOpen,
    onClose,
    title,
    tempPayment,
    setTempPayment,
    onSave,
    policyData,
    lockedAmount,
    reserveData,
    collaborators = []
}: PaymentModalProps) {
    const handleAutofill = (source: any) => {
        if (!source) return;

        // Determine amount based on source type
        let amountToUse = lockedAmount || tempPayment.amount;
        let typeToUse = 'materials'; // Default to materials

        // If source is a collaborator, map to specific reserve
        if (source.type === 'contractor') {
            // Map to "Rezerva Contractor"
            amountToUse = reserveData?.contractor || reserveData?.labor || '0'; // Prioritize contractor key
            typeToUse = 'contractor';
        } else if (source.type === 'legal') {
            // Map to "Rezerva LEGAL"
            amountToUse = reserveData?.legal || '0';
            typeToUse = 'legal';
        } else if (source.type === 'expert') {
            // Map to "Rezerva EXPERT"
            amountToUse = reserveData?.other || '0';
            typeToUse = 'other';
        } else if (source.holder) {
            // Asigurat -> Rezerva DAUNA (Materiale) per user request
            amountToUse = reserveData?.materials || '0';
            typeToUse = 'materials';
        }

        setTempPayment({
            ...tempPayment,
            beneficiaryName: source.holder || source.companyName,
            cnp: source.cnp || source.cui,
            address: source.address ?
                (source.address.includes(source.city) ? source.address : `${source.city || ''}, ${source.address}`)
                : (source.city ? `${source.city}, ${source.street || ''}` : ''),
            email: source.email,
            phone: source.phone,
            bank: source.bank,
            iban: source.iban,
            amount: amountToUse,
            reserveType: typeToUse
        });
    };

    return (
        <DraggableModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            initialWidth={600}
            initialHeight={600}
        >
            <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 border-b pb-2 mb-2 font-semibold text-gray-700 flex justify-between items-center">
                        <span>Detalii Beneficiar</span>
                        <div className="flex gap-2">
                            {policyData && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7 gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                                    onClick={() => handleAutofill(policyData)}
                                >
                                    <span>👤</span> Asigurat
                                </Button>
                            )}

                            <select
                                className="h-7 text-xs border rounded bg-white px-2"
                                onChange={(e) => {
                                    const selectedId = e.target.value;
                                    if (selectedId) {
                                        const collab = collaborators.find(c => c.id === selectedId);
                                        handleAutofill(collab);
                                        e.target.value = ""; // Reset selection
                                    }
                                }}
                            >
                                <option value="">Preia Colaborator...</option>
                                <optgroup label="Contractori">
                                    {collaborators.filter(c => c.type === 'contractor').map(c => (
                                        <option key={c.id} value={c.id}>{c.companyName}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Legal">
                                    {collaborators.filter(c => c.type === 'legal').map(c => (
                                        <option key={c.id} value={c.id}>{c.companyName}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Experti">
                                    {collaborators.filter(c => c.type === 'expert').map(c => (
                                        <option key={c.id} value={c.id}>{c.companyName}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Nume și Prenume</Label>
                        <Input
                            placeholder="Nume Beneficiar..."
                            value={tempPayment.beneficiaryName || ''}
                            onChange={(e) => setTempPayment({ ...tempPayment, beneficiaryName: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>CNP / CUI</Label>
                        <Input
                            placeholder="CNP..."
                            value={tempPayment.cnp || ''}
                            onChange={(e) => setTempPayment({ ...tempPayment, cnp: e.target.value })}
                        />
                    </div>
                    <div className="col-span-2 space-y-2">
                        <Label>Adresa Completă</Label>
                        <Input
                            placeholder="Strada, Nr, Bloc, Ap, Localitate..."
                            value={tempPayment.address || ''}
                            onChange={(e) => setTempPayment({ ...tempPayment, address: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                            type="email"
                            placeholder="email@exemplu.com"
                            value={tempPayment.email || ''}
                            onChange={(e) => setTempPayment({ ...tempPayment, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Telefon</Label>
                        <Input
                            placeholder="07xx..."
                            value={tempPayment.phone || ''}
                            onChange={(e) => setTempPayment({ ...tempPayment, phone: e.target.value })}
                        />
                    </div>

                    <div className="col-span-2 border-b pb-2 mb-2 mt-2 font-semibold text-gray-700">Detalii Plată & Date</div>

                    <div className="col-span-2 space-y-2">
                        <Label>Din ce rezervă se scade?</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={tempPayment.reserveType || 'materials'}
                            onChange={(e) => setTempPayment({ ...tempPayment, reserveType: e.target.value })}
                        >
                            <option value="materials">Rezerva DAUNA (Materiale)</option>
                            <option value="contractor">Rezerva Contractor (Manoperă)</option>
                            <option value="other">Rezerva EXPERT</option>
                            <option value="legal">Rezerva LEGAL</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>Suma Aprobată (RON)</Label>
                        <Input
                            placeholder="ex. 4500.00"
                            type="number"
                            value={tempPayment.amount || ''}
                            onChange={(e) => setTempPayment({ ...tempPayment, amount: e.target.value })}
                            readOnly={!!lockedAmount} // Lock if lockedAmount is provided
                            className={lockedAmount ? "bg-gray-100 font-bold" : ""}
                        />
                        {lockedAmount && <p className="text-[10px] text-gray-500">* Fixată conform Rezervei Finale</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Dată Plată CONTA</Label>
                        <Input
                            type="date"
                            value={tempPayment.date || ''}
                            onChange={(e) => setTempPayment({ ...tempPayment, date: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Data Cerere Despăgubire <span className="text-red-500">*</span></Label>
                        <Input
                            type="date"
                            value={tempPayment.claimDate || ''}
                            onChange={(e) => setTempPayment({ ...tempPayment, claimDate: e.target.value })}
                            className={!tempPayment.claimDate ? 'border-red-300' : ''}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Data Înregistrare <span className="text-red-500">*</span></Label>
                        <Input
                            type="date"
                            value={tempPayment.registrationDate || ''}
                            onChange={(e) => setTempPayment({ ...tempPayment, registrationDate: e.target.value })}
                            className={!tempPayment.registrationDate ? 'border-red-300' : ''}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Banca</Label>
                        <Input
                            placeholder="Nume Banca..."
                            value={tempPayment.bank || ''}
                            onChange={(e) => setTempPayment({ ...tempPayment, bank: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>IBAN Beneficiar</Label>
                        <Input
                            placeholder="RO00 BTRL..."
                            value={tempPayment.iban || ''}
                            onChange={(e) => setTempPayment({ ...tempPayment, iban: e.target.value.toUpperCase() })}
                            className={tempPayment.iban && !validateIBAN(tempPayment.iban) ? "border-red-500 bg-red-50" : ""}
                        />
                        {tempPayment.iban && !validateIBAN(tempPayment.iban) && (
                            <p className="text-[10px] text-red-500 mt-1">IBAN invalid (Format: RO... 24 caractere)</p>
                        )}
                    </div>

                    <div className="col-span-2 space-y-2">
                        <Label>Detalii / Observații Plată</Label>
                        <Textarea
                            placeholder="Mențiuni interne..."
                            value={tempPayment.details || ''}
                            onChange={(e) => setTempPayment({ ...tempPayment, details: e.target.value })}
                        />
                    </div>
                </div>
                <div className="flex justify-end pt-6 border-t gap-2">
                    <Button variant="outline" onClick={onClose}>Anulează</Button>
                    <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                            if (!tempPayment.claimDate) {
                                alert("Câmpul 'Data Cerere Despăgubire' este obligatoriu!");
                                return;
                            }
                            if (!tempPayment.registrationDate) {
                                alert("Câmpul 'Data Înregistrare' este obligatoriu!");
                                return;
                            }
                            if (tempPayment.iban && !validateIBAN(tempPayment.iban)) {
                                alert("IBAN invalid! Te rugăm să introduci un IBAN corect de România.");
                                return;
                            }
                            onSave();
                        }}
                    >
                        Salvează Referat
                    </Button>
                </div>
            </div>
        </DraggableModal>
    );
}

// Helper function (can be moved to utils later)
function validateIBAN(iban: string) {
    // Basic RO IBAN validation
    // Format: RO + 2 check digits + 4 bank code + 16 alphanumeric
    // Total length: 24
    if (!iban) return false;
    const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

    if (cleanIBAN.length !== 24) return false;
    if (!cleanIBAN.startsWith('RO')) return false;

    // Check if subsequent characters are alphanumeric
    const body = cleanIBAN.slice(2);
    if (!/^[A-Z0-9]+$/.test(body)) return false;

    // Optional: Modulo 97 check could be added here for full validation
    return true;
}
