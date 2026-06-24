
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { RISCURI_ASIGURATE } from "@/lib/riscuri";
import { Claim, Policy } from "@/types";

interface ClaimNotificationTabProps {
    claim: Claim;
    setClaim: (claim: Claim) => void;
    onSave: () => void;
    policy?: Policy | null;
    readOnly?: boolean;
}

export function ClaimNotificationTab({ claim, setClaim, onSave, policy, readOnly = false }: ClaimNotificationTabProps) {
    if (!claim) return null;

    // If created from avizare, the tab is fully read-only with no save button
    const fromAvizare = !!(claim as any).avizareId;
    const isLocked = readOnly || fromAvizare;

    // Determine address to display
    const getAddress = () => {
        if (!policy) return null;
        const p = policy as any;
        // Priority: insuredLocations > address > details.localitate
        if (p.insuredLocations && p.insuredLocations.length > 0) {
            return { addr: p.insuredLocations.join('; '), source: 'Locația Asigurată' };
        }
        if (p.address) {
            return { addr: p.address, source: 'Adresa Detaliată' };
        }
        if (p.details?.localitate) {
            return { addr: p.details.localitate, source: 'Adresa Detaliată' };
        }
        return null;
    };

    const addressInfo = getAddress();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Avizare Daună</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

                {/* Serie Poliță & Nume Asigurat - always show when we have policy data */}
                {(fromAvizare || policy) && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Serie Poliță</Label>
                            <div className="p-3 rounded-md border bg-gray-50 text-sm font-medium text-gray-800">
                                {claim.policyId || '—'}
                            </div>
                        </div>
                        <div>
                            <Label>Nume Asigurat</Label>
                            <div className="p-3 rounded-md border bg-gray-50 text-sm font-medium text-gray-800">
                                {claim.holderName || '—'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Adresa Locație Asigurată */}
                {addressInfo && (
                    <div>
                        <Label>Adresa Locație Asigurată</Label>
                        <div className="p-3 rounded-md border bg-blue-50 border-blue-200 text-blue-800 text-sm">
                            <p className="font-medium">{addressInfo.addr}</p>
                            <p className="text-xs text-blue-500 mt-1">
                                Din: {addressInfo.source}
                            </p>
                        </div>
                    </div>
                )}

                {/* Valabilitate Poliță */}
                {policy && (policy as any).startDate && (
                    <div>
                        <div className="p-3 rounded-md border bg-green-50 border-green-200 text-green-700 text-sm font-bold">
                            Valabilitate Poliță: {(policy as any).startDate} — {(policy as any).expiry}
                        </div>
                    </div>
                )}

                {/* Data Avizare */}
                {(claim as any).dataAvizare && (
                    <div>
                        <Label>Data Avizare</Label>
                        <div className="p-3 rounded-md border bg-gray-50 text-sm font-medium text-gray-800">
                            {(claim as any).dataAvizare}
                        </div>
                    </div>
                )}

                {/* Data & Ora Eveniment */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Data Eveniment</Label>
                        {isLocked ? (
                            <div className="p-3 rounded-md border bg-gray-50 text-sm font-medium text-gray-800">
                                {claim.date || '—'}
                            </div>
                        ) : (
                            <Input
                                type="date"
                                value={claim.date || ''}
                                onChange={(e) => setClaim({ ...claim, date: e.target.value })}
                            />
                        )}
                    </div>
                    <div>
                        <Label>Ora Eveniment</Label>
                        {isLocked ? (
                            <div className="p-3 rounded-md border bg-gray-50 text-sm font-medium text-gray-800">
                                {claim.time || '—'}
                            </div>
                        ) : (
                            <Input
                                type="time"
                                value={claim.time || ''}
                                onChange={(e) => setClaim({ ...claim, time: e.target.value })}
                            />
                        )}
                    </div>
                </div>

                {/* Tip Risc / Cauza Evenimentului */}
                <div>
                    <Label className="flex items-center gap-1.5 mb-1">
                        <ShieldCheck className="w-4 h-4 text-orange-500" />
                        Tip Risc / Cauza Evenimentului
                    </Label>
                    {isLocked ? (
                        <div className="p-3 rounded-md border bg-gray-50 text-sm font-medium text-gray-800">
                            {(claim as any).cause || '—'}
                        </div>
                    ) : (
                        <select
                            value={(claim as any).cause || ''}
                            onChange={(e) => setClaim({ ...claim, cause: e.target.value } as any)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">— Selectează riscul —</option>
                            {RISCURI_ASIGURATE.map((risc) => (
                                <option key={risc} value={risc}>{risc}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Descriere Detaliată */}
                <div>
                    <Label>Descriere Detailată</Label>
                    {isLocked ? (
                        <div className="p-3 rounded-md border bg-gray-50 text-sm font-medium text-gray-800 min-h-[80px] whitespace-pre-wrap">
                            {claim.description || '—'}
                        </div>
                    ) : (
                        <Textarea
                            placeholder="Descrie cum s-a produs evenimentul..."
                            className="min-h-[100px]"
                            value={claim.description || ''}
                            onChange={(e) => setClaim({ ...claim, description: e.target.value })}
                        />
                    )}
                </div>

                {/* Save button - only if not locked */}
                {!isLocked && (
                    <div className="flex justify-end pt-4 border-t">
                        <Button onClick={onSave} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md">Salvează Detalii Avizare</Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
