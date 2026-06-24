"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COUNTIES = [
    "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani", "Brăila", "Brașov",
    "București - Sector 1", "București - Sector 2", "București - Sector 3", "București - Sector 4", "București - Sector 5", "București - Sector 6",
    "Buzău", "Călărași", "Caraș-Severin", "Cluj", "Constanța", "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu", "Gorj",
    "Harghita", "Hunedoara", "Ialomița", "Iași", "Ilfov", "Maramureș", "Mehedinți", "Mureș", "Neamț", "Olt", "Prahova",
    "Sălaj", "Satu Mare", "Sibiu", "Suceava", "Teleorman", "Timiș", "Tulcea", "Vâlcea", "Vaslui", "Vrancea"
];

export { COUNTIES };

interface InsuredLocationManagerProps {
    existingLocations: string[];
    onAdd: (loc: string) => void;
}

export function InsuredLocationManager({ existingLocations, onAdd }: InsuredLocationManagerProps) {
    const [altLocalitate, setAltLocalitate] = useState(COUNTIES[0]);
    const [altOras, setAltOras] = useState("");
    const [altStrada, setAltStrada] = useState("");
    const [altNr, setAltNr] = useState("");
    const [altEt, setAltEt] = useState("");
    const [altAp, setAltAp] = useState("");
    const [altPropertyType, setAltPropertyType] = useState("Casa");

    const handleAdd = () => {
        if (altStrada && altNr) {
            const constructedAlt = `${altPropertyType}: ${altLocalitate}, ${(!altLocalitate.startsWith("București") && altOras) ? `Oras ${altOras}, ` : ""}Str. ${altStrada}, Nr. ${altNr}${altEt ? `, Et. ${altEt}` : ""}${altAp ? `, Ap. ${altAp}` : ""}`;
            if (!existingLocations.includes(constructedAlt)) {
                onAdd(constructedAlt);
                // Reset
                setAltLocalitate(COUNTIES[0]);
                setAltOras("");
                setAltStrada("");
                setAltNr("");
                setAltEt("");
                setAltAp("");
                setAltPropertyType("Casa");
            }
        }
    };

    return (
        <div className="space-y-2 border p-3 rounded-md bg-gray-50 mt-2">
            <h5 className="font-medium text-sm">Add New Location</h5>
            <div className="grid grid-cols-2 gap-4">
                <div className={`space-y-2 ${altLocalitate.startsWith("București") ? "col-span-2" : ""}`}>
                    <Label>Localitate</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={altLocalitate}
                        onChange={(e) => setAltLocalitate(e.target.value)}
                    >
                        {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                {!altLocalitate.startsWith("București") && (
                    <div className="space-y-2">
                        <Label>Oras</Label>
                        <Input value={altOras} onChange={e => setAltOras(e.target.value)} placeholder="Oras" />
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label>Tip Imobil</Label>
                <div className="flex gap-4">
                    {["Casa", "Apartament", "Imobil-altul"].map((type) => (
                        <label key={type} className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="altPropertyTypeManager"
                                value={type}
                                checked={altPropertyType === type}
                                onChange={() => setAltPropertyType(type)}
                                className="form-radio h-4 w-4 text-primary"
                            />
                            <span className="text-sm font-medium">{type}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label>Adresa</Label>
                <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-2">
                        <Input placeholder="Strada" value={altStrada} onChange={e => setAltStrada(e.target.value)} />
                    </div>
                    <Input placeholder="Nr." value={altNr} onChange={e => setAltNr(e.target.value)} />
                    <Input placeholder="Et." value={altEt} onChange={e => setAltEt(e.target.value)} />
                    <Input placeholder="Ap." value={altAp} onChange={e => setAltAp(e.target.value)} />
                </div>
            </div>
            <div className="flex justify-end">
                <Button type="button" onClick={handleAdd} size="sm" disabled={!altStrada || !altNr}>
                    Add Location
                </Button>
            </div>
        </div>
    );
}
