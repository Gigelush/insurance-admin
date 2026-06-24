import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, CheckCircle, AlertTriangle, XCircle, FileText, Settings, ShieldAlert } from "lucide-react";

interface ClaimAiOpinionTabProps {
    claimId: string;
    onHistoryUpdate?: () => void;
}

export function ClaimAiOpinionTab({ claimId, onHistoryUpdate }: ClaimAiOpinionTabProps) {
    const [loading, setLoading] = useState(false);
    const [opinion, setOpinion] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);

    const fetchOpinionAndSettings = async () => {
        try {
            const [opRes, setRes] = await Promise.all([
                fetch(`/api/claims/${encodeURIComponent(claimId)}/opinius`),
                fetch('/api/settings')
            ]);
            if (opRes.ok) {
                const opData = await opRes.json();
                setOpinion(opData);
            }
            if (setRes.ok) {
                const setData = await setRes.json();
                setSettings(setData);
            }
        } catch (e) {
            console.error("Failed to fetch opinion or settings:", e);
        }
    };

    useEffect(() => {
        fetchOpinionAndSettings();
    }, [claimId]);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/claims/${encodeURIComponent(claimId)}/opinius`, {
                method: 'POST'
            });
            if (res.ok) {
                const data = await res.json();
                setOpinion(data);
                if (onHistoryUpdate) onHistoryUpdate();
            } else {
                alert("Eroare la generarea opiniei AI.");
            }
        } catch (e) {
            console.error(e);
            alert("Eroare de conexiune la server.");
        } finally {
            setLoading(false);
        }
    };

    const getVerdictStyle = (verdict: string) => {
        switch (verdict) {
            case "DE PLATĂ":
                return {
                    bg: "bg-green-50 border-green-200 text-green-700",
                    badge: "bg-green-500 hover:bg-green-600",
                    icon: <CheckCircle className="w-8 h-8 text-green-600" />
                };
            case "DE RESPINS":
                return {
                    bg: "bg-red-50 border-red-200 text-red-700",
                    badge: "bg-red-500 hover:bg-red-600",
                    icon: <XCircle className="w-8 h-8 text-red-600" />
                };
            default: // NECESITĂ INVESTIGAȚII
                return {
                    bg: "bg-yellow-50 border-yellow-200 text-yellow-700",
                    badge: "bg-yellow-500 hover:bg-yellow-600",
                    icon: <AlertTriangle className="w-8 h-8 text-yellow-600" />
                };
        }
    };

    const hasConditions = !!settings?.policyConditions;
    const keyTrimmed = settings?.geminiApiKey ? settings.geminiApiKey.trim() : "";
    const hasApiKey = !!keyTrimmed && (keyTrimmed.startsWith("AIzaSy") || keyTrimmed.startsWith("AQ."));

    return (
        <div className="space-y-6">
            {/* Status Panel */}
            <Card className="border-orange-100 bg-orange-50/10">
                <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white shadow-md animate-pulse">
                            <Brain className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                OPINIUS AI Agent
                                <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-none font-bold text-[10px]">
                                    V1.5
                                </Badge>
                            </h3>
                            <p className="text-sm text-gray-500">
                                Analizează dosarul curent (date, poze) raportat la clauzele contractuale pre-învățate.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Status elements */}
                        <div className="text-right text-xs space-y-1">
                            <div className="flex items-center justify-end gap-1.5 font-medium">
                                <span className="text-gray-400">Cheie API Gemini:</span>
                                {hasApiKey ? (
                                    <span className="text-green-600 flex items-center gap-1 font-semibold">
                                        <CheckCircle className="w-3.5 h-3.5" /> Conectat
                                    </span>
                                ) : (
                                    <span className="text-amber-600 flex items-center gap-1 font-semibold">
                                        <AlertTriangle className="w-3.5 h-3.5" /> Mod Demo
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-end gap-1.5 font-medium">
                                <span className="text-gray-400">Condiții Contractuale:</span>
                                {hasConditions ? (
                                    <span className="text-green-600 flex items-center gap-1 font-semibold" title={settings.policyConditions.name}>
                                        <FileText className="w-3.5 h-3.5" /> Învățate
                                    </span>
                                ) : (
                                    <span className="text-red-500 flex items-center gap-1 font-semibold">
                                        <XCircle className="w-3.5 h-3.5" /> Neîncărcate
                                    </span>
                                )}
                            </div>
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-md hover:shadow-lg transition-all gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            {loading ? "Se analizează..." : opinion ? "Re-analizează Dosarul" : "Generează Opinie"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Warning when Conditions or API key are missing */}
            {!hasConditions && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-sm flex gap-3 items-start shadow-sm">
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold">Atenție: Condițiile de Asigurare lipsesc!</p>
                        <p className="mt-1">
                            Pentru ca OPINIUS să poată efectua o analiză corectă și validă, este necesar să încarci regulile/condițiile de asigurare în format PDF în secțiunea de <a href="/settings" className="underline font-bold text-red-800">Setări</a>. 
                            În lipsa acestora, opinia generată va folosi date simulate standard.
                        </p>
                    </div>
                </div>
            )}

            {/* Loader */}
            {loading && (
                <Card className="p-12 flex flex-col items-center justify-center border-dashed border-2 border-orange-200 bg-orange-50/5">
                    <div className="w-12 h-12 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin mb-4" />
                    <h4 className="font-bold text-gray-800 text-base">OPINIUS analizează datele...</h4>
                    <p className="text-xs text-gray-500 mt-2 max-w-sm text-center">
                        Citim pozele încărcate, descrierea daunei și verificăm regulamentul de asigurări pentru emiterea deciziei.
                    </p>
                </Card>
            )}

            {/* Opinion Result */}
            {opinion && !loading && (
                <div className="grid grid-cols-3 gap-6">
                    {/* Left: Summary and Verdict */}
                    <div className="col-span-1 space-y-6">
                        {/* Verdict Card */}
                        {(() => {
                            const styles = getVerdictStyle(opinion.verdict);
                            return (
                                <Card className={`border ${styles.bg} shadow-sm overflow-hidden`}>
                                    <div className="p-6 text-center space-y-4">
                                        <p className="text-xs uppercase font-bold tracking-widest text-gray-500">Verdict Recomandat</p>
                                        <div className="flex justify-center">{styles.icon}</div>
                                        <Badge className={`${styles.badge} text-white font-bold text-sm px-4 py-1.5 shadow-sm`}>
                                            {opinion.verdict}
                                        </Badge>
                                        <div className="pt-2 border-t border-black/5">
                                            <p className="text-xs text-gray-400">Grad de Încredere AI</p>
                                            <div className="flex items-center justify-center gap-1.5 mt-1">
                                                <div className="w-24 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                                    <div className="bg-orange-500 h-full rounded-full" style={{ width: `${opinion.confidence}%` }} />
                                                </div>
                                                <span className="font-bold text-sm text-gray-700">{opinion.confidence}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })()}

                        {/* General details info */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-gray-500">Informații Analiză</CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs space-y-2.5">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-400">Mod Rulare:</span>
                                    <span className="font-semibold text-gray-700">{opinion.isDemo ? "Simulat (Demo)" : "API Real Gemini"}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-400">Dată Analiză:</span>
                                    <span className="font-semibold text-gray-700">{new Date(opinion.analyzedAt || new Date()).toLocaleString('ro-RO')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Referință T&C:</span>
                                    <span className="font-semibold text-gray-700 max-w-[150px] truncate" title={settings?.policyConditions?.name || "N/A"}>
                                        {settings?.policyConditions?.name || "Lipsă PDF"}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Technical Arguments & Articles */}
                    <div className="col-span-2 space-y-6">
                        {/* Summary & Key Arguments */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-orange-500" />
                                    Argumentare Tehnică
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-2">Rezumat Analiză</h4>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border leading-relaxed">
                                        {opinion.summary}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400">Argumente Cheie Constatate</h4>
                                    <ul className="space-y-2">
                                        {opinion.arguments?.map((arg: string, idx: number) => (
                                            <li key={idx} className="text-sm text-gray-600 flex gap-2.5 items-start">
                                                <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs shrink-0 font-bold mt-0.5">
                                                    {idx + 1}
                                                </span>
                                                <span className="leading-relaxed">{arg}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Articles & Conditions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-500" />
                                    Articole și Clauze Contractuale Aplicabile
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {opinion.articles && opinion.articles.length > 0 ? (
                                    <ul className="space-y-3">
                                        {opinion.articles.map((art: string, idx: number) => (
                                            <li key={idx} className="text-sm text-gray-700 bg-blue-50/50 border border-blue-100 p-3 rounded-lg flex gap-3 items-start">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
                                                <span className="font-medium">{art}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-400">Nu s-au detectat articole contractuale clare.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recommendations */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    Recomandări Inspector Daune
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {opinion.recommendations?.map((rec: string, idx: number) => (
                                        <li key={idx} className="text-sm text-gray-600 flex gap-2.5 items-start">
                                            <span className="w-2 h-2 bg-green-500 rounded-full shrink-0 mt-2" />
                                            <span className="leading-relaxed">{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
