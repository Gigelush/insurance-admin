"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewClaimPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [policies, setPolicies] = useState<any[]>([]);
    const [filteredPolicies, setFilteredPolicies] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedPolicyId, setSelectedPolicyId] = useState("");
    const [holderName, setHolderName] = useState("");
    const [eventDate, setEventDate] = useState("");

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

        // Filter policies
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
            policyId: selectedPolicyId, // Use state value
            holderName: holderName,     // Use state value
            // type: "N/A", // Removed from UI
            date: formData.get("date"),
            time: formData.get("time"), // New field
            description: formData.get("description"),
            status: "Deschis",
            submittedAt: new Date().toISOString(),
        };

        // Post to API
        await fetch('/api/claims', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        setLoading(false);
        router.push('/claims');
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Deschide Dosar de Daună</h1>
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
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
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

                        {/* Validity Check Display & Event Date Validation */}
                        {selectedPolicyId && policies.find(p => p.id === selectedPolicyId) && (() => {
                            const policy = policies.find(p => p.id === selectedPolicyId);
                            if (!policy) return null;

                            const start = new Date(policy.startDate);
                            const end = new Date(policy.expiry);

                            // Check if event date is within policy period
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
                                {loading ? "Se procesează..." : "Deschide Dosar"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
