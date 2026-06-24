"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { calculateTotalPremium } from "@/lib/utils";




const COUNTIES = [
    "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani", "Brăila", "Brașov",
    "București - Sector 1", "București - Sector 2", "București - Sector 3", "București - Sector 4", "București - Sector 5", "București - Sector 6",
    "Buzău", "Călărași", "Caraș-Severin", "Cluj", "Constanța", "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu", "Gorj",
    "Harghita", "Hunedoara", "Ialomița", "Iași", "Ilfov", "Maramureș", "Mehedinți", "Mureș", "Neamț", "Olt", "Prahova",
    "Sălaj", "Satu Mare", "Sibiu", "Suceava", "Teleorman", "Timiș", "Tulcea", "Vâlcea", "Vaslui", "Vrancea"
];

export default function NewPolicyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [startDate, setStartDate] = useState("");
    const [selectedCounty, setSelectedCounty] = useState(COUNTIES[0]);
    const [selectedType, setSelectedType] = useState("Home Insurance (Facultativa)");
    const [cnpError, setCnpError] = useState("");
    const [insuredLocations, setInsuredLocations] = useState<string[]>([]);
    const [newLocation, setNewLocation] = useState("");
    const [locationSource, setLocationSource] = useState("domiciliu"); // 'domiciliu' | 'alta'

    // Premiums State for Auto-Calculation
    const [p1, setP1] = useState("153,75");
    const [p2, setP2] = useState("24,22");
    const [p3, setP3] = useState("10");
    const [p4, setP4] = useState("20");

    const totalPremium = calculateTotalPremium([p1, p2, p3, p4]);

    // Address State
    const [oras, setOras] = useState("");
    const [strada, setStrada] = useState("");
    const [nr, setNr] = useState("");
    const [bl, setBl] = useState("");
    const [sc, setSc] = useState("");
    const [et, setEt] = useState("");
    const [ap, setAp] = useState("");

    // Alt Location State
    const [altLocalitate, setAltLocalitate] = useState(COUNTIES[0]);
    const [altOras, setAltOras] = useState("");
    const [altStrada, setAltStrada] = useState("");
    const [altNr, setAltNr] = useState("");
    const [altBl, setAltBl] = useState("");
    const [altSc, setAltSc] = useState("");
    const [altEt, setAltEt] = useState("");
    const [altAp, setAltAp] = useState("");
    const [altPropertyType, setAltPropertyType] = useState("Casa"); // "Casa" | "Apartament" | "Imobil-altul"

    // Detailed Property Fields
    const [structureYear, setStructureYear] = useState("");
    const [dwellingType, setDwellingType] = useState("Permanenta"); // "Permanenta" | "Temporara"
    const [hasAlarm, setHasAlarm] = useState("Nu");
    const [rooms, setRooms] = useState("");
    const [outbuildings, setOutbuildings] = useState("");
    const [surface, setSurface] = useState("");
    const [floors, setFloors] = useState("");
    const [structureMaterial, setStructureMaterial] = useState("Beton/Prefabricate");
    const [hasDamageHistory, setHasDamageHistory] = useState("Nu");
    const [valuationType, setValuationType] = useState("Valoarea de piata");
    const [buildingId, setBuildingId] = useState("");

    const getExpiryDate = (start: string) => {
        if (!start) return "";
        const date = new Date(start);
        date.setFullYear(date.getFullYear() + 1);
        // Subtract one day to make it exactly one year (e.g. Jan 1 to Dec 31)
        date.setDate(date.getDate() - 1);
        return date.toISOString().split('T')[0];
    };

    const expiryDate = getExpiryDate(startDate);

    const validateCNP = (cnp: string) => {
        if (!cnp || cnp.length !== 13 || !/^\d+$/.test(cnp)) {
            return false;
        }

        const controlKey = "279146358279";
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(cnp[i]) * parseInt(controlKey[i]);
        }

        const remainder = sum % 11;
        const checkDigit = remainder === 10 ? 1 : remainder;

        if (checkDigit !== parseInt(cnp[12])) {
            return false;
        }

        return true;
    };

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setCnpError("");

        const formData = new FormData(e.currentTarget);
        const cnp = formData.get("cnp") as string;

        if (!validateCNP(cnp)) {
            setCnpError("Codul Numeric Personal (CNP) este invalid. Te rugăm să verifici.");
            setLoading(false);
            return;
        }

        const localitate = formData.get("localitate") as string;
        const oras = formData.get("oras");
        const addressBase = `${localitate}, ${oras ? `Oras ${oras}, ` : ""}Str. ${formData.get("strada")}, Nr. ${formData.get("nr")}, Et. ${formData.get("et")}, Ap. ${formData.get("ap")}`;

        const data = {
            holder: formData.get("holder"),
            type: formData.get("type"),
            address: addressBase,
            startDate: formData.get("startDate"),
            expiry: expiryDate, // Automatically calculated
            cnp: cnp,
            phone: formData.get("phone"),
            email: formData.get("email"),
            insuredLocations: insuredLocations,
            // Collect all other entries as details
            details: Object.fromEntries(Array.from(formData.entries()).filter(([key]) =>
                !['holder', 'type', 'startDate', 'expiry', 'phone', 'email'].includes(key)))
        };

        await fetch('/api/policies', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        setLoading(false);
        router.push('/policies');
        router.refresh();
    }

    const constructedAddress = `${selectedCounty}, ${(!selectedCounty.startsWith("București") && oras) ? `Oras ${oras}, ` : ""}Str. ${strada}, Nr. ${nr}${bl ? `, Bl. ${bl}` : ""}${sc ? `, Sc. ${sc}` : ""}${et ? `, Et. ${et}` : ""}${ap ? `, Ap. ${ap}` : ""}`;

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            <h1 className="text-3xl font-bold mb-8">Create New Policy</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Policy Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* LEFT COLUMN: Main Details */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="holder">Nume Asigurat</Label>
                                    <Input id="holder" name="holder" placeholder="e.g. Ion Popescu" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Tip Asigurare</Label>
                                    <select
                                        id="type"
                                        name="type"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                    >
                                        <option value="Home Insurance (Facultativa)">Home Insurance (Facultativa)</option>
                                        <option value="Asigurarea PAD">Asigurarea PAD</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cnp">CNP</Label>
                                    <Input
                                        id="cnp"
                                        name="cnp"
                                        placeholder="e.g. 1900101..."
                                        required
                                        onChange={() => setCnpError("")}
                                        className={cnpError ? "border-red-500 focus-visible:ring-red-500" : ""}
                                    />
                                    {cnpError && (
                                        <p className="text-sm text-red-500 font-medium">{cnpError}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefon</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        placeholder="07xx..."
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="email@exemplu.ro"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="startDate" className="font-bold">Data Inceput Polita</Label>
                                    <Input
                                        id="startDate"
                                        name="startDate"
                                        type="date"
                                        required
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                    {startDate && (
                                        <div className="text-sm text-green-600 font-medium mt-1">
                                            Valabilitate: {startDate} — {expiryDate}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="localitate">Localitate</Label>
                                    <select
                                        id="localitate"
                                        name="localitate"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedCounty}
                                        onChange={(e) => setSelectedCounty(e.target.value)}
                                    >
                                        {COUNTIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                {!selectedCounty.startsWith("București") && (
                                    <div className="space-y-2">
                                        <Label htmlFor="oras">Oras</Label>
                                        <Input
                                            id="oras"
                                            name="oras"
                                            placeholder="Predeal"
                                            required
                                            value={oras}
                                            onChange={(e) => setOras(e.target.value)}
                                        />
                                    </div>
                                )}


                                <div className="space-y-2 col-span-2">
                                    <Label>Adresa Detaliata</Label>
                                    <div className="grid grid-cols-6 gap-4">
                                        <div className="col-span-6">
                                            <Input
                                                name="strada"
                                                placeholder="Strada"
                                                required
                                                value={strada}
                                                onChange={(e) => setStrada(e.target.value)}
                                            />
                                        </div>
                                        <Input
                                            name="nr"
                                            placeholder="Nr."
                                            required
                                            value={nr}
                                            onChange={(e) => setNr(e.target.value)}
                                        />
                                        <Input
                                            name="bl"
                                            placeholder="Bl."
                                            value={bl}
                                            onChange={(e) => setBl(e.target.value)}
                                        />
                                        <Input
                                            name="sc"
                                            placeholder="Sc."
                                            value={sc}
                                            onChange={(e) => setSc(e.target.value)}
                                        />
                                        <Input
                                            name="et"
                                            placeholder="Et."
                                            value={et}
                                            onChange={(e) => setEt(e.target.value)}
                                        />
                                        <Input
                                            name="ap"
                                            placeholder="Ap."
                                            value={ap}
                                            onChange={(e) => setAp(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Locatia asigurata</Label>
                                    <div className="flex gap-4 mb-2">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="locationSource"
                                                value="domiciliu"
                                                checked={locationSource === "domiciliu"}
                                                onChange={() => {
                                                    setLocationSource("domiciliu");
                                                    // Pre-fill with main address
                                                    setAltLocalitate(selectedCounty);
                                                    setAltOras(oras);
                                                    setAltStrada(strada);
                                                    setAltNr(nr);
                                                    setAltBl(bl);
                                                    setAltSc(sc);
                                                    setAltEt(et);
                                                    setAltAp(ap);
                                                }}
                                                className="form-radio h-4 w-4 text-primary"
                                            />
                                            <span className="text-sm font-medium">Domiciliu (adresa de mai sus)</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="locationSource"
                                                value="alta"
                                                checked={locationSource === "alta"}
                                                onChange={() => {
                                                    setLocationSource("alta");
                                                    // Clear fields
                                                    setAltLocalitate(COUNTIES[0]);
                                                    setAltOras("");
                                                    setAltStrada("");
                                                    setAltNr("");
                                                    setAltBl("");
                                                    setAltSc("");
                                                    setAltEt("");
                                                    setAltAp("");
                                                    setAltPropertyType("Casa");
                                                    setStructureYear("");
                                                    setDwellingType("Permanenta");
                                                    setHasAlarm("Nu");
                                                    setRooms("");
                                                    setOutbuildings("");
                                                    setSurface("");
                                                    setFloors("");
                                                    setStructureMaterial("Beton/Prefabricate");
                                                    setHasDamageHistory("Nu");
                                                    setValuationType("Valoarea de piata");
                                                    setBuildingId("");
                                                }}
                                                className="form-radio h-4 w-4 text-primary"
                                            />
                                            <span className="text-sm font-medium">Alta locatie</span>
                                        </label>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="flex-1 space-y-2 border p-3 rounded-md bg-gray-50">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className={`space-y-2 ${altLocalitate.startsWith("București") ? "col-span-2" : ""}`}>
                                                    <Label htmlFor="altLocalitate">Localitate</Label>
                                                    <select
                                                        id="altLocalitate"
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                                        value={altLocalitate}
                                                        onChange={(e) => setAltLocalitate(e.target.value)}
                                                    >
                                                        {COUNTIES.map((c) => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {!altLocalitate.startsWith("București") && (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="altOras">Oras</Label>
                                                        <Input
                                                            id="altOras"
                                                            value={altOras}
                                                            onChange={(e) => setAltOras(e.target.value)}
                                                            placeholder="Oras"
                                                        />
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
                                                                name="altPropertyType"
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

                                            {/* Detailed Fields Grid */}
                                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                                <div className="space-y-2">
                                                    <Label>An construcție</Label>
                                                    <Input value={structureYear} onChange={e => setStructureYear(e.target.value)} placeholder="ex. 1977" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Tip locuință</Label>
                                                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={dwellingType} onChange={e => setDwellingType(e.target.value)}>
                                                        <option value="Permanenta">Permanenta</option>
                                                        <option value="Temporara">Temporara</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Suprafață utilă (mp)</Label>
                                                    <Input value={surface} onChange={e => setSurface(e.target.value)} placeholder="ex. 64" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Număr de camere</Label>
                                                    <Input value={rooms} onChange={e => setRooms(e.target.value)} placeholder="ex. 3" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Număr de etaje</Label>
                                                    <Input value={floors} onChange={e => setFloors(e.target.value)} placeholder="ex. 11-20" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Structura de rezistență</Label>
                                                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={structureMaterial} onChange={e => setStructureMaterial(e.target.value)}>
                                                        <option value="Beton/Prefabricate">Beton/Prefabricate</option>
                                                        <option value="Caramida/Piatra">Caramida/Piatra</option>
                                                        <option value="Lemn">Lemn</option>
                                                        <option value="Metal">Metal</option>
                                                        <option value="Altele">Altele</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Număr clădiri</Label>
                                                    <Input value={outbuildings} onChange={e => setOutbuildings(e.target.value)} placeholder="ex. 1" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Tip sumă asigurată</Label>
                                                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={valuationType} onChange={e => setValuationType(e.target.value)}>
                                                        <option value="Valoarea de piata">Valoarea de piata</option>
                                                        <option value="Valoarea de inlocuire">Valoarea de inlocuire</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Identificarea clădirii</Label>
                                                    <Input value={buildingId} onChange={e => setBuildingId(e.target.value)} placeholder="Identificare..." />
                                                </div>
                                                <div className="space-y-2 col-span-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="flex-1">Ai sistem de alarmă conectat la o firmă de pază?</Label>
                                                        <div className="flex gap-4">
                                                            <label className="flex items-center space-x-2">
                                                                <input type="radio" checked={hasAlarm === "Da"} onChange={() => setHasAlarm("Da")} className="form-radio" />
                                                                <span>Da</span>
                                                            </label>
                                                            <label className="flex items-center space-x-2">
                                                                <input type="radio" checked={hasAlarm === "Nu"} onChange={() => setHasAlarm("Nu")} className="form-radio" />
                                                                <span>Nu</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 col-span-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="flex-1">Istoric daune (ultimii 3 ani)?</Label>
                                                        <div className="flex gap-4">
                                                            <label className="flex items-center space-x-2">
                                                                <input type="radio" checked={hasDamageHistory === "Da"} onChange={() => setHasDamageHistory("Da")} className="form-radio" />
                                                                <span>Da</span>
                                                            </label>
                                                            <label className="flex items-center space-x-2">
                                                                <input type="radio" checked={hasDamageHistory === "Nu"} onChange={() => setHasDamageHistory("Nu")} className="form-radio" />
                                                                <span>Nu</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2 border-t pt-4">
                                                <Label>Adresa</Label>
                                                <div className="grid grid-cols-6 gap-2">
                                                    <div className="col-span-6">
                                                        <Input
                                                            placeholder="Strada"
                                                            value={altStrada}
                                                            onChange={(e) => setAltStrada(e.target.value)}
                                                        />
                                                    </div>
                                                    <Input
                                                        placeholder="Nr."
                                                        value={altNr}
                                                        onChange={(e) => setAltNr(e.target.value)}
                                                    />
                                                    <Input
                                                        placeholder="Bl."
                                                        value={altBl}
                                                        onChange={(e) => setAltBl(e.target.value)}
                                                    />
                                                    <Input
                                                        placeholder="Sc."
                                                        value={altSc}
                                                        onChange={(e) => setAltSc(e.target.value)}
                                                    />
                                                    <Input
                                                        placeholder="Et."
                                                        value={altEt}
                                                        onChange={(e) => setAltEt(e.target.value)}
                                                    />
                                                    <Input
                                                        placeholder="Ap."
                                                        value={altAp}
                                                        onChange={(e) => setAltAp(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <Button type="button" onClick={() => {
                                                    if (altStrada && altNr) {
                                                        const detailsParts = [
                                                            structureYear ? `An: ${structureYear}` : '',
                                                            surface ? `${surface}mp` : '',
                                                            rooms ? `${rooms} cam` : '',
                                                            floors ? `Etaje: ${floors}` : '',
                                                            structureMaterial ? `Structura: ${structureMaterial}` : '',
                                                            dwellingType ? `Tip: ${dwellingType}` : '',
                                                            hasAlarm === "Da" ? "Alarmă: Da" : '',
                                                            hasDamageHistory === "Da" ? "Daune: Da" : ''
                                                        ].filter(Boolean).join(", ");

                                                        const constructedAlt = `${altPropertyType}: ${altLocalitate}, ${(!altLocalitate.startsWith("București") && altOras) ? `Oras ${altOras}, ` : ""}Str. ${altStrada}, Nr. ${altNr}${altBl ? `, Bl. ${altBl}` : ""}${altSc ? `, Sc. ${altSc}` : ""}${altEt ? `, Et. ${altEt}` : ""}${altAp ? `, Ap. ${altAp}` : ""} [${detailsParts}]`;

                                                        const exists = insuredLocations.includes(constructedAlt);
                                                        if (!exists) {
                                                            setInsuredLocations([...insuredLocations, constructedAlt]);
                                                            // Reset fields
                                                            setAltLocalitate(COUNTIES[0]);
                                                            setAltOras("");
                                                            setAltStrada("");
                                                            setAltNr("");
                                                            setAltBl("");
                                                            setAltSc("");
                                                            setAltEt("");
                                                            setAltAp("");
                                                            setAltPropertyType("Casa");

                                                            // Reset detailed fields
                                                            setStructureYear("");
                                                            setDwellingType("Permanenta");
                                                            setHasAlarm("Nu");
                                                            setRooms("");
                                                            setOutbuildings("");
                                                            setSurface("");
                                                            setFloors("");
                                                            setStructureMaterial("Beton/Prefabricate");
                                                            setHasDamageHistory("Nu");
                                                            setValuationType("Valoarea de piata");
                                                            setBuildingId("");
                                                            // Optionally reset source to 'alta' or just keep current state? logic suggests reset is fine, but maybe user wants to add multiple Domiciliu (unlikely).
                                                            // If I reset here, radio might stay on 'domiciliu' but fields clear.
                                                            // But if user expects 'domiciliu' to stay pre-filled, clearing it might be confusing if radio says 'domiciliu'.
                                                            // For now standard behavior: add -> clear form.
                                                        }
                                                    }
                                                }} size="sm" disabled={!altStrada || !altNr}>
                                                    Add Location
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    {insuredLocations.length > 0 && (
                                        <ul className="text-sm space-y-1 mt-2">
                                            {insuredLocations.map((loc, idx) => (
                                                <li key={idx} className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded">
                                                    <span>{loc}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setInsuredLocations(insuredLocations.filter((_, i) => i !== idx))}
                                                        className="text-red-500 font-bold ml-2"
                                                    >
                                                        &times;
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>


                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Creating..." : "Create Policy"}
                            </Button>
                        </div>

                        {/* RIGHT COLUMN: Contract Details */}
                        <div className="border rounded-md p-4 bg-gray-50 space-y-4 h-fit">
                            {selectedType === "Home Insurance (Facultativa)" ? (
                                <>
                                    <h3 className="font-bold text-lg border-b pb-2 text-orange-600">Acoperiri</h3>
                                    <div className="space-y-4">
                                        {/* Coverage 1: Imobil */}
                                        <div className="border rounded-md p-3 space-y-2">
                                            <p className="font-medium text-sm">Imobil locuință/construcții anexe/echipamente fixe/Cota-parte indiviză</p>
                                            <details className="text-xs text-gray-500">
                                                <summary className="cursor-pointer text-blue-600 hover:underline">Riscuri asigurate ▾</summary>
                                                <p className="mt-1">Asigurarea de bază - Flexa (incendiu, trăsnet, explozie, căderea aparatelor de zbor); fenomene naturale (furtună, uragan, vijelie, tornadă, grindină, greutate strat zăpadă, ploaie torențială, avalanșă); fenomene catastrofice (cutremur, inundații și aluviuni, alunecare și/sau prăbușire de teren); furt, vandalism, evenimente socio-politice; boom sonic; izbirea din exterior de vehicule, inundație de la vecini și cădere accidentală de corpuri; inundație și refulare canalizare*; spargerea bunurilor casabile*; cheltuieli suplimentare**.</p>
                                            </details>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <Label className="text-xs text-gray-500">Sumă asigurată</Label>
                                                    <Input name="acoperiri_suma_asigurata" defaultValue="135000 EUR" className="h-8 text-sm" />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-gray-500">Franșiză</Label>
                                                    <textarea
                                                        name="acoperiri_fransiza"
                                                        defaultValue="100.000 RON (echiv. EUR la cursul BNR) pentru riscurile de cutremur de pământ, alunecare și/sau prăbușire de teren și inundație din cauze naturale"
                                                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-gray-500">Prima (EUR)</Label>
                                                    <Input name="acoperiri_prima" value={p1} onChange={(e) => setP1(e.target.value)} className="h-8 text-sm" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Coverage 2: Conținut */}
                                        <div className="border rounded-md p-3 space-y-2">
                                            <p className="font-medium text-sm">Asigurarea conținutului</p>
                                            <details className="text-xs text-gray-500">
                                                <summary className="cursor-pointer text-blue-600 hover:underline">Riscuri asigurate ▾</summary>
                                                <p className="mt-1">Asigurarea de bază - Flexa (incendiu, trăsnet, explozie, căderea aparatelor de zbor); fenomene naturale (furtună, uragan, vijelie, tornadă, grindină, greutate strat zăpadă, ploaie torențială, avalanșă); fenomene catastrofice (cutremur, inundații și aluviuni, alunecare și/sau prăbușire de teren); furt, vandalism, evenimente socio-politice; boom sonic; izbirea din exterior de vehicule, inundație de la vecini și cădere accidentală de corpuri; inundație și refulare canalizare*; spargerea bunurilor casabile*; cheltuieli suplimentare**.</p>
                                            </details>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <Label className="text-xs text-gray-500">Sumă asigurată</Label>
                                                    <Input name="acoperiri_continut_suma" defaultValue="20250 EUR" className="h-8 text-sm" />
                                                </div>
                                                <div></div>
                                                <div>
                                                    <Label className="text-xs text-gray-500">Prima (EUR)</Label>
                                                    <Input name="acoperiri_continut_prima" value={p2} onChange={(e) => setP2(e.target.value)} className="h-8 text-sm" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Coverage 3: Răspundere civilă */}
                                        <div className="border rounded-md p-3 space-y-2">
                                            <p className="font-medium text-sm">Răspundere civilă față de terți</p>
                                            <p className="text-xs text-gray-500">Conform prevederilor din Condițiile de asigurare</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <Label className="text-xs text-gray-500">Sumă asigurată</Label>
                                                    <Input name="acoperiri_raspundere_suma" defaultValue="5000 EUR" className="h-8 text-sm" />
                                                </div>
                                                <div></div>
                                                <div>
                                                    <Label className="text-xs text-gray-500">Prima (EUR)</Label>
                                                    <Input name="acoperiri_raspundere_prima" value={p3} onChange={(e) => setP3(e.target.value)} className="h-8 text-sm" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Coverage 4: Avarii accidentale */}
                                        <div className="border rounded-md p-3 space-y-2">
                                            <p className="font-medium text-sm">Avarii accidentale ale instalațiilor de gaze, centrală termică, climatizare etc. și asigurarea aparatelor electrice, electronice și electrocasnice</p>
                                            <p className="text-xs text-gray-500">Conform prevederilor din Condițiile de asigurare</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <Label className="text-xs text-gray-500">Sumă asigurată</Label>
                                                    <Input name="acoperiri_avarii_suma" defaultValue="1000 EUR" className="h-8 text-sm" />
                                                </div>
                                                <div></div>
                                                <div>
                                                    <Label className="text-xs text-gray-500">Prima (EUR)</Label>
                                                    <Input name="acoperiri_avarii_prima" value={p4} onChange={(e) => setP4(e.target.value)} className="h-8 text-sm" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Total */}
                                        <div className="border-t pt-3 flex items-center justify-between">
                                            <span className="font-bold text-sm">Total primă de asigurare</span>
                                            <Input
                                                name="acoperiri_total_prima"
                                                value={totalPremium}
                                                readOnly
                                                className="h-8 text-sm font-bold bg-gray-100 w-32 text-right"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-3 text-xs text-gray-500 italic space-y-1">
                                        <p>*În limita maximă de despăgubire de 1.500 EUR (echivalent în lei) pentru Asigurare pe fiecare risc asigurat</p>
                                        <p>**În limita maximă de 5% din suma asigurată pentru imobil. Despăgubirea totală în legătură cu dauna nu poate depăși suma asigurată a imobilului asigurat înscrisă în Polița de Asigurare.</p>
                                    </div>
                                </>
                            ) : (
                                <h3 className="font-bold text-lg border-b pb-2">ASIGURAREA OBLIGATORIE PAD</h3>
                            )}
                        </div>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
