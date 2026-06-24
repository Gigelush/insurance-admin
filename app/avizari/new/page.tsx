"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RISCURI_ASIGURATE } from "@/lib/riscuri";
import { ShieldCheck } from "lucide-react";

export default function NewAvizarePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [policies, setPolicies] = useState<any[]>([]);
    const [filteredPolicies, setFilteredPolicies] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedPolicyId, setSelectedPolicyId] = useState("");
    const [holderName, setHolderName] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [selectedRisc, setSelectedRisc] = useState<string>("");
    const [dataAvizare] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    // Fetch policies on mount
    useEffect(() => {
        fetch('/api/policies')
            .then(res => res.json())
            .then(data => {
                setPolicies(data);
                setFilteredPolicies(data);
            });
    }, []);

    const handlePolicyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSelectedPolicyId(value);

        const filtered = policies.filter(p =>
            p.id.toLowerCase().includes(value.toLowerCase()) ||
            p.holder.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredPolicies(filtered);
        setShowSuggestions(true);
    };

    const selectPolicy = (policy: any) => {
        setSelectedPolicyId(policy.id);
        setHolderName(policy.holder);
        setShowSuggestions(false);
    };

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        const data = {
            policyId: selectedPolicyId,
            holderName: holderName,
            date: formData.get("date"),
            time: formData.get("time"),
            cause: selectedRisc || undefined,
            description: formData.get("description"),
            dataAvizare: dataAvizare,
        };

        await fetch('/api/avizari', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        setLoading(false);
        router.push('/avizari');
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Avizare Nouă</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Detalii Eveniment</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="space-y-2 relative">
                            <Label htmlFor="policyId">Serie Poliță</Label>
                            <Input
                                id="policyId"
                                name="policyId"
                                placeholder="ex. RO-123456"
                                required
                                value={selectedPolicyId}
                                onChange={handlePolicyChange}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                autoComplete="off"
                            />
                            {showSuggestions && filteredPolicies.length > 0 && (
                                <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto mt-1">
                                    {filteredPolicies.map(policy => (
                                        <div
                                            key={policy.id}
                                            className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                                            onClick={() => selectPolicy(policy)}
                                        >
                                            <div className="font-medium">{policy.id}</div>
                                            <div className="text-xs text-gray-500">{policy.holder} — {policy.type}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="holderName">Nume Asigurat</Label>
                                <Input
                                    id="holderName"
                                    name="holderName"
                                    placeholder="ex. Ion Popescu"
                                    required
                                    value={holderName}
                                    onChange={(e) => setHolderName(e.target.value)}
                                />
                            </div>
                            {selectedPolicyId && (() => {
                                const policy = policies.find((p: any) => p.id === selectedPolicyId);
                                const phone = policy?.phone || policy?.details?.phone;
                                if (!phone) return null;
                                return (
                                    <div className="space-y-2">
                                        <Label>Telefon Asigurat</Label>
                                        <div className="p-2.5 rounded-md border bg-gray-50 text-sm font-medium text-gray-800">
                                            {phone}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Adresă completă din poliță */}
                        {selectedPolicyId && policies.find(p => p.id === selectedPolicyId) && (() => {
                            const policy = policies.find((p: any) => p.id === selectedPolicyId);
                            if (!policy) return null;

                            // Prioritate: Locația asigurată > Adresa Detaliată
                            const insuredAddr = policy.insuredLocations && policy.insuredLocations.length > 0
                                ? policy.insuredLocations.join('; ')
                                : null;
                            const detailedAddr = policy.address || policy.details?.localitate || null;
                            const displayAddr = insuredAddr || detailedAddr;

                            if (!displayAddr) return null;

                            return (
                                <div className="space-y-2">
                                    <Label>Adresa Locație Asigurată</Label>
                                    <div className="p-3 rounded-md border bg-blue-50 border-blue-200 text-blue-800 text-sm">
                                        <p className="font-medium">{displayAddr}</p>
                                        <p className="text-xs text-blue-500 mt-1">
                                            {insuredAddr ? 'Din: Locația Asigurată' : 'Din: Adresa Detaliată'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Validity Check Display */}
                        {selectedPolicyId && policies.find(p => p.id === selectedPolicyId) && (() => {
                            const policy = policies.find(p => p.id === selectedPolicyId);
                            if (!policy) return null;

                            const start = new Date(policy.startDate);
                            const end = new Date(policy.expiry);

                            let isEventDateValid = true;
                            if (eventDate) {
                                const evt = new Date(eventDate);
                                isEventDateValid = evt >= start && evt <= end;
                            }

                            return (
                                <div className="space-y-2">
                                    <div className={`p-3 rounded-md border ${isEventDateValid ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                                        <p className="text-sm font-bold">
                                            Valabilitate Poliță: <span>{policy.startDate} — {policy.expiry}</span>
                                        </p>
                                        {!isEventDateValid && (
                                            <p className="text-xs font-bold mt-1">
                                                EROARE: Data evenimentului ({eventDate}) nu este în perioada de valabilitate a poliței!
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="space-y-2">
                            <Label>Data Avizare</Label>
                            <div className="p-3 rounded-md border bg-gray-50 text-sm font-medium text-gray-800">
                                {dataAvizare}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="time">Ora Evenimentului</Label>
                                <Input
                                    id="time"
                                    name="time"
                                    type="time"
                                    required
                                    className="block w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">Data Evenimentului</Label>
                                <Input
                                    id="date"
                                    name="date"
                                    type="date"
                                    required
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Risc + Descriere */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="risc" className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-orange-500" />
                                    Tip Risc / Cauza Evenimentului
                                </Label>
                                <select
                                    id="risc"
                                    name="risc"
                                    value={selectedRisc}
                                    onChange={(e) => setSelectedRisc(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">— Selectează riscul —</option>
                                    {RISCURI_ASIGURATE.map((risc) => (
                                        <option key={risc} value={risc}>{risc}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descriere Eveniment</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Descrieți pe scurt ce s-a întâmplat..."
                                    className="min-h-[100px]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>Anulează</Button>
                            <Button type="submit" disabled={loading || (() => {
                                if (!eventDate || !selectedPolicyId) return false;
                                const policy = policies.find(p => p.id === selectedPolicyId);
                                if (!policy) return true;
                                const start = new Date(policy.startDate);
                                const end = new Date(policy.expiry);
                                const evt = new Date(eventDate);
                                return !(evt >= start && evt <= end);
                            })()}>
                                {loading ? "Se procesează..." : "Salvează Avizare"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
