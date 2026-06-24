"use client";

import { DraggableModal } from "@/components/ui/draggable-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CollaboratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    collab: any;
    setCollab: (c: any) => void;
    onSave: () => void;
    isEditing: boolean;
}

const COUNTIES = [
    "București - Sector 1", "București - Sector 2", "București - Sector 3",
    "București - Sector 4", "București - Sector 5", "București - Sector 6",
    "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani",
    "Brașov", "Brăila", "Buzău", "Caraș-Severin", "Călărași", "Cluj",
    "Constanța", "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu",
    "Gorj", "Harghita", "Hunedoara", "Ialomița", "Iași", "Ilfov",
    "Maramureș", "Mehedinți", "Mureș", "Neamț", "Olt", "Prahova",
    "Satu Mare", "Sălaj", "Sibiu", "Suceava", "Teleorman", "Timiș",
    "Tulcea", "Vaslui", "Vâlcea", "Vrancea"
];

export function CollaboratorModal({ isOpen, onClose, collab, setCollab, onSave, isEditing }: CollaboratorModalProps) {
    return (
        <DraggableModal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editează Colaborator" : "Adaugă Colaborator Nou"}
            initialWidth={800}
            initialHeight={700}
        >
            <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 border-b pb-2 mb-2 font-semibold text-gray-700">Date Generale</div>

                    <div>
                        <Label>Tip Colaborator</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={collab.type || 'contractor'}
                            onChange={(e) => setCollab({ ...collab, type: e.target.value })}
                        >
                            <option value="contractor">Contractor Extern</option>
                            <option value="legal">Legal / Avocat</option>
                            <option value="expert">Expert Judiciar</option>
                        </select>
                    </div>
                    <div>
                        <Label>Nume Companie / PFA</Label>
                        <Input
                            value={collab.companyName || ''}
                            onChange={(e) => setCollab({ ...collab, companyName: e.target.value })}
                            placeholder="Ex: Expert SRL"
                        />
                    </div>
                    <div>
                        <Label>CUI / CIF</Label>
                        <Input
                            value={collab.cui || ''}
                            onChange={(e) => setCollab({ ...collab, cui: e.target.value })}
                            placeholder="RO123456"
                        />
                    </div>
                    <div>
                        <Label>Nr. Reg. Comerțului</Label>
                        <Input
                            value={collab.regCom || ''}
                            onChange={(e) => setCollab({ ...collab, regCom: e.target.value })}
                            placeholder="J40/..."
                        />
                    </div>

                    <div className="col-span-2 border-b pb-2 mb-2 mt-4 font-semibold text-gray-700">Adresă & Contact</div>

                    <div>
                        <Label>Județ / Sector</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={collab.county || ''}
                            onChange={(e) => {
                                const newCounty = e.target.value;
                                const isBuc = newCounty.includes("București");
                                setCollab({
                                    ...collab,
                                    county: newCounty,
                                    city: isBuc ? 'București' : (collab.city || '') // Auto-set city if Bucharest
                                });
                            }}
                        >
                            <option value="">Alege Județ...</option>
                            {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    {!(collab.county && collab.county.includes("București")) && (
                        <div>
                            <Label>Localitate / Oraș</Label>
                            <Input
                                value={collab.city || ''}
                                onChange={(e) => setCollab({ ...collab, city: e.target.value })}
                            />
                        </div>
                    )}
                    <div className="col-span-2">
                        <Label>Strada</Label>
                        <Input
                            value={collab.street || ''}
                            onChange={(e) => setCollab({ ...collab, street: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2 col-span-2">
                        <div>
                            <Label>Număr</Label>
                            <Input value={collab.number || ''} onChange={(e) => setCollab({ ...collab, number: e.target.value })} />
                        </div>
                        <div>
                            <Label>Bloc</Label>
                            <Input value={collab.bloc || ''} onChange={(e) => setCollab({ ...collab, bloc: e.target.value })} />
                        </div>
                        <div>
                            <Label>Apartament</Label>
                            <Input value={collab.apartment || ''} onChange={(e) => setCollab({ ...collab, apartment: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={collab.email || ''}
                            onChange={(e) => setCollab({ ...collab, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label>Telefon</Label>
                        <Input
                            value={collab.phone || ''}
                            onChange={(e) => setCollab({ ...collab, phone: e.target.value })}
                        />
                    </div>

                    <div className="col-span-2 border-b pb-2 mb-2 mt-4 font-semibold text-gray-700">Informații Bancare & Detalii</div>

                    <div>
                        <Label>Banca</Label>
                        <Input
                            value={collab.bank || ''}
                            onChange={(e) => setCollab({ ...collab, bank: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label>IBAN</Label>
                        <Input
                            value={collab.iban || ''}
                            onChange={(e) => {
                                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                setCollab({ ...collab, iban: val });
                            }}
                        />
                    </div>
                    <div className="col-span-2">
                        <Label>Alte Detalii / Note</Label>
                        <Textarea
                            rows={3}
                            value={collab.details || ''}
                            onChange={(e) => setCollab({ ...collab, details: e.target.value })}
                        />
                    </div>

                </div>

                <div className="flex justify-end pt-4 gap-2">
                    <Button variant="outline" onClick={onClose}>Anulează</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={onSave}>
                        Salvează Colaborator
                    </Button>
                </div>
            </div>
        </DraggableModal>
    );
}
