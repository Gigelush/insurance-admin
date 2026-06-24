"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Database, Shield, Bell, Save, CheckCircle, Brain, FileText, Trash2, Upload } from "lucide-react";

export default function SettingsPage() {
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        companyName: "Build'n Claims",
        defaultReserveMaterials: "3000",
        defaultReserveContractor: "500",
        notificationsEnabled: true,
        autoBackup: true,
        geminiApiKey: "",
        policyConditions: null as null | { name: string; type: string; content: string; size?: number }
    });

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setSettings(prev => ({
                        ...prev,
                        ...data,
                        // Ensure we fallback to defaults if keys are missing
                        companyName: data.companyName || "Build'n Claims",
                        defaultReserveMaterials: data.defaultReserveMaterials || "3000",
                        defaultReserveContractor: data.defaultReserveContractor || "500",
                        notificationsEnabled: data.notificationsEnabled !== undefined ? data.notificationsEnabled : true,
                        autoBackup: data.autoBackup !== undefined ? data.autoBackup : true,
                        geminiApiKey: data.geminiApiKey || "",
                        policyConditions: data.policyConditions || null
                    }));
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch settings:", err);
                setLoading(false);
            });
    }, []);

    const handleSave = async () => {
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            } else {
                alert("Eroare la salvarea setărilor.");
            }
        } catch (err) {
            console.error("Failed to save settings:", err);
            alert("Eroare de conexiune la salvare.");
        }
    };

    const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            alert("Vă rugăm să selectați un fișier în format PDF!");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            setSettings(s => ({
                ...s,
                policyConditions: {
                    name: file.name,
                    type: file.type,
                    content: result,
                    size: file.size
                }
            }));
        };
        reader.onerror = () => {
            alert("Eroare la citirea fișierului.");
        };
        reader.readAsDataURL(file);
    };

    const handleDeletePdf = () => {
        if (confirm("Sigur dorești să ștergi condițiile de asigurare încărcate? OPINIUS nu le va mai putea accesa.")) {
            setSettings(s => ({
                ...s,
                policyConditions: null
            }));
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center h-full">
                <p className="text-gray-500 font-medium">Se încarcă setările...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Settings className="w-7 h-7 text-orange-500" />
                        Setări
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Configurări generale ale platformei</p>
                </div>
                <Button onClick={handleSave} className="gap-2 bg-orange-500 hover:bg-orange-600">
                    {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? "Salvat!" : "Salvează"}
                </Button>
            </div>

            <div className="space-y-6">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Database className="w-5 h-5 text-blue-500" />
                            General
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Nume Companie</Label>
                                <Input
                                    id="companyName"
                                    value={settings.companyName}
                                    onChange={(e) => setSettings(s => ({ ...s, companyName: e.target.value }))}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* OPINIUS AI Agent Settings */}
                <Card className="border-orange-200 bg-orange-50/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base text-orange-600 font-bold">
                            <Brain className="w-5 h-5" />
                            Configurare Agent AI (OPINIUS)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="geminiApiKey" className="font-semibold">Cheie API Gemini (Google AI Studio)</Label>
                                <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-xs text-orange-600 underline hover:text-orange-700">
                                    Obține o cheie API gratuită
                                </a>
                            </div>
                            <Input
                                id="geminiApiKey"
                                type="password"
                                placeholder="AIzaSy..."
                                value={settings.geminiApiKey}
                                onChange={(e) => setSettings(s => ({ ...s, geminiApiKey: e.target.value }))}
                            />
                            <p className="text-xs text-gray-500">
                                Cheia API este stocată local în fișierul `db.json` al aplicației. Dacă este lăsată goală, OPINIUS va rula în modul **Demo** (simulat).
                            </p>
                        </div>

                        <div className="border-t border-orange-100 pt-4 space-y-4">
                            <Label className="font-semibold">Condiții de Asigurare Locuință (Învățare Document PDF)</Label>
                            
                            {settings.policyConditions ? (
                                <div className="flex items-center justify-between p-4 bg-white border border-orange-200 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800 truncate max-w-md">{settings.policyConditions.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {settings.policyConditions.size ? `${(settings.policyConditions.size / 1024 / 1024).toFixed(2)} MB` : "Tip PDF"} · Învățat cu succes
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleDeletePdf}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-orange-200 bg-white rounded-lg text-gray-400">
                                    <FileText className="w-8 h-8 mb-2 opacity-50 text-orange-400" />
                                    <p className="text-sm font-medium text-gray-700">Nu au fost încărcate Condițiile de Asigurare</p>
                                    <p className="text-xs text-gray-400 mb-4 text-center max-w-sm">
                                        Încarcă fișierul PDF cu normele și clauzele de asigurare pentru ca OPINIUS să poată decide dacă dosarul este eligibil.
                                    </p>
                                    <label
                                        htmlFor="pdf-upload"
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 h-9 px-4 gap-2 cursor-pointer"
                                    >
                                        <Upload className="w-4 h-4" /> Alege Fișier PDF
                                    </label>
                                    <input
                                        id="pdf-upload"
                                        type="file"
                                        accept="application/pdf"
                                        className="hidden"
                                        onChange={handlePdfUpload}
                                    />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Reserve Defaults */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Shield className="w-5 h-5 text-green-500" />
                            Rezerve Implicite (RON)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="materials">Materiale</Label>
                                <Input
                                    id="materials"
                                    type="number"
                                    value={settings.defaultReserveMaterials}
                                    onChange={(e) => setSettings(s => ({ ...s, defaultReserveMaterials: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contractor">Manoperă</Label>
                                <Input
                                    id="contractor"
                                    type="number"
                                    value={settings.defaultReserveContractor}
                                    onChange={(e) => setSettings(s => ({ ...s, defaultReserveContractor: e.target.value }))}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Bell className="w-5 h-5 text-orange-500" />
                            Notificări
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Notificări Email</p>
                                <p className="text-xs text-gray-500">Primește email la fiecare dosar nou</p>
                            </div>
                            <button
                                className={`relative w-11 h-6 rounded-full transition-colors ${settings.notificationsEnabled ? 'bg-orange-500' : 'bg-gray-300'}`}
                                onClick={() => setSettings(s => ({ ...s, notificationsEnabled: !s.notificationsEnabled }))}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Backup Automat</p>
                                <p className="text-xs text-gray-500">Salvare automată zilnică a bazei de date</p>
                            </div>
                            <button
                                className={`relative w-11 h-6 rounded-full transition-colors ${settings.autoBackup ? 'bg-orange-500' : 'bg-gray-300'}`}
                                onClick={() => setSettings(s => ({ ...s, autoBackup: !s.autoBackup }))}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.autoBackup ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
