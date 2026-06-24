"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { XCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { calculateTotalPremium } from "@/lib/utils";
import { Policy } from "@/types";
import { COUNTIES, InsuredLocationManager } from "./InsuredLocationManager";

interface PolicyEditDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    policy: Policy | null;
    onSaved: () => void;
}

export function PolicyEditDialog({ isOpen, onOpenChange, policy, onSaved }: PolicyEditDialogProps) {
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState<any>(null);

    useEffect(() => {
        if (policy) {
            setEditData(policy);
        }
    }, [policy]);

    // Auto-calculate total premium when editing
    useEffect(() => {
        if (!editData?.details) return;

        const premiums = [
            editData.details.acoperiri_prima,
            editData.details.acoperiri_continut_prima,
            editData.details.acoperiri_raspundere_prima,
            editData.details.acoperiri_avarii_prima
        ];

        const newTotal = calculateTotalPremium(premiums);

        if (newTotal !== editData.details.acoperiri_total_prima) {
            setEditData((prev: any) => ({
                ...prev,
                details: {
                    ...prev.details,
                    acoperiri_total_prima: newTotal
                }
            }));
        }
    }, [
        editData?.details?.acoperiri_prima,
        editData?.details?.acoperiri_continut_prima,
        editData?.details?.acoperiri_raspundere_prima,
        editData?.details?.acoperiri_avarii_prima
    ]);

    const handleSave = async () => {
        if (!editData) return;

        // Reconstruct full address
        const d = editData.details || {};
        const constructedAddress = `${d.localitate || ''}, ${(d.localitate && !d.localitate.startsWith("București") && d.oras) ? `Oras ${d.oras}, ` : ""}Str. ${d.strada || ''}, Nr. ${d.nr || ''}${d.bl ? `, Bl. ${d.bl}` : ""}${d.sc ? `, Sc. ${d.sc}` : ""}, Et. ${d.et || ''}, Ap. ${d.ap || ''}`;

        const finalData = {
            ...editData,
            address: constructedAddress
        };

        await fetch(`/api/policies/${encodeURIComponent(editData.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalData)
        });
        onOpenChange(false);
        setEditMode(false);
        onSaved();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) setEditMode(false); }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editMode ? "Edit Policy" : "Policy Details"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Nume Asigurat</Label>
                            <Input
                                value={editData?.holder || ''}
                                onChange={e => setEditData({ ...editData, holder: e.target.value })}
                                disabled={!editMode}
                            />
                        </div>
                        <div>
                            <Label>Tip Asigurare</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                value={editData?.type || ''}
                                onChange={e => setEditData({ ...editData, type: e.target.value })}
                                disabled={!editMode}
                            >
                                <option value="" disabled>Selecteaza tip...</option>
                                <option value="Home Insurance (Facultativa)">Home Insurance (Facultativa)</option>
                                <option value="Asigurarea PAD">Asigurarea PAD</option>
                            </select>
                        </div>
                        <div>
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={editData?.startDate || ''}
                                onChange={e => setEditData({ ...editData, startDate: e.target.value })}
                                disabled={!editMode}
                            />
                        </div>
                        <div>
                            <Label>Expiry Date</Label>
                            <Input
                                type="date"
                                value={editData?.expiry || ''}
                                onChange={e => setEditData({ ...editData, expiry: e.target.value })}
                                disabled={!editMode}
                            />
                        </div>
                        <div>
                            <Label>CNP</Label>
                            <Input
                                value={editData?.cnp || ''}
                                onChange={e => setEditData({ ...editData, cnp: e.target.value })}
                                disabled={!editMode}
                            />
                        </div>
                        <div>
                            <Label>Telefon</Label>
                            <Input
                                value={editData?.phone || ''}
                                onChange={e => setEditData({ ...editData, phone: e.target.value })}
                                disabled={!editMode}
                            />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input
                                value={editData?.email || ''}
                                onChange={e => setEditData({ ...editData, email: e.target.value })}
                                disabled={!editMode}
                            />
                        </div>
                        <div>
                            <Label>Localitate</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                value={editData?.details?.localitate || COUNTIES[0]}
                                onChange={e => editMode && setEditData({ ...editData, details: { ...editData.details, localitate: e.target.value } })}
                                disabled={!editMode}
                            >
                                {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        {!editData?.details?.localitate?.startsWith("București") && (
                            <div>
                                <Label>Oras</Label>
                                <Input
                                    value={editData?.details?.oras || ''}
                                    onChange={e => setEditData({ ...editData, details: { ...editData.details, oras: e.target.value } })}
                                    disabled={!editMode}
                                />
                            </div>
                        )}

                        <div className="col-span-2 space-y-2">
                            <Label>Adresa Detaliata</Label>
                            <div className="grid grid-cols-6 gap-4">
                                <div className="col-span-6">
                                    <Input
                                        placeholder="Strada"
                                        value={editData?.details?.strada || ''}
                                        onChange={e => setEditData({ ...editData, details: { ...editData.details, strada: e.target.value } })}
                                        disabled={!editMode}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Nr.</span>
                                    <Input
                                        placeholder="Nr."
                                        value={editData?.details?.nr || ''}
                                        onChange={e => setEditData({ ...editData, details: { ...editData.details, nr: e.target.value } })}
                                        disabled={!editMode}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Bloc</span>
                                    <Input
                                        placeholder="Bl."
                                        value={editData?.details?.bl || ''}
                                        onChange={e => setEditData({ ...editData, details: { ...editData.details, bl: e.target.value } })}
                                        disabled={!editMode}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Scara</span>
                                    <Input
                                        placeholder="Sc."
                                        value={editData?.details?.sc || ''}
                                        onChange={e => setEditData({ ...editData, details: { ...editData.details, sc: e.target.value } })}
                                        disabled={!editMode}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Etaj</span>
                                    <Input
                                        placeholder="Et."
                                        value={editData?.details?.et || ''}
                                        onChange={e => setEditData({ ...editData, details: { ...editData.details, et: e.target.value } })}
                                        disabled={!editMode}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Ap.</span>
                                    <Input
                                        placeholder="Ap."
                                        value={editData?.details?.ap || ''}
                                        onChange={e => setEditData({ ...editData, details: { ...editData.details, ap: e.target.value } })}
                                        disabled={!editMode}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label>Locatia asigurata</Label>
                            {editData?.insuredLocations?.length > 0 && (
                                <div className="border rounded-md divide-y mb-2">
                                    {editData.insuredLocations.map((loc: string, idx: number) => (
                                        <div key={idx} className="p-3 bg-gray-50 flex justify-between items-center text-sm">
                                            <span>{loc}</span>
                                            {editMode && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const newLocs = [...editData.insuredLocations];
                                                        newLocs.splice(idx, 1);
                                                        setEditData({ ...editData, insuredLocations: newLocs });
                                                    }}
                                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {editMode && (
                                <InsuredLocationManager
                                    existingLocations={editData?.insuredLocations || []}
                                    onAdd={(newLoc) =>
                                        setEditData({ ...editData, insuredLocations: [...(editData?.insuredLocations || []), newLoc] })
                                    }
                                />
                            )}
                        </div>

                        <div className="col-span-2 border rounded-md p-4 bg-gray-50 space-y-4">
                            {editData?.type === "Home Insurance (Facultativa)" ? (
                                <>
                                    <h3 className="font-bold text-lg border-b pb-2 text-orange-600">Acoperiri</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-2 w-1/5">Tip bunuri asigurate/Opțiuni suplimentare</th>
                                                    <th className="text-left p-2 w-2/5">Riscuri Asigurate</th>
                                                    <th className="text-left p-2 w-1/5">Suma asigurată/Limita de despăgubire/Limita de răspundere</th>
                                                    <th className="text-left p-2 w-1/5">Franșiză</th>
                                                    <th className="text-left p-2 w-16">Prima de asigurare (EUR)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="border-b">
                                                    <td className="p-2 align-top font-medium">
                                                        Imobil locuință/construcții anexe/echipamente fixe/Cota-parte indiviză
                                                    </td>
                                                    <td className="p-2 align-top text-xs text-gray-600">
                                                        Asigurarea de bază - Flexa (incendiu, trăsnet, explozie, căderea aparatelor de zbor); fenomene naturale (furtună, uragan, vijelie, tornadă, grindină, greutate strat zăpadă, ploaie torențială, avalanșă); fenomene catastrofice (cutremur, inundații și aluviuni, alunecare și/sau prăbușire de teren); furt, vandalism, evenimente socio-politice;
                                                    </td>
                                                    <td className="p-2 align-top">
                                                        <Input
                                                            value={editData?.details?.acoperiri_suma_asigurata || ''}
                                                            onChange={e => setEditData({ ...editData, details: { ...editData.details, acoperiri_suma_asigurata: e.target.value } })}
                                                            disabled={!editMode}
                                                            className="h-8 text-sm"
                                                        />
                                                    </td>
                                                    <td className="p-2 align-top">
                                                        <textarea
                                                            value={editData?.details?.acoperiri_fransiza || ''}
                                                            onChange={e => setEditData({ ...editData, details: { ...editData.details, acoperiri_fransiza: e.target.value } })}
                                                            disabled={!editMode}
                                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        />
                                                    </td>
                                                    <td className="p-2 align-top">
                                                        <Input
                                                            value={editData?.details?.acoperiri_prima || ''}
                                                            onChange={e => setEditData({ ...editData, details: { ...editData.details, acoperiri_prima: e.target.value } })}
                                                            disabled={!editMode}
                                                            className="h-8 text-sm"
                                                        />
                                                    </td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2 align-top font-medium">
                                                        Asigurarea conținutului
                                                    </td>
                                                    <td className="p-2 align-top text-xs text-gray-600">
                                                        Asigurarea de bază - Flexa (incendiu, trăsnet, explozie, căderea aparatelor de zbor); fenomene naturale (furtună, uragan, vijelie, tornadă, grindină, greutate strat zăpadă, ploaie torențială, avalanșă); fenomene catastrofice (cutremur, inundații și aluviuni, alunecare și/sau prăbușire de teren); furt, vandalism, evenimente socio-politice; boom sonic; izbirea din exterior de vehicule, inundație de la vecini și cădere accidentală de corpuri; inundație și refulare canalizare*; spargerea bunurilor casabile*; cheltuieli suplimentare**.
                                                    </td>
                                                    <td className="p-2 align-top">
                                                        <Input
                                                            value={editData?.details?.acoperiri_continut_suma || ''}
                                                            onChange={e => setEditData({ ...editData, details: { ...editData.details, acoperiri_continut_suma: e.target.value } })}
                                                            disabled={!editMode}
                                                            className="h-8 text-sm"
                                                        />
                                                    </td>
                                                    <td className="p-2 align-top">
                                                    </td>
                                                    <td className="p-2 align-top">
                                                        <Input
                                                            value={editData?.details?.acoperiri_continut_prima || ''}
                                                            onChange={e => setEditData({ ...editData, details: { ...editData.details, acoperiri_continut_prima: e.target.value } })}
                                                            disabled={!editMode}
                                                            className="h-8 text-sm"
                                                        />
                                                    </td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2 align-top font-medium">
                                                        Răspundere civilă față de terți
                                                    </td>
                                                    <td className="p-2 align-top text-xs text-gray-600">
                                                        Conform prevederilor din Condițiile de asigurare
                                                    </td>
                                                    <td className="p-2 align-top">
                                                        <Input
                                                            value={editData?.details?.acoperiri_raspundere_suma || ''}
                                                            onChange={e => setEditData({ ...editData, details: { ...editData.details, acoperiri_raspundere_suma: e.target.value } })}
                                                            disabled={!editMode}
                                                            className="h-8 text-sm"
                                                        />
                                                    </td>
                                                    <td className="p-2 align-top">
                                                    </td>
                                                    <td className="p-2 align-top">
                                                        <Input
                                                            value={editData?.details?.acoperiri_raspundere_prima || ''}
                                                            onChange={e => setEditData({ ...editData, details: { ...editData.details, acoperiri_raspundere_prima: e.target.value } })}
                                                            disabled={!editMode}
                                                            className="h-8 text-sm"
                                                        />
                                                    </td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2 align-top font-medium">
                                                        Avarii accidentale ale instalațiilor de gaze, centrală termică, climatizare etc. și asigurarea aparatelor electrice, electronice și electrocasnice pentru fenomene electrice
                                                    </td>
                                                    <td className="p-2 align-top text-xs text-gray-600">
                                                        Conform prevederilor din Condițiile de asigurare
                                                    </td>
                                                    <td className="p-2 align-top">
                                                        <Input
                                                            value={editData?.details?.acoperiri_avarii_suma || ''}
                                                            onChange={e => setEditData({ ...editData, details: { ...editData.details, acoperiri_avarii_suma: e.target.value } })}
                                                            disabled={!editMode}
                                                            className="h-8 text-sm"
                                                        />
                                                    </td>
                                                    <td className="p-2 align-top">
                                                    </td>
                                                    <td className="p-2 align-top">
                                                        <Input
                                                            value={editData?.details?.acoperiri_avarii_prima || ''}
                                                            onChange={e => setEditData({ ...editData, details: { ...editData.details, acoperiri_avarii_prima: e.target.value } })}
                                                            disabled={!editMode}
                                                            className="h-8 text-sm"
                                                        />
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={4} className="p-2 text-right font-bold">
                                                        Total primă de asigurare
                                                    </td>
                                                    <td className="p-2 align-top">
                                                        <Input
                                                            value={editData?.details?.acoperiri_total_prima || ''}
                                                            onChange={e => setEditData({ ...editData, details: { ...editData.details, acoperiri_total_prima: e.target.value } })}
                                                            disabled={!editMode}
                                                            className="h-8 text-sm font-bold"
                                                        />
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <div className="mt-2 text-xs text-gray-500 italic space-y-1">
                                            <p>*În limita maximă de despăgubire de 1.500 EUR (echivalent în lei) pentru Asigurare pe fiecare risc asigurat</p>
                                            <p>**În limita maximă de 5% din suma asigurată pentru imobil. Despăgubirea totală în legătură cu dauna nu poate depăși suma asigurată a imobilului asigurat înscrisă în Polița de Asigurare.</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <h3 className="font-bold text-lg border-b pb-2">ASIGURAREA OBLIGATORIE PAD</h3>
                            )}
                        </div>

                    </div>


                </div>
                <DialogFooter>
                    {editMode ? (
                        <Button onClick={handleSave}>Save Changes</Button>
                    ) : (
                        <Button variant="outline" onClick={() => setEditMode(true)}>Enable Edit Mode</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
